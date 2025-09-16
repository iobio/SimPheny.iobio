var baseURL = "http://localhost:8911/"; //for local testing
// var baseURL = import.meta.env.VITE_APP_BACKEND_URL;

//url for compare data
var compareURL_udn = baseURL + "compare_udn/";
var compareURL_orpha = baseURL + "compare_orpha/";
var compareURL_decipher = baseURL + "compare_decipher/";
var compareURL_clinvar = baseURL + "compare_clinvar/";
var compareURL_pheno = baseURL + "compare_phenopackets/";
//url for getting the patientMap
var patientMapURL_udn = baseURL + "udn_population";
var patientMapURL_orpha = baseURL + "orpha_population";
var patientMapURL_decipher = baseURL + "decipher_population";
var patientMapURL_clinvar = baseURL + "clinvar_population";
var patientMapURL_pheno = baseURL + "phenopackets_population";

export async function getPatientMap(which = "udn") {
    if (which == "udn") {
        let patientMap = await fetch(patientMapURL_udn);
        let jsonData = await patientMap.json();

        return jsonData;
    } else if (which == "clinvar") {
        let patientMap = await fetch(patientMapURL_clinvar);
        let jsonData = await patientMap.json();

        return jsonData;
    } else if (which == "orpha") {
        let patientMap = await fetch(patientMapURL_orpha);
        let jsonData = await patientMap.json();

        return jsonData;
    } else if (which == "decipher") {
        let patientMap = await fetch(patientMapURL_decipher);
        let jsonData = await patientMap.json();

        return jsonData;
    } else if (which == "pheno") {
        let patientMap = await fetch(patientMapURL_pheno);
        let jsonData = await patientMap.json();

        return jsonData;
    } else {
        return null;
    }
}

export async function getSimphenyScore(hit_terms, hit_gene, sim_score, num_query_genes, num_hpo_terms, data_bg = "udn") {
    //if the population is not one of the allowed values then return null
    if (!["udn", "clinvar", "decipher", "orpha", "pheno"].includes(data_bg)) {
        return null;
    }

    let url = baseURL + "simpheny_score";
    let request_body = {
        hit_terms: hit_terms,
        gene_symbol: hit_gene,
        sim_score: sim_score,
        num_query_genes: num_query_genes,
        num_hpo_terms: num_hpo_terms,
        data_bg: data_bg,
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request_body),
    });
    //if the response is not ok then return null
    if (!response.ok) {
        return null;
    }
    return response.json();
}

export async function getSimScores(terms, which = "udn") {
    //make terms into a comma separated string for use in url
    terms = terms.join(",");

    if (which == "udn") {
        try {
            let simScoresResponse = await fetch(compareURL_udn + terms);
            let simScoreResJson = await simScoresResponse.json();
            return simScoreResJson;
        } catch (error) {
            return null;
        }
    } else if (which == "clinvar") {
        try {
            let simScoresResponse = await fetch(compareURL_clinvar + terms);
            let simScoreResJson = await simScoresResponse.json();
            return simScoreResJson;
        } catch (error) {
            return null;
        }
    } else if (which == "orpha") {
        try {
            let simScoresResponse = await fetch(compareURL_orpha + terms);
            let simScoreResJson = await simScoresResponse.json();
            return simScoreResJson;
        } catch (error) {
            return null;
        }
    } else if (which == "decipher") {
        try {
            let simScoresResponse = await fetch(compareURL_decipher + terms);
            let simScoreResJson = await simScoresResponse.json();
            return simScoreResJson;
        } catch (error) {
            return null;
        }
    } else if (which == "pheno") {
        try {
            let simScoresResponse = await fetch(compareURL_pheno + terms);
            let simScoreResJson = await simScoresResponse.json();
            return simScoreResJson;
        } catch (error) {
            return null;
        }
    } else {
        return null;
    }
}

export async function getPhenotypeWithId(id) {
    let url = baseURL + "id/";
    const response = await fetch(url + encodeURI(id));
    //if the response is not ok then return null
    if (!response.ok) {
        return null;
    }
    return response.json();
}

export async function getPhenotypeWithName(name) {
    let url = baseURL + "name/";
    const response = await fetch(url + encodeURI(name));
    //if the response is not ok then return null
    if (!response.ok) {
        return null;
    }
    return response.json();
}

export async function getAllPhenotypesById() {
    let url = baseURL + "all/terms/ids/";
    const response = await fetch(url);
    return response.json();
}
export async function getAllPhenotypesByName() {
    let url = baseURL + "all/terms/names/";
    const response = await fetch(url);
    return response.json();
}

export async function getGenesWithPhenotype(id) {
    /*
    Takes a phenotype id and returns the genes associated with that phenotype
    */
    let url = baseURL + "id/get_genes/";
    const response = await fetch(url + encodeURI(id));
    //if the response is not ok then return null
    if (!response.ok) {
        return null;
    }
    return response.json();
}

export async function getPhenotypesWithGene(id) {
    /*
    Takes a gene id and returns the phenotypes associated with that gene
    */
    let url = baseURL + "gene/get_terms/";
    const response = await fetch(url + encodeURI(id));
    //if the response is not ok then return null
    if (!response.ok) {
        return null;
    }
    return response.json();
}

export async function getGeneById(id) {
    let url = baseURL + "gene/id/";
    const response = await fetch(url + encodeURI(id));
    //if the response is not ok then return null
    if (!response.ok) {
        return null;
    }
    return response.json();
}

export async function getGeneByName(name) {
    let url = baseURL + "gene/name/";
    const response = await fetch(url + encodeURI(name));
    //if the response is not ok then return null
    if (!response.ok) {
        return null;
    }
    return response.json();
}

export async function getGeneList(geneNameList) {
    let url = baseURL + "gene/names/";
    //turn the list into a concatenated string
    geneNameList = geneNameList.join(",");
    //take out spaces
    geneNameList = geneNameList.replace(/ /g, "");
    const response = await fetch(url + encodeURI(geneNameList));
    //if the response is not ok then return null
    if (!response.ok) {
        return null;
    }
    return response.json();
}
