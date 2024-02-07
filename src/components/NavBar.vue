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
                    density="compact"
                    clearable
                    @update:modelValue="checkInputPatient"
                    clear-on-select></v-autocomplete>
                    <div id="custom-pt-container">
                        <label for="custom-patient">Custom Patient</label>
                        <input type="checkbox" name="custom" id="custom-patient" v-model="customPatient">
                    </div>
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
                        label="Genes (optional)" 
                        density="compact"
                        no-resize 
                        hint="insert comma or semi-colon separated list of genes"></v-textarea>
                </div>
                <v-btn @click="processPatient" :disabled="phenotypesPresent">Compare Patient</v-btn>
            </div>
        </v-overlay>
    </div>
</template>

<script>
    export default {
        name: 'NavBar',
        components: {

        },
        props: {
            udnPatientIdsList: Array,
            patientMap: Object,
            showPtSelectOverlay: Boolean,
            targetPatient: Object,
        },
        data: function() {
            return {
                internalUdnPtIdsList: this.udnPatientIdsList,
                internalPatientMap: {},
                showOverlay: this.showPtSelectOverlay,
                udnId: '',
                phenotypesText: '',
                genesText: '',
                customPatient: false,
                firstLoading: true
            }
        },
        mounted: function() {
            this.udnId = this.internalUdnPtIdsList[0];
        },
        methods: {
            patientChanged() {
                if (!this.internalPatientMap[String(this.udnId)]) {
                        this.phenotypesText = '';
                        this.genesText = '';
                        return;
                }
                if (this.internalPatientMap[this.udnId].Terms && typeof this.internalPatientMap[this.udnId].Terms === 'string') { //When loading for the first time we have a different object
                    //if this happens they come in as a string we need just to replace any commas with semicolons
                    this.phenotypesText = this.internalPatientMap[String(this.udnId)].Terms.replace(/\[|\]|\'|\"/g, '').replace(/\s+/g, ' ').replace(/\s+,/g, '').replace(/,/g, ';');
                    //also remove any spaces
                    this.genesText = this.internalPatientMap[String(this.udnId)].Genes.replace(/\[|\]|\'|\"/g, '').replace(/\s+/g, ' ').replace(/\s,/g, '').replace(/,/g, ';'); 
                } else {
                    this.phenotypesText = this.internalPatientMap[String(this.udnId)].phenotypeList.map((phenotype) => {return phenotype.hpoId; }).join('; ');
                    this.genesText = this.internalPatientMap[String(this.udnId)].genesList.map((gene) => { return gene.gene_symbol; }).join('; ');
                }
            },
            async processPatient() {
                //Set the target id
                let targetId = this.udnId;

                //Make the targetPhenotypes list
                //take off any trailing or leading spaces or ; or , and split on the remaining either , or ;

                let phenotypes = this.phenotypesText.split(/[,;]+/).map((phenotype) => {
                    return phenotype.trim().toUpperCase();
                })

                if (phenotypes[phenotypes.length - 1] === '') {
                    phenotypes.pop();
                }

                //Make the targetGenes list
                let genes = this.genesText.split(/[,;]+/).map((gene) => {
                    return gene.trim().toUpperCase();
                })

                if (genes[genes.length - 1] === '') {
                    genes.pop();
                }

                //set the target patient
                this.$emit('set-target-patient', targetId, phenotypes, genes);

                //close the overlay
                this.showOverlay = false;
            },
            checkInputPatient() {
                if (this.udnId == null || this.udnId == '' || this.udnId == undefined) {
                    this.customPatient = true;
                    this.udnId = 'custom';
                } else {
                    this.customPatient = false;
                }
            },
        },
        computed: {
            phenotypesPresent() {
                if (this.phenotypesText == null || this.phenotypesText == '' || this.phenotypesText == undefined) {
                    return true;
                } else {
                    return false;
                }
            }
        },
        watch: {
            udnId: function(newVal, oldVal) {
                this.patientChanged();
            },
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
            },
            udnPatientIdsList(newVal, oldVal) {
                this.internalUdnPtIdsList = newVal;
                this.internalUdnPtIdsList.push('custom');

                this.udnId = this.internalUdnPtIdsList[0];
            },
            customPatient(newVal, oldVal) {
                if (newVal == true) {
                    this.udnId = 'custom';
                } else {
                    this.udnId = this.internalUdnPtIdsList[0];
                }
            },
            patientMap(newVal, oldVal) {
                if (this.firstLoading) {
                    this.internalPatientMap = newVal;
                    this.firstLoading = false;
                }
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
                    width: 70%     
                    #custom-pt-container
                        display: flex
                        flex-direction: column
                        justify-content: flex-start
                        align-items: center
                        margin-left: 20px
                        background-color: #f6f6f6
                        padding: 5px
                        border-radius: 5px
                        margin-bottom: 22px
                        box-shadow: 0px 2px 2px 0px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.12)
                        label
                            font-size: 12px
                            color: gray
                        input
                            border: 1px solid black
                            border-radius: 5px
                            padding: 5px
                            cursor: pointer
                            &:checked
                                background-color: #40673C
                                color: white
                                border: 1px solid #40673C
                                &:after
                                    content: '✓'
                                    font-size: 20px
                                    position: absolute
                                    top: -5px
                                    left: 0
                                    color: white
</style>