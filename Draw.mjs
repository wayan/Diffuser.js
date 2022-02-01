import db from './DOMBuilder.mjs'
import {fmap, fc, fmap2, uriParams} from './Util.mjs'
import g from './Geometry.mjs'
import concave from './Concave.mjs'
import curve from './Curve.mjs'
import cp from './ConcaveParams.mjs'

import concaveParams    from './ConcaveParams.mjs'
import {extractPresets} from './MyPresets.mjs'

/* linestyles */

const styles = (()=>{
    const strokeWidth = 0.02;

    return {
        grid5:  { stroke: 'black', 'stroke-dasharray': '0.2 0.2',  'stroke-width': strokeWidth / 2 },
        grid:   { stroke:'black', 'stroke-dasharray': '0.05 0.05', 'stroke-width': strokeWidth / 4 },
        sketch: {fill: 'none', stroke: 'red', 'stroke-width': strokeWidth},
        diffuser: { stroke: 'green' },
        reflector: { stroke: 'blue' },
        none:   {}
    }
})();

function boudingBox(points){
    return [ Math.min, Math.max ].map(f => points.reduce(fmap2(f)))
}

function svgElem(points, content = [], opts = {}){
    const bbox = boudingBox( points ), [from, size] = viewBox( bbox )

    opts = { grid: true, ... opts }

    const svg = db.buildSvg(
        'svg',
        {
            viewBox: [ ... from, ... size ].join(' '),
            width:  size[0] + 'cm',
            height: size[1] + 'cm'
        },
        ... (opts.grid
            ? [ 
                [ 'path', { d: polys( gridLines(bbox, 5)), style: styles.grid5 } ],
                [ 'path', { d: polys( gridLines(bbox, 5, true)), style: styles.grid  } ],
            ]
            : []
            ),
        ... content
    );
    return {svg,bbox,size,sketch:svg}
}

function gridLines(bbox, every_nth = false, other=false){
    function* ax(axis){
        const [f,t] = bbox.map(p => p[axis])
        for (let i = 0; i + f <= t; i ++){
            if (!every_nth || (i % every_nth == 0) !== other ){
                yield bbox.map(p => p.map((xx, ii) => ii == axis? i + f : xx) ) 
            }
        }
    }
    return [ ... ax(0), ... ax(1) ]
}

function viewBox(points){
    const [min, max] = boudingBox(points) 

    const from = min.map(Math.floor), to = max.map(Math.ceil)
    return [ from, fmap2((t,f) => t - f)(to, from)  ]
}

function poly(pts){
    return pts.map( (p,i) => (i ? 'L':'M') + p.join(',')).join(' ');
}

function polys(lines){
    return lines.map(poly).join(' ')
}

const projections = (()=>{
    function matrix(m){
        return (p) => m.map( (r) => r.reduce((acc,a,i) => acc + a*p[i],0))
    }

    const isometry = matrix( ( (s3,s6) => [[s6*s3, 0, -s6*s3], [s6*1,s6*2,s6*1]])( Math.sqrt(3), 1/Math.sqrt(6) ))

    return {
        front: ([x,y,z]) => [x,-z],
        top: ([x,y,z]) => [x,-y],
        side: ([x,y,z]) => [z,-y],
        iso: ([x,y,z]) => isometry([x,-z, -y]),
    };
})();

function reflectorProjection(rf, projection){
    const parts = [ rf.reflector.parts.bottomComplete, ... rf.reflector.body ]

    const outlines = parts.map(
        fc(
            part => part.part3,
            shapeOutline, 
            fmap(projection)
        )), 
        pl = polys(outlines)  

    return svgElem(
        outlines.flat(),
        [
            [ 'path', { d: pl, style:styles.sketch } ]
        ]
    )
}

function shapeOutline(shape){   
    const rendered = curve.renderPlane(shape)
    return [
        ... rendered.map((r) => r.c[0]),
        ... rendered.map((r) => r.c[1]).reverse(),
        rendered[0].c[0]
    ]
}

function _rotator(deg){
    const rad = Math.PI * deg / 180
    return g.rotate([ Math.cos(rad), Math.sin(rad) ])
}

