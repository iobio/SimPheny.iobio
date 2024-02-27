import $ from 'jquery';

export default class MosaicSession {
  constructor(client_application_id) {
    this.client_application_id = client_application_id;
    this.url = null;
    this.apiVersion =  '/api/v1';

    this.user = null;

    this.experiment_id = null;
    this.project = null;
    this.geneSet = null;

    this.tokenType = null;

    this.authorizationString = null;
  }

  promiseInit(source, projectId, tokenType, sampleId=null) {
    let self = this;
    self.tokenType = tokenType;
    self.api = source + self.apiVersion;
    self.project_id = projectId;
    self.sample_id = sampleId;

    self.authorizationString = tokenType + " " + localStorage.getItem('mosaic-iobio-tkn');
    
    return new Promise((resolve, reject) => {

      //USER
      self.promiseGetCurrentUser()
      .then(function(data) {
        self.user = data; // get the user and store that here as part of our session object
      })
      .catch(function(error) {
        console.log(error)
        reject(error)
      })

    })
  }

  promiseGetCurrentUser() {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.getCurrentUser()
        .done(response => {
          resolve(response)
        })
        .fail(error => {
          let errorMsg = error.responseText ? error.responseText : "";
          let msg = "Error getting current Mosaic user.  Your authorization may have expired.  Make sure you are still logged into Mosaic, and relaunch the project."
          reject(msg);
        })
    })
  }

  getCurrentUser() {
    let self = this;
    return $.ajax({
      url: self.api + '/user',
      type: 'GET',

      headers: {
        Authorization: self.authorizationString,
        accept: 'application/json',
      },
    });
  } 

  //----Get the sample hpo terms
  promiseGetSampleHpoTerms(projectId, sampleId) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.getSampleHpoTerms(projectId, sampleId)
      .done(response => {
        resolve(response)
      })
      .fail(error => {
        let errorMsg = self.getErrorMessage(error);
        console.log("Error getting sample hpo terms from Mosaic with sample_id " + sampleId);
        console.log(errorMsg)
        reject("Error getting sample hpo terms " + sampleId + ": " + errorMsg);
      }
      )
    })
  }

  getSampleHpoTerms(projectId, sampleId) {
    let self = this;
    return $.ajax({
      url: self.api + '/projects/' + projectId + '/samples/' + sampleId + '/hpo-terms',
      type: 'GET',
      headers: {
        Authorization: self.authorizationString,
        accept: 'application/json',
      },
    });
  }

  getErrorMessage(error) {
    if (error.hasOwnProperty('responseJSON') && error.responseJSON.hasOwnProperty('message')) {
      return error.responseJSON.message;
    } else if (error.hasOwnProperty('responseText')) {
      return error.responseText;
    } else {
      return error.toString()
    }
  }

}
