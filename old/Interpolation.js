if (typeof wayan == 'undefined'){
    var wayan = {};
}
wayan.Interpolation = function(){
    const interpolation = {}, g = wayan.Geometry();

    interpolation.poly = function(pts){
        return (x) => pts.map( 
            (p,i) => p[1] * pts.map( (pp,j) => i == j? 1: (x - pp[0])/(p[0] - pp[0])).reduce((a,b) => a*b) 
       ).reduce((a,b) => a + b );
    };

    interpolation.mu = function(pts, lower, x){
        const x1 = pts[lower][0], x2 = pts[lower + 1 ][0];
        return x < x1? 0: x > x2? 1: (x - x1)/ (x2 - x1);
    };

    interpolation.lower = function(pts, x){
        let i = 0;
        while( i < pts.length && pts[i][0] < x ){
            i ++;
        }
        return i == 0 ? 0 : i >= pts.length ? pts.length - 2 : i - 1;
    };

    interpolation.linear = function(pts){
        return (x) => {
            const i = interpolation.lower(pts, x), mu = interpolation.mu(pts, i, x);
            const y1 = pts[i][1];
            const y2 = pts[i + 1][1];
            return y1 + (y2 - y1)*mu;
        };
    };

    interpolation.cosin = function(pts){
        return (x) => {
            const i = interpolation.lower(pts, x), mu = interpolation.mu(pts, i, x);
            const y1 = pts[i][1];
            const y2 = pts[i + 1][1];
            const mu2 = (1-Math.cos(mu*Math.PI))/2;
            return y1*(1-mu2)+y2*mu2;
        };
    };
    interpolation.cubic = function(pts){
        return function(x){
            const i = interpolation.lower(pts, x), mu = interpolation.mu(pts, i, x);
            const x1 = pts[i][0], x2 = pts[i + 1][0], y1 = pts[i][1], y2 = pts[i+1][1],
                x0 = i > 0 ? pts[i - 1 ][0] : 2*x1 - x2, 
                y0 = i > 0 ? pts[i - 1 ][1] : 2*y1 - y2, 
                x3 = i < pts.length - 2? pts[i + 2][0]: 2*x2 - x1,
                y3 = i < pts.length - 2? pts[i + 2][1]: 2*y2 - y1;

            const mu2 = mu*mu;
            const a0 = -0.5*y0 + 1.5*y1 - 1.5*y2 + 0.5*y3;
            const a1 = y0 - 2.5*y1 + 2*y2 - 0.5*y3;
            const a2 = -0.5*y0 + 0.5*y2;
            const a3 = y1; 

           return a0*mu*mu2+a1*mu2+a2*mu+a3;
        };
    };

    /* pts ar 2 dimensional array */
    interpolation.rotshape =  function(pts){
        const dirs = pts.map((p,i,ar) => g.dir(p, ar[ i < ar.length - 1? i + 1: 0 ]));

        return (angle) => {
            const c = Math.cos(angle), s = Math.sin(angle),
                ok = Math.abs(c) > Math.abs(s)
                    ? (c > 0? (p=>p[0]>0):(p=>p[0]<0))
                    : (s > 0? (p=>p[2]>0):(p=>p[2]<0));
                getPoint = (i) => {
                    const p0 = pts[i], dir = dirs[i], k = s * dir[0] - c * dir[2];
                    if (Math.abs(k) < 1e-6){
                        return false;
                    }
                    const mu = (c * p0[2] - s * p0[0] )/ k;
                    if (mu < 0 || mu > 1){
                        return false;
                    }
                    const p = g.add(p0, g.multiply(dir, mu));
                    return ok(p)? p: false;
                };
            for(let i = 0; i < pts.length; i++){
                const p = getPoint(i);
                if (p){
                    return p;
                }
            }
            return false;
        };
    };

    
    return interpolation;
};
