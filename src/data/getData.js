import MatchPatient from "../models/MatchPatient";
import TargetPatient from "../models/TargetPatient";
import * as Be from "./fetchFromBackend.js";

export async function transformPatientMap(targetPatientId, targetTerms, targetGenes, simScoresObj, phenotypesMap){
  let patientMapRes = await Be.getPatientMap();

  let patientMap = {};

  //first just generate and add the target patient
  let patientObject = patientMapRes[targetPatientId];
  let simObject = simScoresObj[targetPatientId];

  let targetPatient = new TargetPatient(targetPatientId, patientObject, simObject);
  targetPatient.setUserInputGenesList(targetGenes);
  targetPatient.setUserInputHpoIdList(targetTerms);
  targetPatient.genPhenotypeList(phenotypesMap);
  await targetPatient.genGenesList();

  patientMap[targetPatientId] = targetPatient;

  for(let patientId in patientMapRes){
    if (patientMapRes.hasOwnProperty(patientId)){
      if (patientId != targetPatientId){
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
    } else {
      console.log("Error: patientMapRes does not have property " + patientId);
    }
  }
  return patientMap;
}

export async function updatePatientMap(newSimMap, oldPatientMap) {
  let updatedPatientMap = oldPatientMap;
  for (let patientId in oldPatientMap) {
    if (newSimMap.hasOwnProperty(patientId)) {
      updatedPatientMap[patientId].setSimilarityScore(newSimMap[patientId].score);
    }
  }
  return updatedPatientMap;
}