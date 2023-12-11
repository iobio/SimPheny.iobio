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
            this.genesInCommon = [];
            return;
        }
        for (let gene of this.genesList) {
            if (targetGenes.some(targetGene => targetGene.gene_symbol == gene.gene_symbol)) {
                this.genesInCommon.push(gene);
            }
        }
    }
    getPhenotypesInCommon() {
        return this.phenotypesInCommon;
    }
    genPhenotypesInCommon(targetPhenotypes) {
        if (targetPhenotypes.length == 0 || this.phenotypeList.length == 0) {
            this.phenotypesInCommon = [];
            return;
        }
        for (let phenotype of this.phenotypeList) {
            if (targetPhenotypes.some(targetPhenotype => targetPhenotype.id == phenotype.id)) {
                this.phenotypesInCommon.push(phenotype);
            }
        }
    }
}