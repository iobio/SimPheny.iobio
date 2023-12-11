import * as Be from "../data/fetchFromBackend.js";
import Phenotype from './Phenotype.js';
import Gene from './Gene.js';

export default class Patient {
    constructor(patientId, patientObject, simObject) {
        this.id = patientId
        this.similarityScore = simObject["Score"]
        this.rank = simObject["Rank"]
        this.dx = patientObject["Dx/Udx"]

        let geneNames = patientObject["Genes"]
        //turn geneNames into a string
        let geneNamesString = JSON.stringify(geneNames)
        if (geneNamesString.includes(",")) {
            geneNamesString = geneNamesString.replace(/[\[\]"']/g, "")
            this.geneNamesList = geneNamesString.split(",")
        } else {
            //remove [] from the string by replacing them with nothing
            geneNamesString = geneNamesString.replace(/[\[\]"']/g, "")
            this.geneNamesList = [geneNamesString]
        }

        this.clinicalDiagnosis = patientObject["Clin diagnosis"]
        this.hpoIdList = patientObject["Terms"]
        this.genesList = [] //generate this from the geneNamesList
        this.phenotypeList = [] //generate this from the hpoIdList
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
        //requires a list of gene objects
        // if the type of the genesList objects are not genes then dont set the genesList return an error
        if (genesList.some(gene => !(gene instanceof Gene))) {
            console.log("Error: genesList must be a list of Gene objects")
            return;
        }
        this.genesList = genesList;
    }
    async genGenesList() {
        if (this.geneNamesList.length == 0) {
            this.genesList = [];
            return;
        }
        
        //generates the genesList from the geneNamesList
        let genesRes = await Be.getGeneList(this.geneNamesList);
        for (let gene of genesRes) {
            this.genesList.push(new Gene(gene["gene_id"], gene["gene_symbol"]));
        }
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

    getPhenotypeList() {
        return this.phenotypeList;
    }
    setPhenotypeList(phenotypeList) {
        //requires a list of phenotype objects
        // if the type of the phenotypeList objects are not phenotypes then dont set the phenotypeList return an error
        if (phenotypeList.some(phenotype => !(phenotype instanceof Phenotype))) {
            console.log("Error: phenotypeList must be a list of Phenotype objects")
            return;
        }
        this.phenotypeList = phenotypeList;
    }
    genPhenotypeList(phenotypesMap) {
        //generates the phenotypeList from the hpoIdList
        for (let term of this.hpoIdList) {
            //if the hpoId is not in the allPhenotypes object then just add it with no other info
            if (!(term in phenotypesMap.byHpoId || term in phenotypesMap.byTerm)) {
                this.phenotypeList.push(new Phenotype(term, "No Term Found", "", "", []));
                continue;
            } else if (term in phenotypesMap.byTerm) {
                term = phenotypesMap.byTerm[term];
            }
            let phen = phenotypesMap.byHpoId[term];
            this.phenotypeList.push(new Phenotype(term, phen["name"], phen["definition"], phen["comment"], phen["synonyms"]));
        }
    }
}