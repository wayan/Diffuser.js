import {fc, fmap} from './Util.mjs'

function vector(p0) {
    return fmap((x,i) => x - p0[i])
}

function add(p0){
    return fmap((x,i) => x + p0[i])
}

function dist(p1, p2 = false){
    const d = p2 ? vector(p1)(p2) : p1 
    return Math.sqrt( d.reduce( (acc, x) => acc + x * x, 0))
}

function pointBetween(p1, p2){
    return (t) => p1.map( (x,i) => (1 - t) * x + t * p2[i] )
}

function valueBetween(v1, v2){
    return (t) => v1 * (1 -t) + v2 * t
}

function unitVector(p, len = 1){
    const d = dist(p)
    return p.map(x => len * x / d )
}

/* rotate point over axis ii */
function symmetry(ii = 0){
    return p => p.map((x,i) => i == ii ? -x: x)
}

function rotate(v1, v2=[1,0]){
    const [c1,s1] = unitVector(v1), 
        [c2,s2] = unitVector(v2),
        c = c1*c2 + s1*s2, 
        s = s1 * c2 - c1 * s2

    return ([x,y]) => [x*c - y*s, x*s + y*c]
}

export default { vector, dist, valueBetween, pointBetween, unitVector, symmetry, rotate, add}

