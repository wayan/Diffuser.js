if (typeof wayan == 'undefined'){
    var wayan = {};
}

wayan.ConcaveDraw = (opts = {}) => (C) => {
    const cp = wayan.ConcaveParams(), 
        Fn = wayan.Fn(),
        Drawing = wayan.Drawing(),
        el = wayan.Concave(),
        g = wayan.Geometry(), 
        Curve = wayan.Curve(),
        SvgPath = wayan.SvgPath();

    const 
        strokeWidth = 0.02;
    const self = {
        raysStyle:  { stroke: 'black', 'stroke-width': strokeWidth, 'stroke-dasharray': '0.1, 0.2' },
        edgeStyle:  { stroke: 'red', 'stroke-width': strokeWidth },
        gridStyle:  { 'stroke-dasharray': '0.05 0.05', 'stroke-width': strokeWidth / 4 },
        gridStyle5:  { 'stroke-dasharray': '0.2 0.2', 'stroke-width': strokeWidth / 2 },
        shakaStyle: { stroke: 'black ', 'stroke-width': strokeWidth },
        iflapStyle:  { 'stroke-dasharray': '0.09 0.09', 'stroke-width': strokeWidth / 2 },
    };


    self.timesRange = C.timesRange? C.timesRange: C.complete? [0,1]: [0,0.5];

    const [ from, to ] = self.timesRange;
      
    self.filterTime = (t) => t >= from && t <= to;

    self.shapeOutline = (rendered) => {
        const slice = rendered.filter( r => r.t >= from && r.t <= to)
        return [ slice[0].c[1], ... slice.map(r => r.c[0]), ... slice.map(r => r.c[1]).reverse()  ]
    };

    self.limitFlap = (flapIn) => {
        const flap = flapIn.map( (p) => p < from? from: p > to? to: p)
        return flap[0] == flap[1]? false: flap 
    };

    self.showRays = (w, renderedIn) => {
        const rendered = Curve.sweepShape(renderedIn, C.raysPrecision).filter(Fn.compose(r => r.t, self.filterTime));
        
        for(let r of rendered){
            if ( r.isEdge ){
                w.path(
                    SvgPath.polyline( [r.c[0], r.c[1]]), 
                    r.isEdge ?  self.edgeStyle: self.raysStyle 
                );
            }
        }
    };

    self.mergeSketches = (sketches) => {
        return {
            boundingBox: g.boundingBox(sketches.map((d) => d.boundingBox ).flat()),
            draw: (w) => {
                sketches.forEach(d => d.draw(w));
            }
        };
    };

    self.drawSketch = (root) => ( name, title, sketchIn, boundingBox = false ) => {
        root = root || '#projections';

        const sketch = Array.isArray(sketchIn)? self.mergeSketches(sketchIn): sketchIn;
		const container = Fn.buildElem(
			'div', 
			{id : 'projection-' + name, class: 'projection' },
			['h1', title, [ 'button', { type: 'button', class: 'download-svg-button'}, 'Download SVG' ] ]
		);

		$(container).appendTo(root);

		const w = new Drawing({ magnify: C.ppi / 2.54, showGrid: C.showGrid });
        w.setViewbox( boundingBox || sketch.boundingBox )
        if (C.showGrid){
            self.drawGrid(w, sketch.boundingBox);
        }
        sketch.draw(w);
		$(w.svg).appendTo(container);
    };


    self.frontFlaps = ( opts, reversed = false ) => {
        const rim = opts.rim,
            rendered = opts.rendered || Curve.render(rim),
            flapPositions = opts.frontFlapPositions;

        const curveLength = Curve.renderedLength(rendered),
            frontFlapThickness = C.frontFlapThickness || 0.5;

        /*
        ... cp.parseParams( Fn.getParams()), height:14, depth: 14,  lensRadius: 2.7, ppi: 157, frontFlapWidth:1.2, frontFlapDepth: 1.2, 
            frontFlapThickness: 0.8, frontFlapSocketThickness: 0.6,
        */


        const buildFlaps = (_flapWidth, flapDepth) => {
            const flapWidth = _flapWidth / curveLength,
                flapRange = (p) => {  
                    const range = [ p - flapWidth / 2, p + flapWidth / 2 ]
                    return reversed? range.reverse(): range;
                };

            return flapPositions.map(flapRange).map(self.limitFlap).filter(f => f).map(
                f => el.curveFlap(rim, ... f, flapDepth)
            );
        };

        return [ 
            ... (!opts.isReflector? buildFlaps(C.frontFlapWidth, C.frontFlapDepth): []),
            ... (opts.isReflector? buildFlaps(C.frontFlapWidth,  C.frontFlapThickness): []),
            ... (opts.isReflector? buildFlaps(C.frontFlapWidth + 2*C.frontFlapSocketThickness,  C.frontFlapThickness + C.frontFlapSocketThickness): []),
        ];
    };

	self.unfoldedSketch = (shape) => {
		const rendered = Curve.renderShape(shape), unfolded = Curve.unfold(rendered);

		// flaps
		let flaps = [];
		if (C.showFrontFlaps){
            const frontRim = Curve.fromPoints(unfolded.map(r => r.c[1]) ) 
            flaps.push ( ... self.frontFlaps({ ... shape, rim: frontRim }) );

            if (false && shape.isReflector){
                const backRim = Curve.fromPoints(unfolded.map(r => r.c[0]), unfolded.map(r => r.t )  ) 
                flaps.push(
                    ... [
                        [ 0.25 + 4/12, 0.25 + 2/12],
                        [ 0.25 + 2/12, 0.25 + 1/12], 
                        [ 0.25 + 5/12, 0.25 + 4/12]
                    ].map( self.limitFlap ).filter(f=>f).map(
                        f => el.curveFlap( backRim, f[0], f[1],  6 )
                    )
                )
            }
		}

        /* flaps */
        const iflaps = []
        for( let r of unfolded ){
            if (r.isEdge){
                const rotator = g.rotator( ... r.c );
console.log(r.c)
                iflaps.push(
                    [ rotator([0,0]), rotator([1.5,1.5]), rotator([-1.5,1.5],true), rotator([0,0],true) ],
                    [ rotator([0,0]), rotator([1.5,-1.5]), rotator([-1.5,-1.5],true), rotator([0,0],true) ],
                );
            }
        }

		return {
			draw: (w) => {
				w.path(SvgPath.polyline(self.shapeOutline(unfolded)), self.shakaStyle)

				self.showRays(w, unfolded)

				for(let flap of flaps){
					w.path(SvgPath.polyline(flap), self.shakaStyle)
				}
				for(let flap of iflaps){
					w.path(SvgPath.polyline(flap), self.iflapStyle)
				}
			},
			boundingBox: g.boundingBox([ 
                ... unfolded.filter( Fn.compose(r=>r.t, self.filterTime)).map(r => r.c).flat(), 
                ... flaps.flat(),
                ... iflaps.flat()
            ])
		};
	};

	self.projectionSketch = (proj) => (shape) => {
   		const rendered = Curve.renderShape({
                ... shape,
                rims: shape.rims.map(Curve.map(proj))
            }),
            pts = self.shapeOutline( rendered )

		return {
			boundingBox: g.boundingBox(pts),
			draw: (w) => {
				w.path(SvgPath.polyline(pts), self.shakaStyle)
				self.showRays(w, rendered)
			}
		};
	};

    self.frontUnfoldSketch = (shape) => {
        const rim = shape.rims[1];
        const curveByX = (pts) => Curve.fromPoints(pts.map(r => r.c), pts.map(r => r.c[0]) );


        const clearPoints = (pred, points) => {
            const pts = []
            for( let r of points ){
                const last = pts.length ? pts[pts.length - 1]: false;
                if (last && last.c[0] == r.c[0]){
                    if (pred(last.c[2], r.c[2])){
                        pts[pts.length - 1 ] = r;
                    }
                }
                else {
                    pts.push(r);
                }
            }
            return pts;
        };

        const rendered = Curve.render(rim), 
            [left, right] = el.splitRim(rendered),
            /* if there are some more points with same x */
            topPoints = clearPoints( (a,b) => b > a,   rendered.slice( right.i + 1, left.i - 1)),
            bottomPoints = clearPoints((a,b) => b < a, [ ... rendered.slice(left.i + 1), ... rendered.slice(0, right.i) ].reverse()),
            shapeRendered = Curve.renderShape( { rims: [topPoints, bottomPoints].map(curveByX) }), 
            unfolded = Curve.unfold( shapeRendered ),
            topUnfolded = Curve.fromPoints( unfolded.map( r => r.c[0] )),
            bottomUnfolded = Curve.fromPoints( unfolded.map( r => r.c[1] )),
            circular = Curve.resample()(
                Curve.concat([ Curve.slice(0.5,0) ( bottomUnfolded ), topUnfolded, Curve.slice(1, 0.5) ( bottomUnfolded ) ]
            )),
            flaps = self.frontFlaps({ ... shape, rim: circular, isReflector:false }, true);


		return {
			draw: (w) => {
				w.path(SvgPath.polyline( self.shapeOutline(unfolded)), self.shakaStyle)

				self.showRays(w, unfolded)

				for(let flap of flaps){
					w.path(SvgPath.polyline(flap), self.shakaStyle)
				}
			},
			boundingBox: g.boundingBox([ ... unfolded.filter( Fn.compose(r=>r.t, self.filterTime)).map(r => r.c).flat(), 
            ... flaps.flat()  ])
		};
    };

    self.drawGrid = function(w, boundingBox){
        for(let li of [0,1]){
            let step = 0
            for(let lx = boundingBox[0][li]; lx <= boundingBox[1][li]; lx ++ ){
                const line = boundingBox.map(p => p.map( (x,i) => i==li? lx: x ));
                w.path(SvgPath.polyline(line), step % 5? self.gridStyle: self.gridStyle5);
                step ++
            }
        }
    };


    return self;
};
