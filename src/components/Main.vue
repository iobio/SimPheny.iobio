<script>
    import NavBar from './NavBar.vue'
    import LeftBar from './LeftBar.vue'
    import MatchesPane from './MatchesPane.vue'
    import grabData, { getUdnIds } from '../data/grabData.js'
    import TargetPatient from '../models/TargetPatient.js'

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
                similarityMap: {},
                rankedList: [],
                targetPatient: null,
                similarityMatrixUrl: null,
                udnPatientsUrl: null,
                udnPatientIds: [],
                showPtSelectOverlay: false,
                chartScales: null,
            }
        },
        async mounted() {
            this.udnPatientsUrl = "./UdnPatients.csv";
            this.similarityMatrixUrl = "./SimilarityMatrix.csv";
            this.udnPatientIds = await getUdnIds(this.similarityMatrixUrl);

            if (this.targetPatient != null) {
                this.getMatches();
            } else {
                this.showPtSelectOverlay = true;
            }
        },
        methods: {
            async getMatches(){
                let { targetPatient, patientMap, similarityMap, rankedList, chartScales } = await grabData(this.udnPatientsUrl, this.similarityMatrixUrl, this.targetPatient.id);

                this.patientMap = patientMap;
                this.similarityMap = similarityMap;
                this.rankedList = rankedList;
                this.chartScales = chartScales;

                this.targetPatient.setFromPatientObject(targetPatient);

            },
            async setPatientAndGetMatches(patient) {
                this.targetPatient = new TargetPatient(patient.id);
                this.targetPatient.setFromPatientObject(patient);
                this.showPtSelectOverlay = false;
                await this.getMatches();
            }
        },
    }
</script>

<template>
    <NavBar
        :udnPatientIdsList="udnPatientIds"
        :showPtSelectOverlay="showPtSelectOverlay"
        :targetPatient="targetPatient"
        @set-target-patient="setPatientAndGetMatches"></NavBar>

    <div id="main-content-container">
        <LeftBar
            :targetPatient="targetPatient"></LeftBar>
            
        <MatchesPane
            :targetPatient="targetPatient"
            :patientMap="patientMap"
            :chartScales="chartScales"></MatchesPane>
    </div>
</template>

<style>
    #main-content-container {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: flex-start;
    }
</style>