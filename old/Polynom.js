var Polynom = (function(){
    const fn = function(pts){
        return (x) => pts.map( 
            (p,i) => p[1] * pts.map( (pp,j) => i == j? 1: (x - pp[0])/(p[0] - pp[0])).reduce((a,b) => a*b) 
       ).reduce((a,b) => a + b );
    };

    return {
        fn: fn
    };
})();
