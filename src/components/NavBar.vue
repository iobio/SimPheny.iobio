<template>
    <div id="nav-bar">
        <v-app-bar density="compact" color="#21351f">
            <v-btn @click="showOverlay=true" v-if="!targetPatient" variant="outlined">Add/Select Patient</v-btn>
            <v-btn @click="showOverlay=true" v-if="targetPatient" variant="outlined">Edit Patient</v-btn>
            <v-toolbar-title>Pheno-Matcher.iobio</v-toolbar-title>
        </v-app-bar>

        <v-overlay id="add-select-patient" v-model="showOverlay" persistent>
            <div id="add-select-dialog">
                <v-btn class="close-button" @click="showOverlay = false" icon="mdi-close-circle-outline" height="35px" width="35px"></v-btn>
                <h3>Input Target Patient Details</h3>
                <div v-if="udnPatientIdsList" id="udn-id-input" class="input-container">
                    <v-autocomplete
                    v-model="udnId"
                    :items="udnPatientIdsList"
                    variant="solo-filled"
                    label="UDN Patient Id" 
                    density="compact"></v-autocomplete>
                </div>

                <!-- Phenotype List Input -->
                <div class="input-container">
                    <v-textarea 
                        v-model="phenotypesText" 
                        variant="solo-filled"
                        label="Phenotypes" 
                        density="compact" 
                        no-resize
                        hint="insert comma or semi-colon separated list of phenotypes"></v-textarea>
                </div>
                <!-- variant List Input -->
                <div class="input-container">
                    <v-textarea 
                        v-model="genesText" 
                        variant="solo-filled"
                        label="Genes" 
                        density="compact"
                        no-resize 
                        hint="insert comma or semi-colon separated list of genes"></v-textarea>
                </div>
                <v-btn @click="processPatient" :disabled="!phenotypesText || !(phenotypesText.length > 0)">Compare Patient</v-btn>
            </div>
        </v-overlay>
    </div>
</template>

<script>
    import TargetPatient from '../models/TargetPatient.js'
    import Phenotype from '../models/Phenotype'
    import { getPhenotypeWithId, getPhenotypeWithName } from '../data/grabData.js'

    export default {
        name: 'NavBar',
        components: {

        },
        props: {
            udnPatientIdsList: Array,
            showPtSelectOverlay: Boolean,
            targetPatient: Object,
        },
        data: function() {
            return {
                showOverlay: this.showPtSelectOverlay,
                udnId: 'UDN287643',
                phenotypesText: 'HP:0001188; HP:0001252; HP:0001263; HP:0001276; HP:0001290; HP:0001324; HP:0001332; HP:0002015; HP:0002058; HP:0002072; HP:0002134; HP:0002355; HP:0002376; HP:0003701; HP:0004305; HP:0006789; HP:0007183; HP:0010862',
                genesText: 'FAM86B1; LRCH3; SHC1; ARMCX4; KCNV2; C1QTNF1-AS1; LINC01473; CTBP1; MED11; UBE3A; DLC1; TBC1D5; RPL12P21; KIF26A; RNF17; OLFM3; SNHG14; KCTD19; MCM10; C6orf52; FCHO1; GPR176; CNTD1; PUM3; TIAL1',
            }
        },
        mounted: function() {

        },
        methods: {
            async processPatient() {
                //create a new patient object
                let patient = new TargetPatient(this.udnId);

                //add phenotypes
                let phenotypes = this.phenotypesText.split(/[,;]+/).map((phenotype) => {
                    return phenotype.trim();
                });
                let phenotypeList = [];
                let phenotypeMap = {};
                for (let term of phenotypes) {
                    if (term.slice(0,3).toUpperCase() == 'HP:') {
                        //if the term is an hpo id then lookup the term by id
                        let res = await getPhenotypeWithId(term);
                        if (res) {
                            if (phenotypeMap[res.term_id] != null || phenotypeMap[res.name] != null) {
                                //dont add just continue because we already have this phenotype
                                continue;
                            }
                            phenotypeMap[res.term_id] = res.name;
                            let phenotype = new Phenotype(res.term_id, res.name, res.definition, res.comment, res.synonyms);
                            phenotypeList.push(phenotype);
                        }
                    } else {
                        //if the term is not an hpo id then lookup the term by name
                        let res = await getPhenotypeWithName(term);
                        if (res) {
                            if (phenotypeMap[res.term_id] != null || phenotypeMap[res.name] != null) {
                                //dont add just continue because we already have this phenotype
                                continue;
                            }
                            phenotypeMap[res.name] = res.term_id;
                            let phenotype = new Phenotype(res.term_id, res.name, res.definition, res.comment, res.synonyms);
                            phenotypeList.push(phenotype);
                        }
                    }
                }
                patient.setPhenotypeList(phenotypeList);

                //add genes
                let genes = this.genesText.split(/[,;]+/).map((variant) => {
                    return variant.trim();
                })

                //make them all caps
                genes = genes.map((variant) => {
                    return variant.toUpperCase();
                });
                //set the patient gene list
                patient.setGenesList(genes);

                //set the target patient
                this.$emit('set-target-patient', patient);

                //close the overlay
                this.showOverlay = false;
            },
        },
        watch: {
            showPtSelectOverlay: function(newVal, oldVal) {
                this.showOverlay = newVal;
            }
        }
    }
</script>

<style lang="sass">
    #nav-bar
        .v-toolbar__content
            .v-toolbar-title
                text-transform: uppercase
                text-align: end
                font-weight: bolder
                padding-right: 20px
    .v-overlay-container
        .v-overlay#add-select-patient
            width: 100%
            height: 100%
            display: flex
            flex-direction: column
            justify-content: center
            align-items: center
            #add-select-dialog
                padding: 20px
                background-color: white
                display: flex
                flex-direction: column
                justify-content: center
                align-items: start
                width: 50vw
                min-height: 50vh
                border-radius: 5px
                position: relative
                h3
                    width: 100%
                    text-align: center
                    margin-bottom: 20px
                .v-btn
                    background-color: #40673C
                    color: white
                    &.close-button
                        background-color: red
                        color: white
                        position: absolute
                        top: 10px
                        right: 10px
                .input-container
                    width: 100%
                    display: flex
                    flex-direction: row
                    justify-content: center   
                #udn-id-input.input-container
                    width: 50%     
</style>