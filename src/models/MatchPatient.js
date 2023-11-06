import Gene from './Gene.js';

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
        this.phenotypesInCommon = []
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
    async setGenesList(genesList) {
        if (typeof genesList === "string" || (Array.isArray(genesList) && genesList.every(item => typeof item === 'string'))) {
            //if it is a list of strings then we need to convert it to a string
            if (Array.isArray(genesList) && genesList.every(item => typeof item === 'string')) {
                genesList = genesList.join(",");
            }
            //make sure there are no spaces
            genesList = genesList.replace(/\s|;/g, ',');
            //use database to get bulk gene list
            try {
                genesList = await hpoDb.getGeneList(genesList);

                var newGeneList = [];
                for (let g of genesList) {
                    let gene = new Gene(g.gene_id, g.gene_symbol);
                    newGeneList.push(gene);
                }
                genesList = newGeneList;
            } catch (error) {
                //set to empty list if there is an error
                genesList = [];
            }
        } else if (genesList == null || genesList.length == 0 || genesList == undefined) {
            genesList = [];
        } else if (typeof genesList == "object") {
            var newGeneList = [];
            for (let g of genesList) {
                let gene = new Gene(g.gene_id, g.gene_symbol);
                newGeneList.push(gene);
            }
            genesList = newGeneList;
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
    getPhenotypesInCommon() {
        return this.phenotypesInCommon;
    }
    setPhenotypesInCommon(phenotypesInCommon) {
        this.phenotypesInCommon = phenotypesInCommon;
    }
}
export default MatchPatient;