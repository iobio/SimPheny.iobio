import * as hpoDb from '../data/grabData.js'
import Gene from './Gene.js';

class TargetPatient {
    constructor(id, userInputHpoIdList=[], userInputGenesList=[]) {
        this.id = id;
        this.userInputGenesList = userInputGenesList;
        this.userInputHpoIdList = userInputHpoIdList;

        this.similarityScore = null;
        this.rank = null;
        this.dx = null;
        this.genesList = [];
        this.clinicalDiagnosis = null;
        this.hpoIdList = [];
        this.hpoTermList = [];

        this.phenotypeList = [];
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
        if (typeof genesList === "string" || genesList.every(item => typeof item === 'string')) {
            //if it is a list of strings then we need to convert it to a string
            if (genesList.every(item => typeof item === 'string')) {
                genesList = genesList.join(",");
            }
            //make sure there are no spaces
            genesList = genesList.replace(/\s/g, '');
            genesList = genesList.replace(/;/g, ',');
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
        if (typeof hpoIdList === "string") {
            hpoIdList = hpoIdList.split(",");
        }
        this.hpoTermList = hpoTermList;
    }
    getUserInputGenesList() {
        return this.userInputGenesList;
    }
    setUserInputGenesList(userInputGenesList) {
        this.userInputGenesList = userInputGenesList;
    }
    getUserInputHpoIdList() {
        return this.userInputHpoIdList;
    }
    setUserInputHpoIdList(userInputHpoIdList) {
        this.userInputHpoIdList = userInputHpoIdList;
    }

    getPhenotypeList() {
        return this.phenotypeList;
    }
    setPhenotypeList(phenotypeList) {
        this.phenotypeList = phenotypeList;
    }

    setFromPatientObject(patient) {
        this.rank = patient.getRank();
        this.dx = patient.getDx();
        
        if (patient.getSimilarityScore()) {
            this.similarityScore = patient.getSimilarityScore();
        } 

        if (this.genesList.length == 0 || this.genesList == null) {
            this.genesList = patient.getGenesList();
        }

        this.clinicalDiagnosis = patient.getClinicalDiagnosis();

        if (this.hpoIdList.length == 0 || this.hpoIdList == null) {
            this.hpoIdList = patient.getHpoIdList();
        }

        if (this.hpoTermList.length == 0 || this.hpoTermList == null) {
            this.hpoTermList = patient.getHpoTermList();
        }

        if (this.phenotypeList.length == 0 || this.phenotypeList == null) {
            this.phenotypeList = patient.getPhenotypeList();
        }
    }
}
export default TargetPatient;