const Geometry = (function(){
    const symD3 = Symbol('d3'),
        g = {}, 
        symmetry = (idx) => (p) => p.map((x,i) => (i == idx? -x: x));

    g.len = (v) => Math.sqrt(v.reduce(((a,x) => a+x*x), 0));
    g.add = (v1, v2) => v1.map((x, i) =>  x + v2[i]);
    g.dir = (v1, v2) => v1.map((x, i) => v2[i] - x);
    g.symY = symmetry(0);
    g.dist = (v1, v2) => g.len(v1.map( (x,i) =>  v2[i] - x));

    g.unit = function(v, d){
        const k = (arguments.length > 1? d: 1) / g.len(v);
        return v.map((x) => k * x);
    };
    g.tpoint = function(p1, p2, b, a ){
        const d = p2.map((x,i) => x - p1[i] ),
            c = g.len(d),
            c1 = (b * b + c * c - a*a ) / ( 2 * c),
            u  = Math.sqrt( b * b - c1 * c1 );
        return [
            p1[0] + d[0] * c1 / c - d[1] * u / c,
            p1[1] + d[1] * c1 / c + d[0] * u / c
        ];
    };

    g.withD3 = (p, d3) => {
        p[symD3] = d3
        return p;
    };

    g.d3 = (p) => p[symD3];

    g.unfold = function(v1, v2, d3){
        return g.withD3(
            g.tpoint(
                v1,
                v2,
                g.dist(g.d3(v1), d3),
                g.dist(g.d3(v2), d3)
            ),
            d3
        );
    };
    g.proj = (d3) => g.withD3([d3[0], d3[1]], d3)

    g.intersect = (p1, p2, i, x) => [0,1,2].map((j) => (
            j == i
                ? x
                : p1[j] + (x - p1[i]) * (p2[j] - p1[j])/(p2[i] - p1[i])
        )
    );

    g.flapPoint = function(p1, p2, ww, ll){
        const dir = g.dir(p1, p2), dirLeft = [-dir[1], dir[0]];
        return [ g.unit(dirLeft, ww), g.unit(dir, ll || 0) ].reduce(g.add, p1);
    };

    g.flap = function(line, width, lArg, rArg){
        const acnt = arguments.length, 
            l = (acnt > 2? lArg: 0),
            r = (acnt > 3? rArg: l) , 
            points = [];
        let p1;
        line.forEach(function(p2, i){
            if (i > 0){
                points.push(p1);
                points.push( g.flapPoint(p1, p2, width , l));
                points.push( g.flapPoint(p2, p1, -width, r) );
                points.push( p2 );
            }
            p1 = p2;
        });
        return points;
    };

    g.rflap = function(line, width, lArg, rArg){
        const acnt = arguments.length, 
            l = (acnt > 2? lArg: 0),
            r = (acnt > 3? rArg: l);
        return g.flap(line, - width, l, r );
    };

    /* returns transformation function
    */ 
    g.rotator = function(p1, p2){
        const dist = g.dist(p1, p2),
            dirX = g.unit(g.dir(p1, p2)), dirY = [ - dirX[1], dirX[0] ];

        return (p, right) => {
            const x = right? dist + p[0]: p[0], y = p[1]
            return p1.map( (o,i) => o + x * dirX[i] + y * dirY[i]);
        };
    };

    g.roundPoints = function(p1, p2, p3, r){
        return [
            g.add(p2, g.unit(g.dir(p2,p1), r)),
            p2,
            g.add(p2, g.unit(g.dir(p2,p3), r)) 
        ];
    }

    const uidx = [ 1, 2, 0], vidx = [ 2, 0, 1 ];

    g.planeLineIntersect = function(plane, line){
        const [ pp1, pp2, pp3 ] = plane
        const [lp1, lp2 ] = line

        const u = g.dir(pp2, pp1), 
            v = g.dir(pp3, pp1), 
            /* vektorovy soucin */
            uv = [0,1,2].map( (i) => {
                const ui = uidx[i], vi = vidx[i];
                return u[ui] * v[ vi ] - u[vi] * v[ui];
            }),
            uvf = (p) => p.map((x,i) => x*uv[i]).reduce( (a,b) => a + b);

        const dir = g.dir(lp1, lp2), t = (uvf(pp1) - uvf(lp1)) / uvf( dir );

        return lp1.map( (x,i) => x + t * dir[i])
    };
      

    return g;
})();
