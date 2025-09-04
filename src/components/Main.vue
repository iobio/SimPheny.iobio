<template>
    <div id="main-parent-container">
        <div v-if="showLoading" id="loading-container">
            <!-- Loading indicator -->
            <v-progress-circular indeterminate="disable-shrink" color="#19354D" :size="110" :width="10">
                <template v-slot:default>Loading...</template>
            </v-progress-circular>
        </div>

        <div id="error-toast">
            <div>Unable to load patient matches from provided phenotypes or genes.</div>
        </div>

        <NavBar
            :showPtSelectOverlay="showPtSelectOverlay"
            :targetPatient="targetPatient"
            :whichPopulation="whichPopulation"
            @set-target-patient="setPatientAndGetMatches"
            @set-mosaic-false="fromMosaic = false"
            @updatePopulationChoice="updatePopulationChoice"></NavBar>

        <div id="main-content-container">
            <LeftBar :targetPtProp="targetPatient" :fromMosaic="fromMosaic" @patientInfoChanged="reloadMatches"></LeftBar>

            <MatchesPane
                :targetPatient="targetPatient"
                :patientMap="patientMap"
                :chartScales="chartScales"
                :whichPopulation="whichPopulation"></MatchesPane>
        </div>
    </div>
</template>

<script>
import NavBar from "./NavBar.vue";
import LeftBar from "./LeftBar.vue";
import MatchesPane from "./MatchesPane.vue";
import * as Be from "../data/fetchFromBackend.js";
import MosaicSession from "../models/MosaicSession";
import { transformPatientMap, updatePatientMap } from "../data/getData";

