class MatchPatient {
    constructor(id) {
        this.id = id;

        this.similarityScore = null;
        this.rank = null;
        this.dx = null;
        this.genesList = [];
        this.clinicalDiagnosis = null;
        this.hpoIdList = [];
        this.hpoTermList = [];

        this.variantsList = [];
    }

    getId() {
        return this.id;
    }
    setId(id) {
        this.id = id;
    }
    getSimilarityScore() {
        return this.similarityScore;
    }
    setSimilarityScore(similarityScore) {
        this.similarityScore = similarityScore;
    }
    getRank() {
        return this.rank;
    }
    setRank(rank) {
        this.rank = rank;
    }
    getDx() {
        return this.dx;
    }
    setDx(dx) {
        this.dx = dx;
    }
    getGenesList() {
        return this.genesList;
    }
    setGenesList(genesList) {
        if (typeof genesList === "string") {
            genesList = genesList.split(",");
        }
        if (genesList == "NONE") {
            genesList = []
        }
        this.genesList = genesList;
    }
    getClinicalDiagnosis() {
        return this.clinicalDiagnosis;
    }
    setClinicalDiagnosis(clinicalDiagnosis) {
        this.clinicalDiagnosis = clinicalDiagnosis;
    }
    getHpoIdList() {
        return this.hpoIdList;
    }
    setHpoIdList(hpoIdList) {
        if (typeof hpoIdList === "string") {
            hpoIdList = hpoIdList.split(",");
        }
        this.hpoIdList = hpoIdList;
    }
    getHpoTermList() {
        return this.hpoTermList;
    }
    setHpoTermList(hpoTermList) {
        if (typeof hpoTermList === "string") {
            hpoTermList = hpoTermList.split(",");
        }
        this.hpoTermList = hpoTermList;
    }
    getVariantsList() {
        return this.variantsList;
    }
    setVariantsList(variantsList) {
        if (typeof variantsList === "string") {
            variantsList = variantsList.split(",");
        }
        this.variantsList = variantsList;
    }
}
export default MatchPatient;