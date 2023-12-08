import Patient from "./Patient.js";

export default class MatchPatient extends Patient {
    constructor(patientId, patientObject, simObject) {
        super(patientId, patientObject, simObject);

        this.genesInCommon = []
        this.phenotypesInCommon = []
    }

    getGenesInCommon() {
        return this.genesInCommon;
    }
    genGenesInCommon(targetGenes) {
        if (targetGenes.length == 0 || this.genesList.length == 0) {
            console.log("Error: targetGenes or this.genesList is empty");
            return;
        }
        for (let gene of this.genesList) {
            if (targetGenes.includes(gene)) {
                this.genesInCommon.push(gene);
            }
        }
    }
    getPhenotypesInCommon() {
        return this.phenotypesInCommon;
    }
    genPhenotypesInCommon(targetPhenotypes) {
        if (targetPhenotypes.length == 0 || this.phenotypeList.length == 0) {
            console.log("Error: targetPhenotypes or this.phenotypeList is empty");
            return;
        }
        for (let phenotype of this.phenotypeList) {
            if (targetPhenotypes.includes(phenotype)) {
                this.phenotypesInCommon.push(phenotype);
            }
        }
    }
}