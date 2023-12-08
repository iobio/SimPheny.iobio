import Patient from "./Patient.js";
import * as Be from "../data/fetchFromBackend.js";
import Phenotype from './Phenotype.js';
import Gene from './Gene.js';

export default class TargetPatient extends Patient {
    constructor(patientId, patientObject, simObject) {
        super(patientId, patientObject, simObject);

        this.userInputGenesList = [];
        this.userInputHpoIdList = [];
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

    async genGenesList() {
        let genesNames = []
        //generates the genesList from the geneNamesList
        if (this.userInputGenesList.length > 0) {
            genesNames = this.userInputGenesList;
        } else {
            genesNames = this.geneNamesList;
        }
        
        if (genesNames.length == 0) {
            this.genesList = [];
            return;
        }

        let genesRes = await Be.getGeneList(genesNames);
        for (let gene of genesRes) {
            this.genesList.push(new Gene(gene["gene_id"], gene["gene_symbol"]));
        }
    }

    genPhenotypeList(phenotypesMap) {
        let hpoIdList = []
        if (this.userInputHpoIdList.length > 0) {
            hpoIdList = this.userInputHpoIdList;
        } else {
            hpoIdList = this.hpoIdList;
        }
        //generates the phenotypeList from the hpoIdList
        for (let term of hpoIdList) {
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