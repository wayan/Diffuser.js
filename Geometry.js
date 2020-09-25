const Geometry = (function(){
    const g = {}, symmetry = function (idx){
        return function(v){
            return v.map(function(x,i){ return i == idx? -x: x});
        };
    };

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
    g.unfold = function(v1, v2, d3){
        return {
            d3: d3,
            d2: g.tpoint(
                v1.d2,
                v2.d2,
                g.dist(v1.d3, d3),
                g.dist(v2.d3, d3)
            )
        };
    };
    g.proj = (d3) => { return { d3: d3, d2: [d3[0], d3[1] ] }};

    g.d2 = (p) => (p['d2']? p.d2: p);

    g.intersect = function(p1, p2, i, x){
        return [0,1,2].map(
            (j) => (
                j == i
                    ? x
                    : p1[j] + (x - p1[i]) * (p2[j] - p1[j])/(p2[i] - p1[i])
            )
        );
    }

    g.flapPoint = function(p1, p2, ww, ll){
        const dir = g.dir(p1, p2), dirLeft = [-dir[1], dir[0]];
        return [ 
            g.unit(dirLeft, ww),
            g.unit(dir, ll || 0)
        ].reduce(g.add, p1);
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

    return g;
})();
