import MatchPatient from "../models/MatchPatient";
import TargetPatient from "../models/TargetPatient";
import Phenotype from "../models/Phenotype";
import Gene from "../models/Gene";

// var baseURL = "http://localhost:8911/"
var baseURL = "https://mosaic-staging.chpc.utah.edu/phenomatcher-backend/"

export default async function grabData(patientsCsvUrl, similarityCsvUrl, patientID) {
  
  // Parse the CSV files
  const patientsMatrix = await parseFromFile(patientsCsvUrl);

  // Create a map of patient IDs to patient objects
  let patientMap = await createPatientMap(patientsMatrix);
  let similarityMap = null;
  let rankedList = null;
  let chartScales = { xMin: 0, xMax: 0, yMin: 0, yMax: 0}

  const similarityMatrix = await parseFromFile(similarityCsvUrl);
  [similarityMap, patientMap, rankedList] = createSimilarityMap(similarityMatrix, patientMap, patientID);
  //remove any patients with an id of ""
  delete patientMap[""];
  delete similarityMap[""];

  //assign the target patient to that patient at the targetPatientID
  var targetPatient = new TargetPatient(patientID);
  targetPatient.setFromPatientObject(patientMap[patientID]);

  //delete the target patient from the patientMap
  delete patientMap[patientID];
  let maxGenesInCommon = 0;
  let minGenesInCommon = 90000;

  for (patientID in patientMap) {
    let patient = patientMap[patientID];
    let genesInCommon = [];
    let phenInCommon = [];
    let targetGenes = targetPatient.getGenesList();
    let targetPhen = targetPatient.getPhenotypeList();
    let patientGenes = patient.getGenesList();
    let patientPhen = patient.getPhenotypeList();
    //Genes In Common
    for (let gene of targetGenes) {
      if (patientGenes.some(patientGene => patientGene.getGeneId() === gene.getGeneId())) {
        genesInCommon.push(gene);
      }
    }
    //Phenotypes In Common
    for (let phen of targetPhen) {
      if (patientPhen.some(patientPhen => patientPhen.getHpoId() === phen.getHpoId())) {
        phenInCommon.push(phen);
      }
    }
    if (genesInCommon.length > 0) {
      if (genesInCommon.length > maxGenesInCommon) {
        maxGenesInCommon = genesInCommon.length;
      }
      patient.setGenesInCommon(genesInCommon);
    }
    if (genesInCommon.length < minGenesInCommon) {
      minGenesInCommon = genesInCommon.length;
    }
    patient.setPhenotypesInCommon(phenInCommon);
  }

  rankedList = rankedList.slice(1); // Remove the target patient which should be at the top
  //We are going to get the x min and max from the ranked list and the patient map
  let min = rankedList[rankedList.length - 1][0];
  chartScales.xMin = patientMap[min].getSimilarityScore();

  let max = rankedList[0][0];
  chartScales.xMax = patientMap[max].getSimilarityScore();

  //Set the y min and max based on the number of genes in common
  chartScales.yMin = minGenesInCommon;
  chartScales.yMax = maxGenesInCommon;


  return { targetPatient, patientMap, similarityMap, rankedList, chartScales};
}
//Create a map of match patients with their ID as a key and then the patient object
async function createPatientMap(matrix) {
  var hpoIdMap = {}
  hpoIdMap = await getAllPhenotypes()

  let patientMap = {};
  var notAdded = 0;
  for (let i = 1; i < matrix.length; i++) {
    let row = matrix[i];
    let patient = new MatchPatient(row[0]);
    patient.setId(row[0]);
    patient.setDx(row[1]);
    patient.setClinicalDiagnosis(row[3]);
    patient.setHpoIdList(row[4]);

    //We want to create a gene object for each gene in the list and then add it to the patient
    if (row[2] && row[2] !== "NONE") {
      let genes = row[2].split(";")
      //use the gene list function to get the gene objects
      let geneList = await getGeneList(genes) //the function already should convert the list to a string
      var newGeneList = []
      for (let g of geneList) {
        let gene = new Gene(g["gene_id"], g["gene_symbol"])
        newGeneList.push(gene)
      }
    }
    patient.setGenesList(newGeneList)

    let patientHpoIds = patient.getHpoIdList().map(id => id.trim().toUpperCase());
    patient.setHpoIdList(patientHpoIds)
    let patientPhenList = []
    
    if (!patientHpoIds || patientHpoIds === "NONE") {
      notAdded++;
      continue;
    }

    for (let id of patientHpoIds) {
        id = id.trim()
        if (!(hpoIdMap.hasOwnProperty(id))) {
          let phen = await getPhenotypeWithId(id);

          if (phen && phen["name"] && phen["definition"] && phen["comment"] && phen["synonyms"]) {
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
            let newPhenotype = new Phenotype(id);
            try {
              newPhenotype.setTerm(phen["name"]);
            } catch (e) {
              newPhenotype.setTerm("None");
            }

            try {
              newPhenotype.setDefitition(phen["definition"]);
            }
            catch (e) {
              newPhenotype.setDefitition("None");
            }

            try {
              newPhenotype.setComment(phen["comment"]);
            }
            catch (e) {
              newPhenotype.setComment("None");
            }

            try {
              newPhenotype.setSynonyms(phen["synonyms"]);
            }
            catch (e) {
              newPhenotype.setSynonyms("None");
            }

            patientPhenList.push(newPhenotype);
          }
        }
    }

    patient.setPhenotypeList(patientPhenList)

    patientMap[row[0]] = patient;
  }
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
    patientID = patientID.trim().toUpperCase();
    if (!patientMap[patientID]) continue;

    //Create a map of the similarity scores for the target patient based on the similarity score matrix
    similarityMap[patientID] = { simScore, rank: i + 1 };
    patientMap[patientID].setSimilarityScore(simScore);
    patientMap[patientID].setRank(i + 1); 
  }
  return [similarityMap, patientMap, tuples];
}

