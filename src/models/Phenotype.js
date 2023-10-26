//Will be a phenotype class with a hpoId and term (for now)

//Will be a class with a name for now to just represent the variant gene name

class Phenotype {
    constructor(hpoId=null, term=null, definition='', comment='', synonyms=[]) {
        this.hpoId = hpoId;
        this.term = term;

        this.definition = definition
        this.comment = comment
        this.synonyms = synonyms

        this.relevant = true;
        this.matched = false;
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
    getDefitition(){
        return this.definition;
    }
    setDefitition(definition){
        this.definition = definition;
    }
    getComment(){
        return this.comment;
    }
    setComment(comment){
        this.comment = comment;
    }
    getSynonyms(){
        return this.synonyms;
    }
    setSynonyms(synonyms){
        this.synonyms = synonyms;
    }

    getRelevant() {
        return this.relevant;
    }
    setRelevant(relevant) {
        this.relevant = relevant;
    }
    getMatched() {
        return this.matched;
    }
    setMatched(matched) {
        this.matched = matched;
    }
}
export default Phenotype;