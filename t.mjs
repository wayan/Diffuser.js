import {range,fc,steps} from './Util.mjs'
import curve from './Curve.mjs'
import concave from './Concave.mjs'


    function shapeOutline(shape){   
        const rendered = curve.renderPlane(shape)
        return [
            ... rendered.map((r) => r.c[0]),
            ... rendered.map((r) => r.c[1]).reverse(),
            rendered[0].c[0]
        ]
    }

    function flashTypeParams(flashType){
        if ( flashType == 'Meike'){
             return { flashHeight: 2.7, flashBottomHeight: 8.5, flashBackShift: 1, flashWidth: 6};
        }
        else {
            // flashType == 'Godox'? 
            return { flashHeight: 3.6, flashBottomHeight: 11.5, flashBackShift: 5, flashWidth: 6.4, height: 3.6 + 11.5};
            return { flashHeight: 3.6, flashBottomHeight: 11.5, flashBackShift: 2, flashWidth: 6.4, height: 3.6 + 11.5};
        }
    }

    const C = {
            ppi: 157,
            width: 24,  
            height:14, depth: 12,  lensRadius: 3.0,  frontFlapWidth: 1.2, frontFlapDepth: 2.0, 
            depth: 20,
            frontFlapThickness: 0.8, frontFlapSocketThickness: 0.6,
            ... flashTypeParams('Godox'),
        };

const rf = concave.buildReflector(C);

for (let shape of rf.reflectorShapes2){
    console.log(JSON.stringify(shapeOutline(shape)))
}




