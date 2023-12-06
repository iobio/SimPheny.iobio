import pandas as pd
from pyhpo import HPOSet
from Custom_Scoring import *
import numpy as np

#Utility Functions ----------------------------------------------------------------------------------------------

def openFile(infilename):
    rows = pd.read_csv(infilename)
    return rows

def createPatientDict(new_rows):
    ID_list = list(new_rows['ID'])
    patient_dict = {}
    for id in ID_list:
        terms = list(new_rows.loc[new_rows['ID'] == id]['Terms'])
        #terms = list(new_rows[new_rows['ID'].str.contains(id)]['Terms'])
        termsList = terms[0].split('; ')
        patient_dict[id] = termsList
    return patient_dict

def rankedDict(scores_list):
    ''' Create dictionary where keys=background patients; 
    score_dict[patient]['Score']=simScore to query
    score_dict[patient]['Rank'] = rank to query (between 1 and # patients)'''
    df = pd.DataFrame(scores_list, columns=['ID', 'Score'])
    df_sorted = df.sort_values(by='Score', ascending=False).reset_index(drop=True)
    df_sorted['Rank'] = np.array(df_sorted.index) + 1
    score_dict = {}
    for patient in list(df_sorted['ID']):
        score = df_sorted.loc[df_sorted['ID']==patient]['Score'].item()
        rank = df_sorted.loc[df_sorted['ID']==patient]['Rank'].item()
        score_dict[patient] = {}
        score_dict[patient]['Score'] = score
        score_dict[patient]['Rank'] = rank
    return score_dict

#HpoCompare class------------------------------------------------------------------------------------------------

class HpoCompare:
    def __init__(self, ontology, background_data_url, method='custom_jaccardIC', kind='omim', combine='funSimAvg'):
        self.ontology = ontology
        self.background_data = background_data_url
        self.method = method
        self.kind = kind
        self.combine = combine
        self.fileRows = openFile(self.background_data)
        self.patient_dict = createPatientDict(self.fileRows)

    def calculateSimilarity(self, input_terms):
        ''''Calculate similarity scores between input patient and every patient in background data.
        Required: input_terms = list of HPO terms for input patient '''
        patient_list = list(self.patient_dict.keys())
        scores_list=[]
        ##create HPOSet object for input patient
        try:
            input_HPOSet = HPOSet.from_queries(input_terms)
        except RuntimeError:
            for term in input_terms:
                try:
                    term_ont = self.ontology.get_hpo_object(term)
                except RuntimeError:
                    print(term, 'is not a valid HPO term')
                    break
        ##compare input patient to list of background patients
        for patient in patient_list:
            try:
                patient_HPOSet = HPOSet.from_queries(self.patient_dict[patient])
            except RuntimeError:
                for term in self.patient_dict[patient]:
                    try:
                        ont=self.ontology.get_hpo_object(term)
                    except RuntimeError:
                        print(term, 'is not a valid HPO term')
                        break

            simScore = input_HPOSet.similarity(patient_HPOSet, method=self.method, kind=self.kind, combine=self.combine)
            scores_list.append([patient, simScore])
            # scores_dict = rankedDict(scores_list) #create dictionary of scores and ranks
        return scores_list
