import Patient from "./Patient.js";

export default class MatchPatient extends Patient {
    constructor(patientId, patientObject, simObject) {
        super(patientId, patientObject, simObject);

        this.genesInCommon = []
        this.phenotypesInCommon = []

        this.genGenesList();
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