var Interpolator = (function(){
    const compare = (a,b) => a>b?1:(a<b?-1:0),
            _interpolate  = (lower, upper, x) => lower[1] + (upper[1] - lower[1]) * (x - lower[0]) / (upper[0] - lower[0]);
    const interpolator = {};

    interpolator.interpolate = function(points){

        points.sort((a,b) => compare(a[0], b[0]))

        return (x) => {
            let lower = false;
            for(let upper of points){
                if (upper[0] >= x){
                    return lower? _interpolate(lower, upper, x): upper[1];
                }
                lower = upper;
            }
            return false;
        }; 
    };
    
    return interpolator;
})();
