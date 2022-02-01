if (typeof wayan == 'undefined'){
    var wayan = {};
}
wayan.Bezier = function(){
    const power = (x,n) => n == 0? 1: x*power(x, n - 1), b = {}, g = wayan.Geometry();

    b.binom = (n,k) => k == 0 || k == n? 1: b.binom(n - 1, k ) + b.binom(n - 1, k - 1);

    b.generator = function(pts){
        const n = pts.length -1, binoms = pts.map((v,k) => b.binom(n, k))

        return (t) => pts.map( 
            (p, i) => {
                let k = binoms[i] * power(1-t, n - i) * power(t,i);
                return p.map( (x) => k* x);
            }).reduce( (p,q)=>p.map((x,i) => x+q[i])  );
    };
    b.generate = function(pts, n){
        const bez = b.generator(pts), curve = [];

        for(let t = 0; t < 1; t = t + 1 / n){
            curve.push( bez(t) ); 
        }
        curve.push(bez(1));
        return curve;
    };

    b.interpolate = (pts, n_arg) => {
        const points = [], n = n_arg || 10;
        const cpt = (i, forward) => {
            if (i < 1 || i >= pts.length - 1){
                return false;
            }

            const p = pts[i], 
                d1 = g.dir(pts[i - 1], p), 
                d2 = g.dir(p, pts[i + 1]),
                dir = g.add(g.unit(d1), g.unit(d2));

            return g.add(
                p,
                g.unit(dir, forward? g.len(d2) * 0.2: g.len(d1) * - 0.2)
            );
        };

        pts.forEach(
            (p,i) => {
                if (i > 0){
                    const cpts = [ pts[i - 1], cpt(i - 1, true), cpt(i, false), pts[i] ].filter(v => v);
                    points.push( ... b.generate(cpts,n).filter( (p,i) => i ));
                }
                else {
                    points.push( p );
                }
            }
        );
        return points;    
    };

    return b;
};
