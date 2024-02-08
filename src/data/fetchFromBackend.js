// var baseURL = "http://localhost:8911/"
var baseURL = "https://mosaic-staging.chpc.utah.edu/phenomatcher-backend/"
//url for compare data
var compareURL = baseURL + "compare/"
//url for getting the patientMap
var patientMapURL = baseURL + "population"

export async function getPatientMap() {
    let patientMap = await fetch(patientMapURL)
    return patientMap.json() 
}

export async function getSimScores(terms) {
    //make terms into a comma separated string for use in url
    terms = terms.join(",")

    try {
      let simScoresResponse = await fetch(compareURL + terms);
      return simScoresResponse.json()
    } catch (error) {
      return null
    }
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
  
  export async function getAllPhenotypesById() {
    let url = baseURL + "all/terms/ids/"
    const response = await fetch(url);
    return response.json();
  }
  export async function getAllPhenotypesByName() {
    let url = baseURL + "all/terms/names/"
    const response = await fetch(url);
    return response.json();
  }
  
  export async function getGenesWithPhenotype(id) {
    /*
    Takes a phenotype id and returns the genes associated with that phenotype
    */
    let url = baseURL + "id/get_genes/"
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
    let url = baseURL + "gene/get_terms/"
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