export default {
    name: "Main",
    components: {
        NavBar,
        LeftBar,
        MatchesPane,
    },
    props: {
        mosaicUrlParams: Object,
        mosaicProjectId: Number,
        mosaicSampleId: Number,
        mosaicSession: MosaicSession,
        fromMosaic: Boolean,
    },
    data() {
        return {
            whichPopulation: "udn",
            patientMap: {},
            ptMapObj: {},
            similarityMap: {},
            rankedList: [],
            targetPatient: null,
            hpoTermsMap: {},
            targetId: null,
            targetTerms: [],
            targetGenes: [],
            udnPatientIds: [],
            showPtSelectOverlay: false,
            showLoading: false,
            chartScales: {
                xMin: 0,
                xMax: 1,
            },
        };
    },
    async mounted() {
        try {
            let terms = await this.mosaicSession.promiseGetSampleHpoTerms(this.mosaicProjectId, this.mosaicSampleId);
            // turn the terms into just the hpo ids
            terms = terms.map((term) => term.hpo_id);

            // set the target patient and get the matches
            this.targetId = "custom";
            this.targetGenes = [];
            this.targetTerms = terms;
            this.setPatientAndGetMatches(this.targetId, this.targetTerms, this.targetGenes);
        } catch (error) {
            this.showErrorToast();
            this.ptMapObj = await Be.getPatientMap(this.whichPopulation);

            this.udnPatientIds = Object.keys(this.ptMapObj);
            this.showPtSelectOverlay = true;
        }
    },
    methods: {
        async updatePopulationChoice(choice) {
            this.whichPopulation = choice;

            if (this.fromMosaic && this.mosaicSession) {
                try {
                    let terms = await this.mosaicSession.promiseGetSampleHpoTerms(this.mosaicProjectId, this.mosaicSampleId);
                    // turn the terms into just the hpo ids
                    terms = terms.map((term) => term.hpo_id);

                    // set the target patient and get the matches
                    this.targetId = "custom";
                    this.targetGenes = [];
                    this.targetTerms = terms;
                    this.setPatientAndGetMatches(this.targetId, this.targetTerms, this.targetGenes);
                } catch (error) {
                    this.showErrorToast();
                    this.ptMapObj = await Be.getPatientMap(this.whichPopulation);
                    this.udnPatientIds = Object.keys(this.ptMapObj);
                    this.showPtSelectOverlay = true;
                }
            } else {
                //if we change this we need to reset things
                this.patientMap = {};
                this.similarityMap = {};
                this.rankedList = [];

                this.showLoading = true;

                this.ptMapObj = await Be.getPatientMap(this.whichPopulation);
                this.udnPatientIds = Object.keys(this.ptMapObj);
                this.hpoTermsMap["byHpoId"] = await Be.getAllPhenotypesById();
                this.hpoTermsMap["byTerm"] = await Be.getAllPhenotypesByName();

                let usedTerms = this.targetPatient
                    .getPhenotypeList()
                    .filter((term) => term.relevant === true)
                    .map((term) => term.hpoId);
                let usedGenes = this.targetPatient.getGenesList();
                await this.calcScores(usedTerms);

                let res = await transformPatientMap(
                    this.targetId,
                    usedTerms,
                    usedGenes,
                    this.similarityMap,
                    this.hpoTermsMap,
                    this.whichPopulation,
                );
                this.patientMap = res.patientMap;

                //delete the target patient from the patient map if it exists
                if (this.patientMap.hasOwnProperty(this.targetPatient.id)) {
                    delete this.patientMap[this.targetPatient.id];
                }

                // Now find all the patients that have genes in common and get their simpheny scores in parallel only for UDN patients
                let patientsWithGenesInCommon = [];
                if (this.whichPopulation === "udn") {
                    patientsWithGenesInCommon = Object.values(this.patientMap)
                        .filter((patient) => patient.genesInCommon.length > 0)
                        .filter((patient) => {
                            return patient.id.startsWith("UDN:");
                        });

                    // Make sure the genes in common are marked as relevant
                    patientsWithGenesInCommon.forEach((patient) => {
                        patient.getGenesList().forEach((gene) => {
                            if (this.targetGenes.includes(gene.name)) {
                                gene.relevant = true;
                            }
                        });
                    });
                } else if (this.whichPopulation === "clinvar") {
                    patientsWithGenesInCommon = Object.values(this.patientMap)
                        .filter((patient) => patient.genesInCommon.length > 0)
                        .filter((patient) => {
                            return patient.id.startsWith("CLIN:");
                        });

                    // Make sure the genes in common are marked as relevant
                    patientsWithGenesInCommon.forEach((patient) => {
                        patient.getGenesList().forEach((gene) => {
                            if (this.targetGenes.includes(gene.name)) {
                                gene.relevant = true;
                            }
                        });
                    });
                }

                let simphenyPromises = [];
                patientsWithGenesInCommon.forEach((patient) => {
                    let numTargetGenes = this.targetPatient.genesList.length;
                    let numHpoTerms = this.targetPatient.hpoIdList.length;
                    let dataBg = this.whichPopulation;
                    simphenyPromises.push(
                        Be.getSimphenyScore(
                            patient.hpoIdList,
                            patient.genesInCommon[0].gene_symbol,
                            patient.similarityScore,
                            numTargetGenes,
                            numHpoTerms,
                            dataBg,
                        ),
                    );
                });

                let simphenyScores = await Promise.all(simphenyPromises);
                patientsWithGenesInCommon.forEach((patient, index) => {
                    patient.setSimphenyScore(simphenyScores[index]);
                });

                this.chartScales.xMin = this.rankedList[this.rankedList.length - 1][1];
                this.chartScales.xMax = this.rankedList[1][1];

                this.showLoading = false;
            }
        },
        showErrorToast() {
            let toast = document.getElementById("error-toast");
            toast.style.height = "100px";
            setTimeout(() => {
                toast.style.height = "0";
            }, 3000);
        },
        async calcScores(targetTerms) {
            let similarityRes = await Be.getSimScores(targetTerms, this.whichPopulation);

            if (similarityRes === null) {
                throw new Error("No similarity scores returned from backend");
            } else {
                this.similarityMap = similarityRes.score_map.ScoreMap;
                this.rankedList = similarityRes.ranked_vec.ScoreVec;
            }
        },
        async setPatientAndGetMatches(targetId, targetTerms, targetGenes) {
            this.hpoTermsMap["byHpoId"] = await Be.getAllPhenotypesById();
            this.hpoTermsMap["byTerm"] = await Be.getAllPhenotypesByName();
            this.showLoading = true;

            this.targetId = targetId;
            this.targetTerms = targetTerms;
            this.targetGenes = targetGenes;

            this.showPtSelectOverlay = false;

            try {
                await this.calcScores(this.targetTerms);
                let res = await transformPatientMap(
                    this.targetId,
                    targetTerms,
                    targetGenes,
                    this.similarityMap,
                    this.hpoTermsMap,
                    this.whichPopulation,
                );
                this.patientMap = res.patientMap;

                this.targetPatient = res.targetPatient;

                this.ptMapObj = this.patientMap; //this is passed to the chooser overlay so will have all patients
                this.udnPatientIds = Object.keys(this.patientMap);

                //delete the target patient from the patient map if it exists
                if (this.patientMap.hasOwnProperty(this.targetPatient.id)) {
                    delete this.patientMap[this.targetPatient.id];
                }

                // Now find all the patients that have genes in common and get their simpheny scores in parallel only for UDN patients
                let patientsWithGenesInCommon = [];
                if (this.whichPopulation === "udn") {
                    patientsWithGenesInCommon = Object.values(this.patientMap)
                        .filter((patient) => patient.genesInCommon.length > 0)
                        .filter((patient) => {
                            return patient.id.startsWith("UDN:");
                        });

                    // Make sure the genes in common are marked as relevant
                    patientsWithGenesInCommon.forEach((patient) => {
                        patient.getGenesList().forEach((gene) => {
                            if (this.targetGenes.includes(gene.name)) {
                                gene.relevant = true;
                            }
                        });
                    });
                } else if (this.whichPopulation === "clinvar") {
                    patientsWithGenesInCommon = Object.values(this.patientMap)
                        .filter((patient) => patient.genesInCommon.length > 0)
                        .filter((patient) => {
                            return patient.id.startsWith("CLIN:");
                        });

                    // Make sure the genes in common are marked as relevant
                    patientsWithGenesInCommon.forEach((patient) => {
                        patient.getGenesList().forEach((gene) => {
                            if (this.targetGenes.includes(gene.name)) {
                                gene.relevant = true;
                            }
                        });
                    });
                }

                let simphenyPromises = [];
                patientsWithGenesInCommon.forEach((patient) => {
                    let numTargetGenes = this.targetPatient.genesList.length;
                    let numHpoTerms = this.targetPatient.hpoIdList.length;
                    let dataBg = this.whichPopulation;
                    simphenyPromises.push(
                        Be.getSimphenyScore(
                            patient.hpoIdList,
                            patient.genesInCommon[0].gene_symbol,
                            patient.similarityScore,
                            numTargetGenes,
                            numHpoTerms,
                            dataBg,
                        ),
                    );
                });

                let simphenyScores = await Promise.all(simphenyPromises);
                patientsWithGenesInCommon.forEach((patient, index) => {
                    patient.setSimphenyScore(simphenyScores[index]);
                });

                this.chartScales.xMin = this.rankedList[this.rankedList.length - 1][1];
                this.chartScales.xMax = this.rankedList[1][1]; //for now we do this because targets are in the data set

                this.showLoading = false;
            } catch (error) {
                this.similarityMap = {};
                this.rankedList = [];
                this.patientMap = {};
                this.showErrorToast();
                this.showLoading = false;
                //show the patient select overlay again
                this.showPtSelectOverlay = true;
            }
        },
        async reloadMatches(updatedPatient, whichChanged = false) {
            this.showLoading = true;

            if (!whichChanged) {
                //If triggered only by a change in selected genes or phenotypes
                this.targetPatient = updatedPatient;

                let newTerms = this.targetPatient
                    .getPhenotypeList()
                    .filter((term) => term.relevant === true)
                    .map((term) => term.hpoId);
                let newGenes = this.targetPatient.getGenesList().filter((gene) => gene.relevant === true);

                await this.calcScores(newTerms);
                this.chartScales.xMin = this.rankedList[this.rankedList.length - 1][1];
                this.chartScales.xMax = this.rankedList[1][1]; //for now we do this because targets are in the data set
                this.patientMap = await updatePatientMap(this.similarityMap, this.patientMap, newGenes);
            } else {
                //if we change the population we want the patient to stay the same but the population to change
            }

            this.showLoading = false;
        },
    },
};
</script>

<style lang="sass">
#main-parent-container
    height: 100%
    width: 100%
    display: flex
    flex-direction: column
    justify-content: flex-start
    align-items: center
#error-toast
    position: fixed
    top: 0
    left: 0
    height: 0px
    width: 100%
    display: flex
    align-items: center
    justify-content: center
    background-color: #ff0000 //Red has heck
    color: white
    font-size: 1.5em
    z-index: 9999
    overflow: hidden
    transition: height 0.25s
#main-content-container
    height: 100%
    width: 100%
    display: flex
    flex-direction: row
    justify-content: flex-start
    align-items: flex-start
#loading-container
    position: absolute
    top: 0
    left: 0
    height: 100vh
    width: 100vw
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    background-color: rgba(255, 255, 255, 0.75) //just a little transparent grey-ish
    z-index: 9999
    .v-progress-circular
        svg
           animation-duration: .2s
</style>
