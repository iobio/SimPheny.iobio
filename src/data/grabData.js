import MatchPatient from "../models/MatchPatient";
import Phenotype from "../models/Phenotype";

const hpoDbURL = "http://localhost:8911/id/"
const hpoDbURLAll = "http://localhost:8911/all/"

export default async function grabData(patientsCsvUrl, similarityCsvUrl, patientID) {
  
  // Parse the CSV files
  const patientsMatrix = await parseFromFile(patientsCsvUrl);

  // Create a map of patient IDs to patient objects
  let patientMap = await createPatientMap(patientsMatrix);
  let similarityMap = null;
  let rankedList = null;

  const similarityMatrix = await parseFromFile(similarityCsvUrl);
  [similarityMap, patientMap, rankedList] = createSimilarityMap(similarityMatrix, patientMap, patientID);
  //remove any patients with an id of ""
  delete patientMap[""];
  delete similarityMap[""];

  return { patientMap, similarityMap, rankedList };
}
//Create a map of match patients with their ID as a key and then the patient object
async function createPatientMap(matrix) {
  var hpoIdMap = {}
  hpoIdMap = await getAllPhenotypes(hpoDbURLAll)

  let patientMap = {};
  var notAdded = 0;
  for (let i = 1; i < matrix.length; i++) {
    let row = matrix[i];
    let patient = new MatchPatient(row[0]);
    patient.setId(row[0]);
    patient.setDx(row[1]);
    patient.setGenesList(row[2]);
    patient.setClinicalDiagnosis(row[3]);
    patient.setHpoIdList(row[4]);

    let patientHpoIds = patient.getHpoIdList()
    let patientPhenList = []
    
    if (!patientHpoIds || patientHpoIds === "NONE") {
      notAdded++;
      continue;
    }

    for (let id of patientHpoIds) {
        id = id.trim()
        if (!(hpoIdMap.hasOwnProperty(id))) {
          let phen = await getPhenotype(id, hpoDbURL);

          if (phen) {
            hpoIdMap[id] = phen;
            let newPhenotype = new Phenotype(phen["id"], phen["name"], phen["definition"], phen["comment"] , phen["synonyms"]);
            patientPhenList.push(newPhenotype);
          } else {
            hpoIdMap[id] = null;
            notAdded++;
          }
        } else {
          //look it up on the hpoIdMap
          let phen = hpoIdMap[id]
          if (phen) {
            let newPhenotype = new Phenotype(id, phen["name"], phen["definition"], phen["comment"] , phen["synonyms"]);
            patientPhenList.push(newPhenotype);
          }
        }
    }

    patient.setPhenotypeList(patientPhenList)
    patientMap[row[0]] = patient;
  }
  console.log("Not added: ", notAdded)
  return patientMap;
}

function createSimilarityMap(matrix, patientMap, targetPatientID) {
  let header = null;
  let similarityList = null;

  // Combined step to get header and target patient similarity list
  for (let row of matrix) {
    if (row[0] === targetPatientID) {
      //Use the similarity score matrix to loop through when we get to the target patient id grab that row and use it as the similarity list
      similarityList = row.slice(1);
    } else if (header === null) {
      //Take header off of the similarity score matrix and store it in a list
      header = row.slice(1);
    }
    if (header && similarityList) break;
  }

  // Combined step to sort and create a map
  let similarityMap = {};
  let tuples = [];

  for (let i = 0; i < header.length; i++) {
    //Zip the header and the similarity list together to create a list of tuples
    tuples.push([header[i], similarityList[i]]);
  }

  tuples.sort((a, b) => b[1] - a[1]);  // Sort by similarity score

  for (let i = 0; i < tuples.length; i++) {
    let [patientID, simScore] = tuples[i];
    //Create a map of the similarity scores for the target patient based on the similarity score matrix
    similarityMap[patientID] = { simScore, rank: i + 1 };
    if (!patientMap[patientID]) continue;

    patientMap[patientID].setSimilarityScore(simScore);
    patientMap[patientID].setRank(i + 1);
  }
  return [similarityMap, patientMap, tuples];
}

async function parseFromFile(url) {
  const response = await fetch(url);
  const csv = await response.text();
  const lines = csv.split("\n");

  const matrix = lines.map(line => line.split(",").map(cell => cell.replace(/;/g, ",")));

  return matrix;
}

async function getPhenotype(id, url) {
  const response = await fetch(url + encodeURI(id));
  return response.json();
}

async function getAllPhenotypes(url) {
  const response = await fetch(url);
  return response.json();
}