function diffuserSketch(rf, opts){
    const style = { ... styles.sketch, ... styles.diffuser }

    const outline = concave.curveWithFlaps(rf.diffuser.c2, rf.diffuser.frontFlaps).map(_rotator(opts.rotate || 0))

    return svgElem( 
        outline,
        [ 
            [ 'path', { d: poly(outline), style } ] 
        ],
        opts
    )
}

function reflectorSketch(rf, parts, opts = {}){
    function* partOutlines(part){
        const part2 = part.part2,
            [c0, c1] = [0,1].map(i => fc(part2, c => c(i))),
            frontFlaps = part.frontFlaps || []

        const fp = frontFlaps.map( concave.buildFlap(c0) )

        yield [ ... concave.curveWithFlaps(c0, frontFlaps), ... curve.pointsOf(c1).reverse(), c0(0)  ]
        if (part.flashFlap){
            yield part.flashFlap
        }
        yield* fp.map(f => f.socketPoints).filter(f => f) 
    }

    // const outlines = parts.map( part => Array.from(partOutlines(part))).flat().map(fmap(rotator))
    const outlines = parts.flatMap(part => [ ... partOutlines(part) ]).map(fmap(_rotator(opts.rotate || 0) ))

    const style = { ... styles.sketch, ... styles.reflector }

    return svgElem(
        outlines.flat(),
        [ [ 'path', { d: polys(outlines), style } ] ],
        opts
    )
}

function downloadSketch(sketch, filename) {
    const content = db.serialize( sketch ),
        blob = new Blob([content], {type: "image/svg+xml;charset=utf-8"});
    saveAs(blob, filename )
}

class Sketch {
    constructor(prefix, $container, o = {}){
        Object.assign(this, o)
        this.prefix = prefix
        this.$container = $container

        this.$container.on('click',  '.concave-download-sketch', e  => this.download())
        this.$container.on('change', '.concave-refresh',         e  => this.redraw())
    }
    getOpts(){
        const rotate = cp.parseDim( $(`input[name="${this.prefix}-rotate"]`, this.$container).val() || '0', 0 )
        const grid   = $(`input[name="${this.prefix}-grid"]`, this.$container).is(':checked')

        return {rotate,grid}
    }
    download(){
        downloadSketch( this.sketch, this.filename)
        return false
    }
    redraw(o = {}){
        Object.assign(this, o)

        const {sketch, size} = this.buildSketch()

        $(`#${this.prefix}-size-input`, this.$container).val(size[0] + 'cm' + ' x ' + size[1] + 'cm')

        $('.sketch', this.$container).empty().append(sketch)
        this.sketch = sketch
        return false
    }
    addNavLink(title, o = {}){
        const $ul = $('.navbar-nav', this.$container), 
            self = this

        return $(`<li class="nav-item"><a class="nav-link" href="#">${title}</a></li>`)
            .appendTo($ul)
            .find('a')
            .click(function(e){
                $('.nav-item', $ul).each((i, e) => $(e).toggleClass('active', $.contains( e, this)))
                
                self.redraw(o)
                return false;
            })
    }
}


function initReflector(C, rf, $root, query){
    const $reflector = $(
`<div class="container concave-unfolded-reflector">
    <h2>Reflector unfolded</h2>

    <nav class="navbar navbar-expand-lg bg-light navbar-light concave-parts">
        <ul class="navbar-nav"></ul>
    </nav>

    <div class="form-group row">
        <label for="reflector-rotate-input" class="text-right col-sm-2 col-form label">Rotate (degrees)</label>
        <input id="reflector-rotate-input" name="reflector-rotate" type="text" class="concave-refresh sketch-rotate col-sm-1 form-control form-control-sm form-control-inline" value="${query['reflector-rotate'] || 0}">
        
        <label for="reflector-size-input" class="text-right col-sm-2 col-form label">Sketch size</label>
        <input id="reflector-size-input" readonly type="text" class="col-sm-2 form-control form-control-sm form-control-inline">

        <label for="reflector-grid-input" class="text-right col-sm-1 col-form label">Grid?</label>
        <input id="reflector-grid-input" name="reflector-grid" type="checkbox" class="concave-refresh col-sm-1 form-control form-control-sm form-control-inline" checked>

        <div class="col-sm-3 col-3">
             <button type="button" class="btn btn-primary concave-download-sketch">Download as SVG</button>
        </div>
    </div>'
    <div class="container sketch"></div>
</div>`
    ).appendTo($root)

    const parts = rf.reflector.parts

    const reflector = new Sketch('reflector', $reflector, {
        filename: 'reflector.svg', 
        parts:     rf.reflector.body,
        buildSketch(){
            return reflectorSketch(rf, this.parts, this.getOpts() )
        }
    });

    /* links to parts */

    const $complete = reflector.addNavLink('Complete reflector', {filename:'reflector.svg', parts:rf.reflector.body} )    
    reflector.addNavLink('Bottom part',  {filename: 'reflector-bottom.svg', parts: [ parts.bottomComplete ]})
    reflector.addNavLink('Side part',    {filename: 'reflector-side.svg',   parts:[ parts.sideTriangle, parts.sideNarrow, parts.side]}) 
    reflector.addNavLink('Top part',     {filename: 'reflector-top.svg',    parts:[ parts.top]})

    $complete.click()
}

