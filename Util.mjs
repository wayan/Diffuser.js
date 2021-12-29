
/* function composition - from left */
export function fc(...fns){
    return (t) => fns.reduce((acc, f) => f(acc), t);
}

export function doForeach(f){
    return (... args ) => {
        f(... args)
        return doForeach(f)
    }
}

export function fmap(f){
    return (l) => l.map(f)
}

export function fmap2(f){
    return (a,b) => a.map((x,i) => f(x,b[i]))
}

/* multimap */
export function mmap(f){
    return (first, ...others) => first.map(
        (e,i) => f(e, ... others.map(o => o[i]))
    )
}

export function* range(from, to, steps=100){
    const step = (to - from)/steps
    for(let i = 0; i <= steps; i++){
        yield from + i * step
    }
}

export function steps(from, to, steps=100){
    return Array.from(range(from,to,steps))
}

export function objMap(o, fmap, ffilter=false){
    const filter = ffilter || (e=>1)
    return Object.fromEntries(
        Object.entries(o)
            .filter( ([k,v]) => filter(v,k,o))
            .map(([k,v]) => [k, fmap(v,k,o)])
    )
}

export function uriParams(){
    const url = new URL(location.href),
    searchParams = new URLSearchParams(url.search), params = {};

    searchParams.forEach((v,k) => {
        const vv = v.replace(/^\s+/, '').replace(/\s+$/,'');
            if (vv.length > 0){
                params[k] = v 
            }
    })
    return params;
}

export default {
    fc,
    fmap,
    fmap2,
    mmap,
    doForeach,
    range,
    steps,
    objMap,
    uriParams
}
