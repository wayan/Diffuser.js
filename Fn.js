var Fn = (function(){
    const fn = {};
    fn.hashParams = function(){
        return location.hash.replace(/^#/, '').split(',').reduce(
            (a,str) => {
                const f = str.split('=');
                if (f[0].length ){
                    a[f[0]] = f.length > 1? f[1]: 1;
                }
                return a;
            }, {}
        );
    };
    fn.serializeSvg = function($svg){
        const serializer = new XMLSerializer();
        return serializer.serializeToString($svg[0]);
    };
    return fn;
})();
