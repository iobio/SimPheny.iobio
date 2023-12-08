// var baseURL = "http://localhost:8911/"
var baseURL = "https://mosaic-staging.chpc.utah.edu/phenomatcher-backend/"
//url for compare data
var compareURL = baseURL + "compare?terms="
//url for getting the patientMap
var patientMapURL = baseURL + "population"

export async function getPatientMap() {
    let patientMap = await fetch(patientMapURL)
    return patientMap.json() 
}

export async function getSimScores(terms) {
    //make terms into a comma separated string for use in url
    terms = terms.join(",")
    let simScoresResponse = await fetch(compareURL + terms)
    return simScoresResponse.json() //will ultimately return an object with the scores_dict and the scores_list
}

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