async function parseFromFile(url) {
  const response = await fetch(url);
  const csv = await response.text();
  const lines = csv.split("\n");
  //remove any other new line like characters
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(/\r/g, "");
  }

  const matrix = lines.map(line => line.split(",").map(cell => cell.replace(/;/g, ",")));

  return matrix;
}

export async function getUdnIds(similarityCsvUrl) {
  const response = await fetch(similarityCsvUrl);
  const csv = await response.text();
  //just take the first row which will contain all the patient ids and put that into a list remove any blank ones
  const lines = csv.split("\n");
  let udnIds = lines[0].split(",");
  udnIds = udnIds.filter(id => (id.length > 0) && (id !== " "));

  return udnIds;
}

//One off functions to get things from the hpo database

export async function getPhenotypeWithId(id) {
  let url = baseURL + "id/"
  const response = await fetch(url + encodeURI(id));
  //if the response is not ok then return null
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function getPhenotypeWithName(name) {
  let url = baseURL + "name/"
  const response = await fetch(url + encodeURI(name));
  //if the response is not ok then return null
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function getAllPhenotypes() {
  let url = baseURL + "all/hpoTerms/"
  const response = await fetch(url);
  return response.json();
}

export async function getGenesWithPhenotype(id) {
  /*
  Takes a phenotype id and returns the genes associated with that phenotype
  */
  let url = baseURL + "id/getGenes/"
  const response = await fetch(url + encodeURI(id));
  //if the response is not ok then return null
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function getPhenotypesWithGene(id){
  /*
  Takes a gene id and returns the phenotypes associated with that gene
  */
  let url = baseURL + "gene/getPhenotypes/"
  const response = await fetch(url + encodeURI(id));
  //if the response is not ok then return null
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function getGeneById(id) {
  let url = baseURL + "gene/id/"
  const response = await fetch(url + encodeURI(id));
  //if the response is not ok then return null
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function getGeneByName(name) {
  let url = baseURL + "gene/name/"
  const response = await fetch(url + encodeURI(name));
  //if the response is not ok then return null
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function getGeneList(geneNameList) {
  let url = baseURL + "gene/names/"
  //turn the list into a concatenated string
  geneNameList = geneNameList.join(",")
  //take out spaces
  geneNameList = geneNameList.replace(/ /g, "");
  const response = await fetch(url + encodeURI(geneNameList));
  //if the response is not ok then return null
  if (!response.ok) {
    return null;
  }
  return response.json();
}