import {fc, fmap} from './Util.mjs'
import g from './Geometry.mjs'

const defaults = {
    precision: 0.1,
    edges: [0,0.5,1],
    minStep: 0.01
};

const pi = Math.PI

function intervalFinder(intervals, fn){ 
    return t => {
        let i0 = 0, i1 = intervals.length - 1

        while(i1 - i0 > 1){
            const im = Math.floor( (i0 + i1) / 2)
            if (t >= intervals[im]){
                i0 = im
            }
            else {
                i1 = im
            }
        }


        const t0 = intervals[i0], t1 = intervals[i1] 
        if (t < t0 || t > t1){
            throw 'Value ' + t + ' of out intervals '
        }

        return fn(i0)(t1 == t0? 0: (t - t0)/(t1 - t0) )
    }
}

function slice(from, to){
    return (t) => {
        const  tc = from + t * (to - from)
        return (tc < 0 || tc > 1)? tc - Math.floor(tc): tc   
    }
}

function reverse(t){ 
    return 1 - t 
}

function circular(t){
    return t >= 0 || t <= 1? t: t - Math.floor(t)
}

function circle(t){
    const a = 2*pi*t
    return [ Math.cos(a) , Math.sin(a) ]
}

/* how far is each point from the start - relatively (value 0 .. 1) */
function buildDistances(pts, dist){
    let total = 0, pp

    const distances = pts.map( (p) => {
        total = total + (pp? dist(p,pp): 0)
        pp = p
        return total
    });
    return distances.map(d => d / total )
}

/* curve - interpolating points */
function polyline(pts, opts = {} ) {
    const dist = opts.dist || g.dist, between = opts.between || g.pointBetween;

    /* optimization */
    if (pts.length == 1 ){
        return (t) => pts[0]
    }
    if (pts.length == 2 ){
        return between( pts[0], pts[1])
    }

    return intervalFinder( 
        opts.distances || buildDistances(pts, dist),
        (i) => between( pts[i], pts[i+1] )
    )
}

function line(p, q, opts={}){
    return polyline([p,q],opts)
}

function point(p){
    return t => p
}

function concat(curves, lengths = false){
    const intervals = [0]
    let total = 0
    curves.forEach( (p,i) => {
        total = total + (lengths? lengths[i]: 1)
        intervals.push( total )
    }) 
    return fc( t => total * t, intervalFinder(intervals, i => curves[i]))
}

/* return times so that distance(t[i+1], t[i]) is smaller than precision */
function render(c, opts = {}){
    const precision = opts.precision || defaults.precision,
        edges     = opts.edges || defaults.edges,
        minStep   = opts.minStep || defaults.minStep,
        dist      = opts.dist || g.dist

    const fstep = (isEdge) => (t) => { return {t,isEdge,c:c(t)} }, 
        steps = edges.map(fstep(true));
    let i = 0
    while(i < steps.length - 1){
        const s0 = steps[i], s1 = steps[i + 1]
        if (dist(s0.c,s1.c) > precision && s1.t - s0.t > minStep){
            steps.splice(i + 1, 0, fstep(false)( (s0.t + s1.t)/2 ))
        }
        else {
            i = i + 1
        }
    }
    return sweepRendered(steps, precision, dist);
}

function pointsOf(c, opts={}){
    return render(c, opts).map(r => r.c)
}

function rebuild(c, opts={}){
    const rendered = render(c, opts), dist = opts.dist || g.dist
    return fc( 
        linear( 
            buildDistances(rendered.map(r => r.c), dist),
            rendered.map(r => r.t)
        ),
        c
    )
}

function lengthOf(c, opts={}){
    const dist  = opts.dist || g.dist
    return render(c,opts).reduce(([sum,last], r) => [ sum + (last? dist(r.c,last):0), r.c ], [0])[0]
}

/* return(s) distance between two edges - max distance of its respective points */
function edgeDist(dist){
    return (e1, e2) => Math.max(... e1.map((p,i) => dist(p, e2[i])) )
}

function renderPlane(plane, opts = {}){
    const dist = opts.dist  || g.dist
    return render( (t) => planeEdge(plane, t), { ... opts, dist: edgeDist(dist) })
}

