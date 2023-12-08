import MatchPatient from "../models/MatchPatient";
import TargetPatient from "../models/TargetPatient";
import * as Be from "./fetchFromBackend.js";

export async function transformPatientMap(targetPatientId, simScoresObj, phenotypesMap){
  let patientMapRes = await Be.getPatientMap();

  let patientMap = {};

  for(let patientId in patientMapRes){
    if (patientMapRes.hasOwnProperty(patientId)){
      if (patientId != targetPatientId){
        let patientObject = patientMapRes[patientId];
        let simObject = simScoresObj[patientId];
        let matchPatient = new MatchPatient(patientObject, simObject);
        matchPatient.genPhenotypeList(phenotypesMap);
        patientMap[patientId] = matchPatient;
      } else {
        let patientObject = patientMapRes[patientId];
        let simObject = simScoresObj[patientId];
        let targetPatient = new TargetPatient(patientObject, simObject);
        targetPatient.genPhenotypeList(phenotypesMap);
        patientMap[patientId] = targetPatient;
      }
    } else {
      console.log("Error: patientMapRes does not have property " + patientId);
    }
  }
  return patientMap;
}