//Will be a phenotype class with a hpoId and term (for now)

//Will be a class with a name for now to just represent the variant gene name

class Phenotype {
    constructor(hpoId=null, term=null) {
        this.hpoId = hpoId;
        this.term = term; 
    }

    getHpoId() {
        return this.hpoId;
    }
    setHpoId(hpoId) {
        this.hpoId = hpoId;
    }
    getTerm() {
        return this.term;
    }
    setTerm(term) {
        this.term = term;
    }
}
export default Phenotype;