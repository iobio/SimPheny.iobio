<script>
    import NavBar from './NavBar.vue'
    import LeftBar from './LeftBar.vue'
    import MatchesPane from './MatchesPane.vue'
    import grabData from '../data/grabData.js'
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
            }
        },
        async mounted() {
            this.udnPatientsUrl = "./UdnPatients.csv";
            this.similarityMatrixUrl = "./SimilarityMatrix.csv";
            this.targetPatient = new TargetPatient('UDN293752');

            if (this.targetPatient.id){
                let { targetPatient, patientMap, similarityMap, rankedList } = await grabData(this.udnPatientsUrl, this.similarityMatrixUrl, this.targetPatient.id);

                this.patientMap = patientMap;
                this.similarityMap = similarityMap;
                this.rankedList = rankedList;

                this.targetPatient = targetPatient;
            }
        },
        methods: {

        },
    }
</script>

<template>
    <NavBar></NavBar>

    <div id="main-content-container">
        <LeftBar
            :targetPatient="targetPatient"></LeftBar>
            
        <MatchesPane
            :targetPatient="targetPatient"
            :patientMap="patientMap"></MatchesPane>
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