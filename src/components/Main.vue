<template>
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
        :udnPatientIdsList="udnPatientIds"
        :showPtSelectOverlay="showPtSelectOverlay"
        :targetPatient="targetPatient"
        :patientMap="ptMapObj"
        @set-target-patient="setPatientAndGetMatches"
        @set-mosaic-false="fromMosaic = false"></NavBar>

    <div id="main-content-container">
        <LeftBar
            :targetPtProp="targetPatient"
            :fromMosaic="fromMosaic"
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
    import MosaicSession from '../models/MosaicSession.js';
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
                mosaicUrlParams: null,
                mosaicProjectId: null,
                mosaicSampleId: null,
                fromMosaic: false,
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
            this.initMosaicSession();
        },
        created(){
            // let access_token='f77e77f1bf35364bf0c5db506c7e9c0bacb5d608' //TESTING

            this.mosaicUrlParams = new URLSearchParams(window.location.search);
            if (this.mosaicUrlParams.get('access_token')){
                localStorage.setItem('mosaic-iobio-tkn', this.mosaicUrlParams.get('access_token'));
            } else {
                localStorage.setItem('mosaic-iobio-tkn', '');
            }
            // localStorage.setItem('mosaic-iobio-tkn', access_token); //TESTING
        },
        methods: {
            async initMosaicSession() {
                if (localStorage.getItem('mosaic-iobio-tkn') && localStorage.getItem('mosaic-iobio-tkn').length > 0){
                    // let tokenType = 'Bearer' //TESTING
                    // let source = 'https%3A%2F%2Fmosaic.chpc.utah.edu' //TESTING
                    // source = decodeURIComponent(source) //TESTING
                    // this.mosaicProjectId = 1281 //TESTING
                    // let clientAppNumber = 2 //TESTING
                    // this.mosaicSampleId = 56980 //TESTING

                    //Gets everything from the URL and assigns what is needed
                    this.mosaicProjectId = Number(this.mosaicUrlParams.get('project_id'));
                    this.mosaicSampleId = Number(this.mosaicUrlParams.get('sample_id'));
                    let tokenType = this.mosaicUrlParams.get('token_type');
                    let source = this.mosaicUrlParams.get('source');
                    source = decodeURIComponent(source);
                    let clientAppNumber = this.mosaicUrlParams.get('client_application_id');

                    //Create a new MosaicSession object
                    let session = new MosaicSession(clientAppNumber);
                    session.promiseInit(source, this.mosaicProjectId, tokenType, this.mosaicSampleId);

                    //grab the hpo terms from the session
                    let terms = await session.promiseGetSampleHpoTerms(this.mosaicProjectId, this.mosaicSampleId);
                    // turn the terms into just the hpo ids
                    terms = terms.map(term => term.hpo_id);
                    // set the target patient and get the matches
                    this.targetId = 'custom'
                    this.targetGenes = []
                    this.targetTerms = terms
                    this.fromMosaic = true;
                    this.setPatientAndGetMatches(this.targetId, this.targetTerms, this.targetGenes);
                } else {
                    this.showPtSelectOverlay = true;
                }
            },
            showErrorToast() {
                let toast = document.getElementById('error-toast');
                toast.style.height = '100px';
                setTimeout(() => {
                    toast.style.height = '0';
                }, 3000);
            },
            async calcScores(targetTerms){
                let similarityRes = await Be.getSimScores(targetTerms);

                if (similarityRes === null) {
                    throw new Error('No similarity scores returned from backend');
                } else {
                    this.similarityMap = similarityRes.score_map.ScoreMap;
                    this.rankedList = similarityRes.ranked_vec.ScoreVec;
                }
            },
            async setPatientAndGetMatches(targetId, targetTerms, targetGenes) {
                this.hpoTermsMap["byHpoId"] = await Be.getAllPhenotypesById()
                this.hpoTermsMap["byTerm"] = await Be.getAllPhenotypesByName()
                this.showLoading = true;

                this.targetId = targetId;
                this.targetTerms = targetTerms;
                this.targetGenes = targetGenes;

                this.showPtSelectOverlay = false;

                try {
                    await this.calcScores(this.targetTerms);

                    this.patientMap = await transformPatientMap(this.targetId, targetTerms, targetGenes, this.similarityMap, this.hpoTermsMap);

                    this.ptMapObj = this.patientMap; //this is passed to the chooser overlay so will have all patients
                    this.targetPatient = this.patientMap[this.targetId];
                    //delete the target patient from the patient map
                    delete this.patientMap[this.targetId];

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
            async reloadMatches(updatedPatient) {
                this.showLoading = true;

                this.targetPatient = updatedPatient;
                let newTerms = this.targetPatient.getPhenotypeList().filter(term => term.relevant === true).map(term => term.hpoId);
                let newGenes = this.targetPatient.getGenesList().filter(gene => gene.relevant === true); //Not used yet
                await this.calcScores(newTerms);
                this.chartScales.xMin = this.rankedList[this.rankedList.length - 1][1];
                this.chartScales.xMax = this.rankedList[1][1]; //for now we do this because targets are in the data set
                this.patientMap = await updatePatientMap(this.similarityMap, this.patientMap, newGenes);

                this.showLoading = false;
            }
        },
    }
</script>

<style lang="sass">
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