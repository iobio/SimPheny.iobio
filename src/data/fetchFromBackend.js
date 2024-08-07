
// var baseURL = "http://localhost:8911/" //for local testing
var baseURL = import.meta.env.VITE_APP_BACKEND_URL;

//url for compare data
var compareURL_udn = baseURL + "compare_udn/"
var compareURL_orpha = baseURL + "compare_orpha/"
var compareURL_decipher = baseURL + "compare_decipher/"
//url for getting the patientMap
var patientMapURL_udn = baseURL + "udn_population"
var patientMapURL_orpha = baseURL + "orpha_population"
var patientMapURL_decipher = baseURL + "decipher_population"

export async function getPatientMap(which="udn") {
    if (which == "udn") {
      let patientMap = await fetch(patientMapURL_udn)
      let jsonData = await patientMap.json()

      return jsonData
    } else if (which == "orpha") {
      let patientMap = await fetch(patientMapURL_orpha)
      let jsonData = await patientMap.json()

      return jsonData
    } else if (which == "decipher") {
      let patientMap = await fetch(patientMapURL_decipher)
      let jsonData = await patientMap.json()

      return jsonData
    } else if (which == "all") {
      let patientMap = await fetch(patientMapURL_udn)
      let patientMap2 = await fetch(patientMapURL_orpha)
      let patientMap3 = await fetch(patientMapURL_decipher)
      let jsonData = await patientMap.json()
      let jsonData2 = await patientMap2.json()
      let jsonData3 = await patientMap3.json()

      //these objects need to be joined up into one
      jsonData = {...jsonData, ...jsonData2, ...jsonData3}

      return jsonData
    } else if (which == "both") {
      let patientMap = await fetch(patientMapURL_udn)
      let patientMap2 = await fetch(patientMapURL_orpha)
      let jsonData = await patientMap.json()
      let jsonData2 = await patientMap2.json()

      //these objects need to be joined up into one
      jsonData = {...jsonData, ...jsonData2}

      return jsonData
    }
}

export async function getSimScores(terms, which="udn") {
    //make terms into a comma separated string for use in url
    terms = terms.join(",")

    if (which == "udn") {
      try {
        let simScoresResponse = await fetch(compareURL_udn + terms);
        let simScoreResJson = await simScoresResponse.json()
        return simScoreResJson

      } catch (error) {
        return null
      }
    } else if (which == "orpha") {
      try {
        let simScoresResponse = await fetch(compareURL_orpha + terms);
        let simScoreResJson = await simScoresResponse.json()
        return simScoreResJson

      } catch (error) {
        return null
      }
    } else if (which == "decipher") {
      try {
        let simScoresResponse = await fetch(compareURL_decipher + terms);
        let simScoreResJson = await simScoresResponse.json()
        return simScoreResJson

      } catch (error) {
        return null
      }
    } else if (which == "all"){
      try {
        let simScoresResponse = await fetch(compareURL_udn + terms);
        let simScoresResponse2 = await fetch(compareURL_orpha + terms);
        let simScoresResponse3 = await fetch(compareURL_decipher + terms);
        let simScoreResJson = await simScoresResponse.json()
        let simScoreResJson2 = await simScoresResponse2.json()
        let simScoreResJson3 = await simScoresResponse3.json()

        //Join all the objects together
        let joinedRankedVec = simScoreResJson.ranked_vec.ScoreVec.concat(simScoreResJson2.ranked_vec.ScoreVec).concat(simScoreResJson3.ranked_vec.ScoreVec);
        let joinedScoreMap = {...simScoreResJson.score_map.ScoreMap, ...simScoreResJson2.score_map.ScoreMap, ...simScoreResJson3.score_map.ScoreMap}

        simScoreResJson.ranked_vec.ScoreVec = joinedRankedVec
        simScoreResJson.score_map.ScoreMap = joinedScoreMap

        return simScoreResJson
      } catch (error) {
        return null
      }
    } else if (which == "both") {
      try {
        let simScoresResponse = await fetch(compareURL_udn + terms);
        let simScoresResponse2 = await fetch(compareURL_orpha + terms);
        let simScoreResJson = await simScoresResponse.json()
        let simScoreResJson2 = await simScoresResponse2.json()

        //join the two objects.ranked_vec.ScoreVec which is a list of scores and score_map.ScoreMap which is a dictionary of scores        
        let joinedRankedVec = simScoreResJson.ranked_vec.ScoreVec.concat(simScoreResJson2.ranked_vec.ScoreVec)
        let joinedScoreMap = {...simScoreResJson.score_map.ScoreMap, ...simScoreResJson2.score_map.ScoreMap}

        simScoreResJson.ranked_vec.ScoreVec = joinedRankedVec
        simScoreResJson.score_map.ScoreMap = joinedScoreMap

        return simScoreResJson

      } catch (error) {
        return null
      }
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