/* creates curve back from array of steps */
function derender(rendered, opts = {}){
    const between = opts.between || g.pointBetween;

    const pts = rendered.map(r => r.c)
    return intervalFinder( 
        rendered.map(r => r.t),
        i => between( pts[i], pts[i+1])
    )
}

/* creates plane back from array of steps */
function derenderPlane(rendered, opts){
    return simplePlane([0,1].map(
        i => derender( rendered.map((r) => { return {...r, c:r.c[i] } }))
    ))
}

function sweepRendered (steps, precision, dist = false) {
    /* steps may be too dense */
    const result = []
    
    dist = dist || g.dist
    steps.forEach( (step, i, ary) => {
        if (step.isEdge 
            || i == 0
            || i == ary.length - 1
            || dist( result[result.length - 1].c, ary[i+1].c ) > precision){
            result.push(step)
        }
    });
    return result;
}

function simplePlane( curves ){
    return t => polyline(curves.map(c => c(t)))
}

function splane(f,b){
    return simplePlane([f,b])
}

/* returns 2 points of the plane on position t */
function planeEdge(plane, t){
    return [0,1].map(plane(t))
}

function planeMapper(f){
    return c => f(c) 
}

function transformPlane( plane, f ){
    return (t) => {
        const c = plane(t)
        return tt => f( c(tt), t, tt )
    }
}

/* triangulation - e.q. unfolding */
function _tpoint(p1, p2, b, a ){
    const d = p2.map((x,i) => x - p1[i] ),
        c = g.dist(d),
        c1 = (b * b + c * c - a*a ) / ( 2 * c),
        /* for b or a close to zero, discriminant can be small negative */
        uu = b * b - c1 * c1 ,
        u  = uu > 0? Math.sqrt(uu): 0;
    return [
        p1[0] + d[0] * c1 / c - d[1] * u / c,
        p1[1] + d[1] * c1 / c + d[0] * u / c
    ];
}


function unfoldPoint(p3, p2, q3, q2, r3) {
    return _tpoint( p2, q2, g.dist(p3, r3), g.dist(q3, r3))
}

function unfoldNext (edge3, edge2, [p3, q3]) {
    const r0 = unfoldPoint( edge3[0], edge2[0], edge3[1], edge2[1], p3)
    return [ r0,  unfoldPoint( p3, r0, edge3[1], edge2[1], q3) ]
}

function unfoldPlane( plane, opts = {} ){
    const rendered = renderPlane(plane, opts)

    let edge3 = opts.edge3 || rendered[0].c,
        edge2 = opts.edge2 || [ [0,0], [ 0, g.dist(...edge3)] ]

    const unfolded = rendered.map( (r) => {
        edge2 = unfoldNext(edge3, edge2, r.c)
        edge3 = r.c
        return {...r, c: edge2 }
    })

    return derenderPlane( unfolded )
}

function planeMap(plane){ return ([x,y]) => plane(x)(y) }

function unfoldPlanes( planes3 ){
    return planes3.reduce(
        ( [ planes2, edge3, edge2 ], plane3 ) => {
            const plane2 = unfoldPlane( plane3, edge3? { edge3, edge2}: {})
            planes2.push(plane2)
            return [ planes2, planeEdge(plane3, 1), planeEdge(plane2, 1) ]
        },
        [ [], false, false ]
    )[0]
}

/* simple linear interpolation 
    [values are [x,y], [x,y], ...
*/
function linear( xs, values ){
    const last = values.length - 1,
        findPart = intervalFinder( xs, i => g.valueBetween( values[i],  values[i + 1] ) )
    return (x) => {
        if (x <= xs[0]) {
            return values[0];
        }
        if (x >= xs[last]) {
            return values[last];
        }
        return findPart(x)
    }
}

export default {
    polyline,
    slice, 
    reverse, 
    concat,
    simplePlane,
    render,
    unfoldPoint,
    transformPlane,
    planeEdge,
    renderPlane,
    unfoldPlane,
    unfoldPlanes,
    linear,
    pointsOf,
    poly: polyline,
    line,
    splane,
    point,
    planeMap,
    circle,
    lengthOf,
    planeMapper,
    rebuild
};
