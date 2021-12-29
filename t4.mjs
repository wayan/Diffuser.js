import curve from './Curve.mjs'
import bezier from './Bezier.mjs'


console.log(bezier.generator([[0,0],[0,1]]))
const bez = bezier.generator([[0,0],[0,1]])
console.log(
    curve.render( bez )
)


