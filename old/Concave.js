if (typeof wayan == 'undefined'){
    var wayan = {};
}
wayan.Concave = function(opts = {}){
    const el = {}, 
        pi =  Math.PI, 
        g = wayan.Geometry(), 
        fn = wayan.Fn(), 
        bezier = wayan.Bezier(),
        interpolation = wayan.Interpolation(),
        polar = wayan.Polar(),
        Curve = wayan.Curve();

    const frontFlapPositions = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

    function compare(a,b){
        return a>b?1:(a<b?-1:0);
    }

    el.curveFlap = function(curve, first, last, depth){
        const r = g.rotator(curve(last), curve(first))
        return [ r([0,0]),  r([0,depth]), r([0,depth], true), r([0,0], true)  ];
    };

    el.buildDiffuser = (E) => {
        return {
            frontFlapPositions: frontFlapPositions,
            edges:[ 0, 0.5, 1],
            rims: [ el.backRimForDiffuser(E), el.frontRimFor(E) ],
            isReflector: false
        };
    };

    el.buildReflector = (E) => {
        return {
            frontFlapPositions: frontFlapPositions,
            rims: [el.backRimForReflector(E), el.frontRimFor(E)],
            edges:  [ 0, 0.25, ... [1,2, 3, 4, 5, 6].map (i => 0.25 + i / 12), 0.75, 1],
            isReflector: true
        };
    };

    el.reflectorParams = E => {
        return {
            ... E,
            height: E.flashTop + 1,
            width:  3 * E.width / 5,
            topArchHeight: 4
        };
    };

    el.backRimForReflector = E => {
        const fnY = interpolation.linear([
            [-100,0],
            [0,0],
            [E.flashTop - E.flashCoverHeight, -E.flashCoverDepth],
            [100, -E.flashCoverDepth ]
            ]),
        addY = Curve.map(([x,y,z]) => [x, fnY(z), z])

        return addY( el.frontRimFor( el.reflectorParams(E)) );
    };

    el.backRimForReflector = E => {
        const yShift = 1, 
            minZ = 0 - Math.cos(  E.wrapDeg / 2 * (pi / 180) ),
            fnYPart = interpolation.linear([
                [minZ,yShift],
                [E.flashTop - E.flashCoverHeight, -E.flashCoverDepth],
                [100, -E.flashCoverDepth ]
            ]),
            fnY = (z) => z < minZ? 0: fnYPart(z),
            addY = Curve.map(([x,z]) => [x, fnY(z), z]);

        const flashWidth = 6
        const wrap = Curve.slice(-0.25, 0)( Curve.fromCircle(E.lensRadius) ),
            right = Curve.fromPoints([ 
                wrap(1), 
                [  flashWidth / 2, E.flashTop - E.flashCoverHeight],   
                [  flashWidth / 2, E.flashTop ] ,
                [  0, E.flashTop ] 
            ], [0,1,2,3]),
            symZ = Curve.map( ([x,z] ) => [-x,z] )

        return addY( 
            Curve.merge([wrap, right, Curve.reverse(symZ(right)), Curve.reverse(symZ(wrap))],
                [1, 1, 1 , 1 ]
            )
        )
    };


    el.backRimForReflectorSquare = (E) => {
        const fnY = (z) => -7,
            addY = Curve.map(([x,z]) => [x, fnY(z), z]),
            p0 = [0, E.flashTop - 3],
            p1 = [3, E.flashTop - 3],
            p2 = [3, E.flashTop ],
            p3 = [-3, E.flashTop ],
            p4 = [-3, E.flashTop - 3 ];

        return addY( Curve.fromPoints( [p0, p1, p2, p3, p4, p0], [0, 1, 3, 5, 7, 8] ));
    };

    el.backRimForDiffuser = ( E ) => {
        const yShift = 1, minZ = 0 - Math.cos(  E.wrapDeg / 2 * (pi / 180) ),
            addY = Curve.map( ([x,z]) => [x, z < minZ? 0: yShift, z])

        return addY( Curve.slice( -0.25, 0.75)( Curve.fromCircle(E.lensRadius) ) )
    };

    el.buildReflectorDims = function(E){   
        const thickness = E.reflectorThickness;
        return {
            ... E,
            lensRadius: E.lensRadius + thickness,
            width: E.width + 2 * thickness,
            height: E.height + thickness,
        };
    };

    el.rimOutline = (rim, opts = {}, from=0, to=1) => {
        const rendered = Curve.renderShape(rim, opts).filter( r => r.t >= from && r.t <= to)

        return [ rendered[0].c[1], ... rendered.map(r => r.c[0]), ... rendered.map(r => r.c[1]).reverse()  ]
    }

    el.fnY = function(E){
        const 
            y0 = E.lensRadius * Math.sin( pi * (E.wrapDeg / 180 - 1 ) / 2 ),
            p1 = [ y0, E.wrapWidth ], 
            p4 = [E.height, E.depth], 
            pts = [
                p1,
                g.add(p1, g.unit([8,1], E.lensRadius * 2) ), 
                ... (E.sideShape == 1? [ g.add(p4, g.unit([ -1, -0.1 ], E.height  )) ]: []),
                ... (E.sideShape == 2? [ g.add(p4, g.unit([ -1, -0.1 ], E.height / 3 )) ]: []),
                // g.add(p4, g.unit([ -1, -0.1 ], E.height / 2 )),
                p4
            ];
        return interpolation.linear([ 
             [ -E.lensRadius, E.wrapWidth ], 
            ... bezier.generate(pts, 20) 
        ]);
    };

    el.frontRimFor = function(E){
        const wrapAngle = E.wrapDeg * pi / 180,
            r = E.lensRadius,
            a = E.width / 2,
            b = ( 'topArchHeight' in E? E.topArchHeight: E.shape == '1'? 2 * E.height / 6: E.height / 2),
            y0 = E.height - b,
            wa1 = 3 * pi / 2,
            wa2 = (3 * pi + wrapAngle) / 2,
            wrapCurve = Curve.slice(wa1 / (2*pi), wa2 / (2*pi))(Curve.fromCircle(r))
            topCurve  = (t) => g.add(polar.elipsisPoint(a, b, pi * t), [0,y0]),
            p1 = wrapCurve( 1 ),
            p4 = [a, y0],
            p2 = g.add(p1, g.unit(g.left(p1), r) ),
            p3 = g.add(p4, [ 0, - 2*E.height / 5 ]),
            bezierCurve  = bezier.generator([ 
                p1, 
                ... (E.frontShape == 1 ? [p2, p3]: []),
                ... (E.frontShape == 2 ? [ g.add(p1, g.unit(g.left(p1), r / 3)), [ (p1[0] + p4[0])/2, p1[1]], p3 ]: []),
                p4
            ]);
            

        const fnY = el.fnY(E), addY = Curve.map(([x,z]) => [x, fnY(z), z]), ySym = Curve.map(([x,y]) => [-x,y]);
    
        return Curve.merge(
            [
                wrapCurve, 
                Curve.merge([ bezierCurve, topCurve, Curve.reverse( ySym(bezierCurve) ) ]),
                Curve.reverse( ySym( wrapCurve))
            ].map(addY), 
            [ E.wrapDeg / 2, 360 - E.wrapDeg, E.wrapDeg / 2 ]
        );
    };

    el.buildRimSlice = function(rim, y) {
        return Curve.resample(
            k => {
                const pf = rim.front(k), pb = rim.back(k), mu = (y - pb[1]) / (pf[1] - pb[1])
                return [0, 2].map( i => (1 - mu) * pb[i] + mu * pf[i] )
            }
        );
    };

    /* splits curve vertically */ 
    el.splitRim = (rendered) => {
        let left, right
        rendered.forEach(
            (r,i) => {
                if (!left || r.c[0] < left.r.c[0]){
                    left = {r,i}
                }
                if (!right || r.c[0] > right.r.c[0]){
                    right = {r,i}
                }
            }
        );
        return [left, right]
    };

    return el;

};

