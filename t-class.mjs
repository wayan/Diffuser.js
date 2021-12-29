class Koko {
    constructor(b){
        this.b = b
    }

    bb(){ return this.b }
}

const koko = new Koko(10)
console.log(koko.bb())

const c2 = class PP extends koko {
}

const c22 = new c2()
