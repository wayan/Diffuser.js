if (typeof wayan == 'undefined'){
    var wayan = {};
}
wayan.Fn = function(){
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
    fn.getParams = function(){
        const url = new URL(location.href),
            searchParams = new URLSearchParams(url.search), params = {};

        searchParams.forEach((v,k) => {
            const vv = v.replace(/^\s+/, '').replace(/\s+$/,'');
            if (vv.length > 0){
                params[k] = v 
            }
        })
        return params;
    };
    fn.serializeSvg = ($svg) => {
        const serializer = new XMLSerializer();
        return serializer.serializeToString($svg[0]);
    };

    /* expands function inside an array */
    fn.expandF = function(elems){
        const v = [], 
            exp = (el) => {
                el.forEach(
                    (p) => {
                        if (p instanceof Function){ 
                            exp( p() );
                        }
                        else {
                            v.push( p );
                        }
                    }
                );
        };
        exp(elems);
        return v;
    }

    const _buildElem = (createElement) => {
        function _setAttr(elem, attr){
            for(const prop in attr){
                if (attr[prop] !== false ){
                    elem.setAttribute(prop, attr[ prop ] );
                }
            }
        }

        return function(...args){
            const localname = args[0], elem = createElement(localname)
            let i = 1
            if (args.length > i && args[i] instanceof Object ){
                _setAttr(elem, args[i ++ ])
            }

            while( i < args.length ){
                const arg = args[i ++ ], node = (arg instanceof Object && typeof arg.nodeType !== 'undefined' )
                    ? arg 
                    : arg instanceof Array
                    ? fn.buildElem(... arg )
                    : document.createTextNode(arg)
                 elem.appendChild(node)
            }
            return elem;
        }
    }

    const SVGNamespaceURI = "http://www.w3.org/2000/svg"

    /* builds element from the array */
    fn.buildElem    = _buildElem((localname) => document.createElement(localname))

    /* builds element from the array */
    fn.buildSVGElem = _buildElem((localname) => document.createElementNS(SVGNamespaceURI, localname))

    /* concatenate 2 or more arrays */
    fn.concat = (...args) => {     
        const ret = []
        args.forEach((ar) => ret.push(... ar ));
        return ret;
    };

    /* array of numbers between from and to */
    fn.between = function(from, to, n, include = []){
        const step = (to - from)/n, vals = [ from ]

        for (let i = 1; i < n; i = i + 1){
            vals.push( from + i * step )
        }
        vals.push(to)

        if (include.length){
            include.forEach(val =>  {
                if (to > from? (val < to): (val > to)){
                    vals.push( val );
                }
            });
            vals.sort( (a,b) => a<b?-1:a>b?1:0 );
        }
        return vals.filter((v,i,ar) => !i || v != ar[i - 1]);
    };

    fn.compose = (...fns) => (t) => fns.reduce((acc, f) => f(acc), t);
    
    return fn;
};
