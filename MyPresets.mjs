
function _meike(){
    const flashHeight = 2.9, flashBottomHeight = 8.0, height = flashHeight + flashBottomHeight
    return { flashHeight, flashBottomHeight, height, flashBackShift: 4.5, flashWidth: 6.1};
}

function _godox(){
    const flashHeight = 3.6, flashBottomHeight = 11.5, height = flashHeight + flashBottomHeight
    return { flashHeight, flashBottomHeight, height, flashBackShift: 5, flashWidth: 6.4}
}


export function extractPresets(query){
    return {
        width: 24,  
        height:14, lensRadius: 3.1,  
        depth: 20,
        frontFlapWidth: 1.2, frontFlapDepth: 2.0, 
        frontFlapThickness: 0.8, frontFlapSocketThickness: 0.6,
        flashFlapDepth: 3.2,
        lensAroundWidth: 2.8,
        ... ( query.preset == 'Meike' ? _meike(): _godox() )
    }
}
