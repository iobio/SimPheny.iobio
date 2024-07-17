<template>
    <div id="nav-bar">
        <v-app-bar density="compact" color="#19354D">
            <v-btn @click="showOverlay=true" v-if="!targetPatient" variant="outlined">Add/Select Patient</v-btn>
            <v-btn @click="showOverlay=true" v-if="targetPatient" variant="outlined">Edit Patient</v-btn>
            <!-- add a triplet of radio buttons one for udn, one for orphanet, one for both -->
            <v-radio-group v-model="whichPopulationChoice" inline hide-details="true">
                <v-radio label="UDN" value="udn"></v-radio>
                <v-radio label="Orphanet" value="orpha"></v-radio>
                <v-radio label="Decipher" value="decipher"></v-radio>
                <v-radio label="UDN & Orphanet" value="both"></v-radio>
                <v-radio label="All" value="all"></v-radio>
            </v-radio-group>
            <v-toolbar-title>SimPheny.iobio</v-toolbar-title>
            <v-btn density="compact" icon="mdi-dots-vertical" @click="toggleShowDisclaimer"></v-btn>
        </v-app-bar>

        <v-overlay id="add-select-patient" v-model="showOverlay" persistent>
            <div id="add-select-dialog">
                <v-btn class="close-button" @click="showOverlay = false" icon="mdi-close-circle-outline" height="35px" width="35px"></v-btn>
                <h3>Input Target Patient Details</h3>
                <p>Showing: {{ populationLabel }}</p>
                <div v-if="udnPatientIdsList" id="udn-id-input" class="input-container">
                    <v-autocomplete
                    v-model="udnId"
                    :items="udnPatientIdsList"
                    variant="solo-filled"
                    label="Patient/Match Code" 
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
        <v-overlay id="disclaimer-overlay" v-model="showDisclaimer">
            <div id="disclaimer-popup">
                <h3>Disclaimer</h3>
                <p>The University of Utah makes no claims that iobio applications, including simpheny.iobio 
                    are approved for clinical use. All users of iobio applications including simpheny.iobio understand 
                    and accept that any information gained by using these applications, whether the information 
                    comes from visualization, processing, internal or external databases, or analysis, may not in 
                    any way be used for clinical purposes. The University of Utah makes no representation that 
                    iobio or simpheny.iobio is either safe or effective for any intended use for which research may currently 
                    be performed.
                    <br>
                    <br>
                    Iobio, or any iobio applications ARE TO BE USED FOR RESEARCH PURPOSES ONLY. USE FOR CLINICAL PURPOSES 
                    IS EXPRESSLY FORBIDDEN. Approval of iobio applications for clinical use has neither been applied for, nor 
                    received, in any country, including the United States of America.
                </p>
                <v-btn @click="toggleShowDisclaimer">Close</v-btn>
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
            whichPopulation: String
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
                firstLoading: true,
                whichPopulationChoice: this.whichPopulation,
                showDisclaimer: false
            }
        },
        mounted: function() {
            if (!this.targetPatient){
                this.udnId = this.internalUdnPtIdsList[0];
            }
        },
        methods: {
            toggleShowDisclaimer() {
                this.showDisclaimer = !this.showDisclaimer;
            },
            patientChanged() {
                //if the patient id just isn't in there, change to empty strings
                if (!this.internalPatientMap[String(this.udnId)] && this.udnId !== 'custom') {
                        this.phenotypesText = '';
                        this.genesText = '';
                        return;
                }
                
                //if it is custom but the target patient is custom, just set the text to the target patient's phenotypes and genes
                if (this.udnId === 'custom' && this.targetPatient.id === 'custom') {
                    this.phenotypesText = this.targetPatient.phenotypeList.map((phenotype) => {return phenotype.hpoId; }).join('; ');
                    this.genesText = this.targetPatient.genesList.map((gene) => { return gene.gene_symbol; }).join('; ');
                    return;
                }

                //if it is custom but the target patient is not custom, set the text to empty strings
                if (this.udnId === 'custom' && this.targetPatient.id !== 'custom') {
                    this.phenotypesText = '';
                    this.genesText = '';
                    return;
                }

                //if it is not custom, set the text to the patient's phenotypes and genes (first iteration data structure is odd)
                if (this.internalPatientMap[this.udnId].Terms && typeof this.internalPatientMap[this.udnId].Terms === 'string') {
                    //if this happens they come in as a string we need just to replace any commas with semicolons
                    this.phenotypesText = this.internalPatientMap[String(this.udnId)].Terms.replace(/\[|\]|\'|\"/g, '').replace(/\s+/g, ' ').replace(/\s+,/g, '').replace(/,/g, ';');
                    this.genesText = this.internalPatientMap[String(this.udnId)].Genes.replace(/\[|\]|\'|\"/g, '').replace(/\s+/g, ' ').replace(/\s,/g, '').replace(/,/g, ';'); 

                } else { //Typical case
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
                this.$emit('set-mosaic-false');

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
            },
            populationLabel() {
                if (this.whichPopulationChoice === 'udn') {
                    return 'UDN';
                } else if (this.whichPopulationChoice === 'orpha') {
                    return 'Orphanet';
                } else if (this.whichPopulationChoice === 'decipher') {
                    return 'Decipher';
                } else if (this.whichPopulationChoice === 'all') {
                    return 'All';
                } else {
                    return 'UDN & Orphanet';
                }
            }
        },
        watch: {
            udnId: function(newVal, oldVal) {
                if (newVal === 'custom' && this.customPatient === true) {
                    return;
                }
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
            patientMap(newVal, oldVal) {
                if (this.firstLoading) {
                    this.internalPatientMap = newVal;
                    this.firstLoading = false;
                }
            },
            customPatient(newVal) {
                if (newVal == true) {
                    this.udnId = 'custom';
                    this.phenotypesText = '';
                    this.genesText = '';
                } else {
                    this.udnId = this.internalUdnPtIdsList[0];
                    this.patientChanged();
                }
            },
            whichPopulationChoice(newVal, oldVal) {
                this.$emit('updatePopulationChoice', newVal);
            }
        }
    }
</script>

<style lang="sass">
    #nav-bar
        .v-toolbar__content
            .v-toolbar-title
                text-align: end
                font-weight: bolder
                padding-right: 20px
    .v-overlay-container
        .v-overlay#disclaimer-overlay
            width: 100%
            height: 100%
            display: flex
            flex-direction: column
            justify-content: center
            align-items: center
            #disclaimer-popup
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
                    background-color: #2E5F8A
                    color: white
                    &.close-button
                        background-color: red
                        color: white
                        position: absolute
                        top: 10px
                        right: 10px
                p
                    width: 100%
                    text-align: justify
                    margin-bottom: 20px
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
                    background-color: #2E5F8A
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
                        background-color: #f6f6f6 //this is the approximate color of the other vuetify inputs
                        padding: 5px
                        border-radius: 5px
                        margin-bottom: 22px
                        box-shadow: 0px 2px 2px 0px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.12)
                        label
                            font-size: 12px
                            color: gray
</style>