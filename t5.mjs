function bobo(){
    console.log('bobo called')
    return 'bobo'
}

class Loko{
    constructor(p){
        this.p = p
    }

    get len() {
        console.log('getter')
        return ( 
            this._len  || (this._len = bobo()))
    }
}

const loko = new Loko([])
console.log(loko.len)
console.log(loko.len)
console.log(loko.len)
