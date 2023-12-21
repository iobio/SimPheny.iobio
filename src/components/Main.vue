<template>
    <div v-if="showLoading" id="loading-container">
        <!-- Loading indicator -->
        <v-progress-circular indeterminate color="#21351f" :size="110" :width="10">
            <template v-slot:default>Loading...</template>
        </v-progress-circular>
    </div>
    <NavBar
        :udnPatientIdsList="udnPatientIds"
        :showPtSelectOverlay="showPtSelectOverlay"
        :targetPatient="targetPatient"
        :patientMap="ptMapObj"
        @set-target-patient="setPatientAndGetMatches"></NavBar>

    <div id="main-content-container">
        <LeftBar
            :targetPtProp="targetPatient"
            @patientInfoChanged="reloadMatches"></LeftBar>
            
        <MatchesPane
            :targetPatient="targetPatient"
            :patientMap="patientMap"
            :chartScales="chartScales"></MatchesPane>

    </div>
</template>

<script>
    import NavBar from './NavBar.vue';
    import LeftBar from './LeftBar.vue';
    import MatchesPane from './MatchesPane.vue';
    import * as Be from '../data/fetchFromBackend.js';
    import { transformPatientMap, updatePatientMap } from '../data/getData';

    export default {
        name: 'Main',
        components: {
            NavBar, 
            LeftBar,
            MatchesPane,
        },
        data() {
            return {
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
                }
            }
        },
        async mounted() {
            this.ptMapObj = await Be.getPatientMap();
            this.udnPatientIds = Object.keys(this.ptMapObj);
            this.showPtSelectOverlay = true;
        },
        methods: {
            async calcScores(targetTerms){
                let similarityRes = await Be.getSimScores(targetTerms);
                this.similarityMap = similarityRes.score_map.ScoreMap;
                this.rankedList = similarityRes.ranked_vec.ScoreVec;
            },
            async setPatientAndGetMatches(targetId, targetTerms, targetGenes) {
                this.hpoTermsMap["byHpoId"] = await Be.getAllPhenotypesById()
                this.hpoTermsMap["byTerm"] = await Be.getAllPhenotypesByName()
                this.showLoading = true;
                console.time('setPatientAndGetMatches');

                this.targetId = targetId;
                this.targetTerms = targetTerms;
                this.targetGenes = targetGenes;

                this.showPtSelectOverlay = false;
                console.time('calcScores');
                await this.calcScores(this.targetTerms);
                console.timeEnd('calcScores');
                console.time('transformPatientMap');
                this.patientMap = await transformPatientMap(this.targetId, targetTerms, targetGenes, this.similarityMap, this.hpoTermsMap);
                console.timeEnd('transformPatientMap');
                this.ptMapObj = this.patientMap; //this is passed to the chooser overlay so will have all patients
                this.targetPatient = this.patientMap[this.targetId];
                //delete the target patient from the patient map
                delete this.patientMap[this.targetId];

                this.chartScales.xMin = this.rankedList[this.rankedList.length - 1][1];
                this.chartScales.xMax = this.rankedList[1][1]; //for now we do this because targets are in the data set

                console.timeEnd('setPatientAndGetMatches');
                this.showLoading = false;
            },
            async reloadMatches(updatedPatient) {
                this.showLoading = true;

                this.targetPatient = updatedPatient;
                let newTerms = this.targetPatient.getPhenotypeList().filter(term => term.relevant === true).map(term => term.hpoId);
                let newGenes = this.targetPatient.getGenesList().filter(gene => gene.relevant === true).map(gene => gene.geneSymbol); //Not used yet
                await this.calcScores(newTerms);
                this.chartScales.xMin = this.rankedList[this.rankedList.length - 1][1];
                this.chartScales.xMax = this.rankedList[1][1]; //for now we do this because targets are in the data set
                this.patientMap = await updatePatientMap(this.similarityMap, this.patientMap);

                this.showLoading = false;
            }
        },
    }
</script>

<style lang="sass">
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
        background-color: rgba(255, 255, 255, 0.75)
        z-index: 9999
</style>