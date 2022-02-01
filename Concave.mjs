import curve from './Curve.mjs'

/* function composition */
import {fc,fmap,objMap, doForeach} from './Util.mjs'
import bezier from './Bezier.mjs'
import {bez3} from './Bezier.mjs'
import g from './Geometry.mjs'

function _reverse(plane){
    return fc(
        curve.reverse,
        plane,
        c => fc(c, g.symmetry(0))
    )
}

/* rotates the curve so that vector [c(0),c(0.5)] is aligned with vector [ [0,0], [0,1]] */
function _rotate2Y(c){
    const p0 = c(0), dirOf = g.vector(p0)
    return fc(c, dirOf, g.rotate([1,0], dirOf(c(0.5))))
}


function buildFlap(c){
    const len = curve.lengthOf(c)

    return ({at, width, depth, socketThickness}) => {
        const t0 = at / len ,
            t1 = (at + width) / len,
            p0 = c(t0), p1 = c(t1), 
            vec0 = g.vector(p0),
            d = g.dist(p0,p1),
            rotator = fc(
                g.rotate( vec0(p1), [1,0]),
                g.vector(p0.map(x => -x))
            )

        const socketPoints = (st => {
            if (!st){
                return false
            }   
            const dpt = depth > 0? st - depth: -st - depth 
            return [
                [ st, 0], 
                [ st, dpt  ],
                [ d - st, dpt ],
                [ d - st, 0 ],
                [ st, 0 ]
            ].map(rotator)
        })( socketThickness)

        return { 
            t0, 
            t1, 
            points: [[ 0,-depth],[d, -depth],[d,0]].map(rotator),
            socketPoints
        }
    }
}

export function curveWithFlaps(c, flaps){
    const points = []

    let tlast = 0
    flaps.map(buildFlap(c)).forEach(f => {
        /* part of the curve */ 
        points.push(  ... curve.pointsOf( fc(curve.slice(tlast, f.t0), c ) )),
        /* flap */
        points.push(  ... f.points )
        tlast = f.t1
    })
    points.push( ... curve.pointsOf( fc(curve.slice(tlast,1), c ) ))
    return points;
}

