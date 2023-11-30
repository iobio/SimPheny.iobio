import pandas as pd
from pyhpo import Ontology, HPOSet
from Custom_Scoring import *
import numpy as np

###Variables###
#1) Background data - patients to score input patient against
# File with at least patient ID + term list columns (must have ['ID', 'Terms'])
background_data = 'UdnPatients.csv' 
#2) Method (Similarity scoring method - one of custom_jaccardIC, resnik, lin, jc, jc2, rel, ic, graphic, dist)
method= 'custom_jaccardIC'
#3) Kind (Kind of information content to be calculated - one of omim, orpha, decipher, gene)
kind = 'omim'
#4) Combine - The method to combine similarity measures (one of funSimAvg, funSimMax, BMA)
combine = 'funSimAvg'

####Input Patient### (POI=Patient of Interest)
##example inputs:
poi_ID = 'Query_Patient'
poi_terms = ['HP:0001263', 'HP:0000252', 'HP:0000160', 'HP:0001513', 'HP:0001328', 'HP:0000582']

def main():
    _ = Ontology() ##takes ~ 1 min
    ##open background data file 
    patientData = openFile(background_data)
    ##create dictionary where keys=patient IDs and values=term lists
    patientDict = createPatientDict(patientData) 
    ##calculate similarity scores between query patient and all background patients
    scoreList = calculateSimilarity(poi_terms,patientDict, method, combine, kind)
    ##sort scores and created dictionary with scores+ranks
    scoreDict = rankedDict(scoreList)



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


def calculateSimilarity(input_terms, patient_dict, method='custom_jaccardIC',combine="funSimAvg",kind='omim'):
    ''''Calculate similarity scores between input patient and every patient in background data.
    Required: patient dictionary, scoring scheme
    Not required: combine (default: funSimAvg); kind(where information content calculated from)(default:omim) '''
    patient_list = list(patient_dict.keys())
    scores_list=[]
    ##create HPOSet object for input patient
    try:
         input_HPOSet = HPOSet.from_queries(input_terms)
    except RuntimeError:
         for term in input_terms:
              try:
                   term_ont = Ontology.get_hpo_objecter(term)
              except RuntimeError:
                   print(term, 'is not a valid HPO term')
                   break
    ##compare input patient to list of background patients
    for patient2 in patient_list:
        try:
            patient2_HPOSet = HPOSet.from_queries(patient_dict[patient2])
        except RuntimeError:
            for term in patient_dict[patient2]:
                try:
                    ont=Ontology.get_hpo_object(term)
                except RuntimeError:
                    print(term, 'is not a valid HPO term')
                    break

        simScore = input_HPOSet.similarity(patient2_HPOSet, method=method, kind=kind, combine=combine)
        scores_list.append([patient2, simScore])
    return scores_list


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