function initDiffuser(C, rf, $root, query){
    const $diffuser = $(
  `<div class="container concave-unfolded-diffuser">
    <h2>Diffuser unfolded</h2>
        <div class="form-group row">
             <div class="col-sm-12 col-12">
                 <button type="button" class="btn btn-primary concave-download-sketch">Download as SVG</button>
             </div>
        </div>

    <div class="form-group row">
        <label for="diffuser-rotate-input" class="text-right col-sm-2 col-form label">Rotate (degrees)</label>
        <input id="diffuser-rotate-input" name="diffuser-rotate" type="text" class="concave-refresh sketch-rotate col-sm-1 form-control form-control-sm form-control-inline" value="${query['diffuser-rotate'] || 0}">
        
        <label for="diffuser-size-input" class="text-right col-sm-2 col-form label">Sketch size</label>
        <input id="diffuser-size-input" name="diffuser-size" readonly type="text" class="col-sm-2 form-control form-control-sm form-control-inline">

        <label for="diffuser-grid-input" class="text-right col-sm-1 col-form label">Grid?</label>
        <input id="diffuser-grid-input" name="diffuser-grid" type="checkbox" class="concave-refresh col-sm-1 form-control form-control-sm form-control-inline" checked>

        <div class="col-sm-3 col-3">
             <button type="button" class="btn btn-primary concave-download-sketch">Download as SVG</button>
        </div>
    </div>'

    <div class="container sketch"></div>
</div>`
    ).appendTo($root)

    const diffuser = new Sketch('diffuser', $diffuser, {
        filename: 'diffuser.svg', 
        buildSketch(){
            return diffuserSketch(rf, this.getOpts())
        }
    })

    diffuser.redraw()
}

function initProjections(C, rf, $root, query){
    const $projection = $(
`<div class="container concave-projection">
    <h2>Projections</h2>'
    <nav class="navbar navbar-expand-lg bg-light navbar-light concave-proj">
        <ul class="navbar-nav"></ul>
    </nav>

    <div class="container sketch"></div>
</div>`
    ).appendTo($root)

    const projectionSketch = new Sketch(
        'projection', $projection,
        {
            buildSketch(){
                return reflectorProjection(rf, this.projection)
            }
        }
    );

    const _createProjectionLink = (projection, title) => projectionSketch.addNavLink(title, { projection })    

    const $3d = _createProjectionLink(projections.iso, '3D view')

    _createProjectionLink( projections.front, 'Front view' )
    _createProjectionLink( projections.side, 'Side view' )
    _createProjectionLink( projections.top, 'Top view' )

    $3d.click()
}

function initPage(o = {}){
    const query = o.query || uriParams()
    const C = o.C || concaveParams.parseParams( query, extractPresets(query));
    const rf = o.rf ||  concave.buildDiffuser(C)
    const $root = o.roo || $('#concave')

    $( cp.buildForm(C) ).appendTo($root)

    initReflector(C,   rf, $root, query)
    initDiffuser(C,    rf, $root, query)
    initProjections(C, rf, $root, query)
}

export default { viewBox, gridLines, boudingBox, styles, projections, poly, polys, svgElem, initPage, downloadSketch }
