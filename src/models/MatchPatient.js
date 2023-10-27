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

        this.phenotypeList = []
        this.genesInCommon = []
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
        this.dx = dx.toLowerCase();
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
        //remove leading and trailing whitespace
        genesList = genesList.map(gene => gene.trim());
        //if any of the genes are empty strings, or puncutation or NONE then remove them
        let puncutation = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
        genesList = genesList.filter(gene => gene.length > 0 && gene !== "NONE" && gene !== "NA" && !puncutation.test(gene));
        
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

    getPhenotypeList() {
        return this.phenotypeList;
    }
    setPhenotypeList(phenotypeList) {
        this.phenotypeList = phenotypeList;
    }

    getGenesInCommon() {
        return this.genesInCommon;
    }
    setGenesInCommon(genesInCommon) {
        this.genesInCommon = genesInCommon;
    }
}
export default MatchPatient;