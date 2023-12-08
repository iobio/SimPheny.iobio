<template>
    <NavBar
        :udnPatientIdsList="udnPatientIds"
        :showPtSelectOverlay="showPtSelectOverlay"
        :targetPatient="targetPatient"
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
    import NavBar from './NavBar.vue'
    import LeftBar from './LeftBar.vue'
    import MatchesPane from './MatchesPane.vue'
    import TargetPatient from '../models/TargetPatient.js'
    import * as Be from '../data/fetchFromBackend.js'
    import { transformPatientMap } from '../data/getData'

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
                targetId: null,
                targetTerms: [],
                targetGenes: [],
                udnPatientIds: [],
                showPtSelectOverlay: false,
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
                this.similarityMap = similarityRes.scores_dict;
                this.rankedList = similarityRes.scores_list;
            },
            async setPatientAndGetMatches(targetId, targetTerms, targetGenes) {
                //inside of this function we need a signal to the application that the 
                //target patient has changed and we are reloading the matches when we get the matches then we can set up everything again
                this.targetId = targetId;
                this.targetTerms = targetTerms;
                this.targetGenes = targetGenes;

                this.showPtSelectOverlay = false;
                await this.calcScores(this.targetTerms);
                this.patientMap = await transformPatientMap(this.targetId, targetTerms, targetGenes, this.similarityMap, this.$hpoTermsMap);
                this.targetPatient = this.patientMap[this.targetId];
                console.log(this.targetPatient);

                this.chartScales.xMin = this.rankedList[this.rankedList.length - 1].score;
                this.chartScales.xMax = this.rankedList[1].score; //for now we do this because targets are in the data set
            },
            async reloadMatches(updatedPatient) {
                this.targetPatient = updatedPatient;
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
</style>