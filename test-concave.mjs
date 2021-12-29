import concave from './Concave.mjs'
import curve from './Curve.mjs'

function flashParams(flashType){
    if (flashType == 'Meike'){
        return { flashHeight: 2.7, flashBottomHeight: 8.5, flashBackShift: 1, flashWidth: 6};
    }
    return { flashHeight: 3.6, flashBottomHeight: 11.5, flashBackShift: 2, flashWidth: 6.4, height: 3.6 + 11.5}
}


const C = {
        ppi: 157,
        width: 24,
        // timesRange: [0.25, 0.85],
        height:14, depth: 12,  lensRadius: 3.0,  frontFlapWidth:1.2, frontFlapDepth: 2.0, 
        frontFlapThickness: 0.8, frontFlapSocketThickness: 0.6,
        ... flashParams('Godox')
};

const rf = concave.buildReflector(C)


// const diffPlane2 = rf.diffPlane2
console.log(rf.diffPlane2(0.8)(0))
console.log(rf.diffPlane(0.8)(0))
console.log(rf.lensArch(0.8))
console.log(rf.sideArch(0.2))
console.log(curve.pointsOf( rf.diffuser2 ))

/*
console.log(rf.diffuser2)
console.log(rf.diff2(0.2))
console.log(rf.diffuser2(0.2))
*/
