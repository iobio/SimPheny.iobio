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
                    @update:modelValue="patientChanged"
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
                <v-btn @click="processPatient">Compare Patient</v-btn>
            </div>
        </v-overlay>
    </div>
</template>

<script>
    import TargetPatient from '../models/TargetPatient.js'
    import Phenotype from '../models/Phenotype'

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
            patientChanged() {
                this.phenotypesText = '';
                this.genesText = '';
            },
            async processPatient() {
                //Set the target id
                let targetId = this.udnId;

                //Make the targetPhenotypes list
                let phenotypes = this.phenotypesText.split(/[,;]+/).map((phenotype) => {
                    return phenotype.trim();
                });

                //Make the targetGenes list
                let genes = this.genesText.split(/[,;]+/).map((gene) => {
                    return gene.trim().toUpperCase();
                })

                //set the target patient
                this.$emit('set-target-patient', targetId, phenotypes, genes);

                //close the overlay
                this.showOverlay = false;
            },
        },
        watch: {
            showPtSelectOverlay: function(newVal, oldVal) {
                this.showOverlay = newVal;
            },
            targetPatient: {
                handler: function(newVal, oldVal) {
                    if (newVal) {
                        this.udnId = newVal.id;
                        this.phenotypesText = newVal.phenotypeList.map((phenotype) => {return phenotype.hpoId; }).join('; ');
                        this.genesText = newVal.genesList.map((gene) => { return gene.gene_symbol; }).join('; ');
                    }
                }, deep: true
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