export function buildDiffuser(C){
    /* what part of the top width is completely flat */
    const frontFlat = 0.1, w2 = C.width / 2, xShift  = Math.max(C.frontFlapWidth + 2*C.frontFlapSocketThickness  + 0.1, 2.2) / 2

    const 
        sideArch = curve.rebuild(
            fc(
                bez3([w2, 0], [w2,C.height], [xShift, C.height]),
                (fnY => ([x,z]) => [x, fnY(z), z ])( 
                    /* Y by Z */
                    curve.linear([ 0, C.height], [ 1/2*C.depth, C.depth]) 
                )
        ))

    const
        topLine = curve.line([xShift, C.depth, C.height],[ -xShift, C.depth, C.height])

    /* Y by Z */
    const 
        backSlope = curve.linear(
            /* Z axis */
            [- 3 * C.flashBottomHeight, C.flashBottomHeight], 
            /* Y axis */
            [+ 3*C.flashBackShift,     -C.flashBackShift]
          ),
          backSlopeLen = Math.sqrt( 1 + (backSlope(1) - backSlope(0)) ** 2)  

    /* circle 
    const
        lensArch = fc(
            curve.slice(0, 0.5), 
            curve.circle,
            ([x,z]) => [ x * (C.lensRadius + C.lensAroundWidth) , z*C.lensRadius],
            // fmap(x => x * C.lensRadius),
            ([x,z]) => [x, backSlope(z), z]
       )
    */

    /* bezier */
    const lensArch = (() => {
        /* X by Z */
        const lin = curve.linear(
            [ 0, C.flashBottomHeight ],
            [  C.lensRadius + C.lensAroundWidth, C.flashWidth / 2 ]
        )

        const bez = bez3( [lin(0), 0], [lin(C.lensRadius), C.lensRadius], [ 0, C.lensRadius ] )

        return curve.rebuild(
            fc(
                curve.concat([ bez, fc(curve.reverse, bez, g.symmetry(0)) ]),
                ([x,z]) => [x, backSlope(z), z]
            )
        )
    })()

    /* connecting points */
    const B1 = lensArch(0), B2 = sideArch(0)

    /* backRim - flash points */
    const _fp = (x,z) => [x * C.flashWidth / 2, - C.flashBackShift, z*C.flashHeight + C.flashBottomHeight],
        F0 = _fp(0,0), 
        F1 = _fp(1,0), 
        F2 = _fp(1,1), 
        F3 = _fp(-1,1),
        F4 = _fp(-1,0)
  

    /* reflector */
    const reflector = (()=>{
        function flashFlap([p1, p4]){
            const vec0 = g.unitVector( g.vector(p1)(p4),  C.flashFlapDepth)
            const vec = g.add([ - vec0[1], vec0[0] ]) 
            return [p1, vec(p1), vec(p4), p4] 
        }

        const 
            bottom = curve.splane( fc(curve.slice(0.5,0), lensArch), curve.line(F0, F1)),
            sideTriangle =  curve.splane( curve.line(B1, B2), curve.point(F1)),
            sideNarrow = curve.splane( curve.point(B2), curve.line(F1,F2) ),
            side = curve.splane( sideArch, curve.point( F2) ),
            top  = curve.splane( topLine,  curve.line(F2, F3))

/*
        const bottomComplete = curve.splane( lensArch, curve.line(F1, F4))
*/

        const bottomComplete = (() => {
            const flapDepth = C.lensRadius
    
            /* right flap around lens */
            const flap = curve.poly([
                [ C.lensRadius, 0 ],
                [ C.lensRadius, - flapDepth ],
                [ C.lensRadius + C.lensAroundWidth, -flapDepth ],
                [ C.lensRadius + C.lensAroundWidth, 0 ],
            ])
            
            /* arch around lens */
            const arch = fc(
                curve.slice(0.5, 0),
                curve.circle,
                ([x,z]) => [ C.lensRadius * x , C.lensRadius * z ]
            )

            const bottomCurve = fc(
                curve.concat([ fc( curve.reverse, flap, g.symmetry(0) ), arch, flap ]),
                ([x,z]) => ([x, backSlope(z), z])
            )

            return curve.splane(
                curve.rebuild(bottomCurve),
                curve.line(F4, F1)
            )
        })()

        
        /* reverse parts */
        const [ r_side, r_sideNarrow, r_sideTriangle, r_bottom ] = [
            side, sideNarrow, sideTriangle, bottom
        ].map(_reverse)

        const parts = Object.fromEntries(
            Object.entries({
                bottom, sideTriangle, sideNarrow, side, top,
                r_side, r_sideNarrow, r_sideTriangle, r_bottom ,
                bottomComplete
            }).map( ([name, part3]) => [name, { name, part3}] )
        )

        const body = [
            parts.bottom, parts.sideTriangle, parts.sideNarrow, parts.side, parts.top, 
            parts.r_side, parts.r_sideNarrow, parts.r_sideTriangle, parts.r_bottom 
        ]

        curve.unfoldPlanes( body.map(part => part.part3)).forEach(
            (part2,i) => {
                body[i].part2 = part2 
            }
        )


        /* bottomComplete is unfolded simply - it is a plane in 3D */
        parts.bottomComplete.part2 = fc(
            bottomComplete,
            f => fc(f, ([x,y,z]) => [x, backSlopeLen * z ])
        )
        
        Object.values(parts).forEach(
            part => {
                part.length = curve.lengthOf(t => part.part2(t)(0))  
            }
        )

        const 
            flapWidth = C.frontFlapWidth + 2*C.frontFlapSocketThickness,
            flapDepth = C.frontFlapThickness + C.frontFlapSocketThickness

        /* adding flap */
        doForeach( ( part, fn ) => {
            part.frontFlaps = fn(part.length).map(
                flap => { 
                    return { 
                        width: flapWidth, 
                        depth: -flapDepth, 
                        socketThickness: C.frontFlapSocketThickness,
                        ... flap 
                    } 
                }
            )
        })
        ( parts.sideTriangle,   len => [ { at: 2 } ])
        ( parts.r_sideTriangle, len => [ { at: len - 2 - flapWidth }])
        ( parts.side,           len => [ { at: 1 }, { at: 0.6 * len} ])
        ( parts.r_side,         len => [
            { at: len -  0.6 * len - flapWidth },
            { at: len - 1 - flapWidth }
         ])
        ( parts.top, len => [ { at: 0.5*len - 0.5*flapWidth }])

        doForeach( (part, reversed = false)  => {
            const pts = [1,0].map( t => part.part2(t)(1) )
            part.flashFlap = flashFlap(reversed? pts.reverse(): pts)
        })
        (parts.sideNarrow)
        (parts.top)
        (parts.r_sideNarrow)
        (parts.bottomComplete, true)

        return {parts, body }
    })()

    /* building diffuser */  
    const diffuser = (()=>{
        const largeArch = curve.rebuild(curve.concat([ sideArch, topLine, fc(curve.reverse, sideArch, g.symmetry(0)) ])),
            smallArch   = lensArch,
            diffPlane   = curve.splane(smallArch, largeArch),
            diffPlane2  = curve.unfoldPlane(diffPlane),
            /* coordinates of diffuser in diffPlane */
            diff2   = curve.poly([ [0.5,0], [0,0], [0, 1], [1,1], [1,0], [ 0.5, 0] ]),
            c2      = _rotate2Y(curve.rebuild(
                fc( 
                    diff2, 
                    ([x,y]) => diffPlane2(x)(y) 
                )))

        const
            flapWidth = C.frontFlapWidth,
            flapDepth = C.frontFlapDepth

        const frontFlaps = reflector.body.reduce(
            ( [ flaps, total], part ) => {
                const partFlaps = (part.frontFlaps || []).map(
                    ({at,width}) => { 
                        return {
                            at: at + total + (width - flapWidth) /2, 
                            depth:flapDepth, 
                            width: flapWidth
                        } 
                    }
                ) 
            
                flaps.push( ... partFlaps )  

                return [ flaps, total + part.length ]
            },
            [ [], 0 ]
        )[0]

        return { c2, frontFlaps }
    })()

    /* front rim */
    return {reflector, diffuser}
}

export default {buildDiffuser, curveWithFlaps, buildFlap}
