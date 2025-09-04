import MatchPatient from "../models/MatchPatient";
import TargetPatient from "../models/TargetPatient";
import * as Be from "./fetchFromBackend.js";

export async function transformPatientMap(
    targetPatientId,
    targetTerms,
    targetGenes,
    simScoresObj,
    phenotypesMap,
    whichPopulation = "udn",
) {
    let patientMapRes = await Be.getPatientMap(whichPopulation);

    let patientMap = {};
    let patientObject;
    let simObject;
    let targetGenesList = targetGenes;

    if (typeof targetGenes[0] !== "string") {
        targetGenesList = targetGenes.map((gene) => gene.gene_symbol);
    }

    //first just generate and add the target patient
    if (targetPatientId !== "custom" && patientMapRes.hasOwnProperty(targetPatientId)) {
        patientObject = patientMapRes[targetPatientId];
        simObject = simScoresObj[targetPatientId];
    } else {
        patientObject = { "Dx/Udx": "None-Target", Genes: targetGenesList, "Clin diagnosis": "None-Target", Terms: targetTerms };
        simObject = { score: 1, rank: 1 };
    }

    let targetPatient = new TargetPatient(targetPatientId, patientObject, simObject);

    targetPatient.setUserInputGenesList(targetGenesList);
    targetPatient.setUserInputHpoIdList(targetTerms);
    targetPatient.genPhenotypeList(phenotypesMap);
    await targetPatient.genGenesList();

    patientMap[targetPatientId] = targetPatient;

    for (let patientId in patientMapRes) {
        if (patientMapRes.hasOwnProperty(patientId)) {
            if (patientId != targetPatientId) {
                let patientObject = patientMapRes[patientId];
                let simObject = simScoresObj[patientId];

                let matchPatient = new MatchPatient(patientId, patientObject, simObject);
                matchPatient.genPhenotypeList(phenotypesMap);
                matchPatient.genPhenotypesInCommon(targetPatient.getPhenotypeList());
                await matchPatient.genGenesList();
                matchPatient.genGenesInCommon(targetPatient.getGenesList());

                patientMap[patientId] = matchPatient;
            } else {
                //skip the target patient
            }
        }
    }
    return { patientMap: patientMap, targetPatient: targetPatient };
}

export async function updatePatientMap(newSimMap, oldPatientMap, newTargetGeneList = null) {
    let updatedPatientMap = oldPatientMap;
    for (let patientId in oldPatientMap) {
        if (newSimMap.hasOwnProperty(patientId)) {
            updatedPatientMap[patientId].setSimilarityScore(newSimMap[patientId].score);
            if (newTargetGeneList !== null) {
                updatedPatientMap[patientId].genGenesInCommon(newTargetGeneList);
            }
        }
    }
    return updatedPatientMap;
}
