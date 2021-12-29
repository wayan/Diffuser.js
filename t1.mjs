import cu from './Curve.mjs'



console.log( cu.pointBetween([0,0], [7,7], 0.2))
console.log( cu.gDist([1,1], [5,4]))

cu.polyline(
    [ 
        [0,1], [0,11], [17,12]
    ]
)

const ptf = cu.partFinder([0, 0.3, 0.7, 1 ] )
console.log(ptf(0.5))

const c = cu.polyline([ [1,1], [5,1], [5,8], [14,8] ])

console.log( c(0.4) )
console.log( cu.slice(c, 0.2, 0.6)(0.5) )
console.log( cu.reverse(c)(0.6) )

const cc = cu.concat([
    c,
    cu.polyline([
        [ 14, 8],
        [ 14, -2]
    ])
]);
console.log('kongas')
console.log(cc(1) )
console.log(cc(0.5) )
console.log(cc(0.6) )
console.log(cc(0) )

const pl = cu.simplePlane(
    [
        cu.polyline([
            [ 14, 8],
            [ 14, -2]
        ]),

        cu.polyline([
            [ 24, 8],
            [ 24, -2]
        ])
    ]
)

console.log( pl(0.5)(0.6) )

