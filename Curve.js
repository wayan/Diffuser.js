if (typeof wayan == 'undefined'){
    var wayan = {};
}
wayan.Curve = function(){
    const curve = {
        minStep : 0.001,
        precision: 0.1,
        edges: [0, 0.5, 1 ]
    };
    const g = wayan.Geometry(), fn = wayan.Fn(), pi = Math.PI;

    const tmDir = [0, 1]; 

    curve.unfoldRidge = [ g.withD3([100,100], [100,0,100]), g.withD3([100,-100], [-100,0,-100]) ];

    curve.setDist = (c, dist) => {
        /* copy of the function */
        const cc = (t) => c(t);
        cc.dist = dist
        return cc
    };
    
    curve.distOf = (c) => 'dist' in c ? c.dist: g.dist;

    // curve.unfoldRidge = [ g.withD3([0,0], [0,0,0]), g.withD3([0,100], [0,100,0]) ];

    curve.fromPoints = (pts, distances ) => {
        distances = distances || curve.pointDistances(pts);
        if (distances[ distances.length - 1 ] == 0){
            /* degenerated case */
            return (t) => pts[0]
        }
        return curve.fromParts(
            (i) => (t) => g.add( g.multiply( pts[i], 1 - t), g.multiply( pts[i + 1] ,  t)),
            curve.normalizeEnds( distances )
        );
    }

    curve.concat = (curves, lengths = false) => 
        curve.fromParts(
            (i) => curves[i], 
            curve.normalizeEnds(
                curve.lengthDistances( lengths || curves.map(c => 1) ),
                true
            )
        );
    
    curve.merge = curve.concat;

    curve.fromCircle = (r) => (t) => [ r * Math.cos(t * 2 * pi), r * Math.sin(t * 2 * pi) ];
    curve.fromElipsis = (ra,rb) => (t) => [ ra * Math.cos(t * 2 * pi), rb * Math.sin(t * 2 * pi) ];

    curve.fromParts = (f, times) => {
        let i = 0;
        const lastIdx = times.length - 1

        return (t) => {
            while(true){
                const t1 = i == 0? 0: times[i - 1], 
                    t2 = times[i],
                    step = (i < lastIdx && t > t2)? 1:
                        (i > 0 && t < t1)? -1 : 0

                if (!step) {
                    return f(i)((t - t1)/ (t2 - t1))
                }
                i = i + step
            }
        };
    };

    curve.normalizeEnds = (times, startFromZero) => {
        const t0 = startFromZero? 0: times[0], 
            td = times[ times.length - 1] - t0,
            normalized = times.map( t => (t - t0)/td )

        return startFromZero ? normalized: normalized.filter((a,i) => i > 0);
    };


    curve.pointDistance = (dist = g.dist) => {
        let pp = false, totalDistance = 0;
        return (p) => {
            totalDistance = totalDistance + (pp? dist(p, pp): 0)
            pp = p
            return totalDistance;
        };
    };

    /* how far are the point from first point */
    curve.pointDistances = (pts) => curve.lengthDistances(
        pts.map( (a, i, ary) => i == 0? 0: g.dist(ary[i - 1], a) )
    );

    curve.lengthDistances = (lengths) => lengths.reduce(
        (acc, a, i, ary) => {
            acc.push( a + (i > 0 ? acc[i - 1]: 0))
            return acc
        },
        []
    );

    /* curve "middlewares" */
    curve.slice = (from, to) => (c) => (t) => {
        const  tc = from + t * (to - from)
        return c( (tc < 0 || tc > 1)? tc - Math.floor(tc): tc  ) 
    };

    curve.reverse = curve.slice(1, 0)

    curve.sliceShape = (from, to) => (s) => (ci) => curve.slice(from, to)( s(ci) )

    curve.map = (f) => (c) => (t) => f(c(t), t)

    curve.mapPoints = ( from, to ) => (c) => curve.concat(
        /* slices */
        [  ... from, 1 ].map( curve.slice( (t,i, ary) => i > 0 ? ary[i - 1]:0, t)(c)),
        /* lengths */
        [  ... to, 1  ].map( (t,i,ary) => i > 0? t - ary[i - 1]: t )
    );

    curve.buildShape = ([cf, cb]) => (u) => 
        u == 0? cf: 
        u == 1? cb : 
        (t) =>  u * cb(t) + (1 - u) * cf(t);

    curve.unfold = (rendered, opts ) => {
        opts = { tm: 0.5, ridge: curve.unfoldRidge, ... opts }

        const im = rendered.findIndex(p => p.t >= opts.tm),
            unfolded = [];

        let startRidge = rendered[im].c.map( (p,i,ary) => g.withD3(!i ?[0,0]: [0, g.dist(ary[i - 1], p)], p));

        for(let forward of [true, false]){
            let [ridge, step, i ] = forward? [ [ ... startRidge], 1, im]: [ [... unfolded[im].c], -1, im - 1]; 
            while( i < rendered.length && i >= 0){
                const pp = [], r = rendered[i]
                for (let ci of forward? [0,1]:[1,0]){
                    const p = g.unfold( ridge[forward? 0:1], ridge[forward? 1:0], r.c[ci] )
                    pp[ci] = ridge[ci] = p
                }
                unfolded[i]= {... r, c: pp}

                i = i + step
            }
        }

        return unfolded;
    };

    curve.shapeDist = (p1,p2) =>  Math.max( ... p2.map( (x,i) => g.dist(p1[i],x)));

    curve.renderShape = (shape, opts={}) => curve.render(
        curve.setDist( 
            (t) => shape.rims.map(r => r(t)),
            curve.shapeDist
        ),
        { edges:shape.edges || curve.edges, ...opts }
    );

    curve.sweepShape = (steps, precision) => curve.sweepRendered(steps, precision, curve.shapeDist)

    /* return times so that distance(t[i+1], t[i]) is smaller than precision */
    curve.render = (c, opts = {}) => {
        const dist = curve.distOf(c),
            precision = ('precision' in opts? opts:curve).precision,
            edges     = ('edges' in opts? opts:curve).edges,
            minStep   = ('minStep' in opts? opts:curve).minStep; 

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

        return curve.sweepRendered(steps, precision, dist);
    };

    curve.sweepRendered = (steps, precision, dist = false) => {
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
    };

    curve.renderedLength = (rendered) => {
        let pointDistance = curve.pointDistance();

        return rendered.reduce((acc,a) => pointDistance(a.c))
    };

    /* resample by dist */
    curve.resample = (opts = {}) => (c) => {
        let pointDistance = curve.pointDistance( ('dist' in opts ? opts: g).dist ),
            rendered = curve.render(c, opts),
            points = rendered.map( r => r.c )

        return curve.fromPoints(points, points.map(pointDistance))
    };

    return curve;
};
