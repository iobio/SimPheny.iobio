import MatchPatient from "../models/MatchPatient";
import TargetPatient from "../models/TargetPatient";
import * as Be from "./fetchFromBackend.js";

export async function transformPatientMap(targetPatientId, targetTerms, targetGenes, simScoresObj, phenotypesMap){
  let patientMapRes = await Be.getPatientMap();

  let patientMap = {};
  let patientObject;
  let simObject;

  //first just generate and add the target patient
  if (targetPatientId !== 'custom') {
    patientObject = patientMapRes[targetPatientId];
    simObject = simScoresObj[targetPatientId];
  } else {
    patientObject = {"Dx/Udx": "None-Target", "Genes": targetGenes, "Clin diagnosis": "None-Target", "Terms": targetTerms};
    simObject = {"score": 1, "rank": 1};
  }

  let targetPatient = new TargetPatient(targetPatientId, patientObject, simObject);

  targetPatient.setUserInputGenesList(targetGenes);
  targetPatient.setUserInputHpoIdList(targetTerms);
  targetPatient.genPhenotypeList(phenotypesMap);
  await targetPatient.genGenesList();

  patientMap[targetPatientId] = targetPatient;

  console.log("simScoresObj: ", simScoresObj);

  for(let patientId in patientMapRes){
    if (patientMapRes.hasOwnProperty(patientId)){
      if (patientId != targetPatientId){
        let patientObject = patientMapRes[patientId];
        let simObject = simScoresObj[patientId];
        
        if (simObject === undefined) {
          console.log("Error: simObject is undefined for patientId " + patientId);
          console.log("patient", patientObject);
        } else{
          console.log('okay', patientId, patientObject)
        }

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

export async function updatePatientMap(newSimMap, oldPatientMap, newTargetGeneList=null) {
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