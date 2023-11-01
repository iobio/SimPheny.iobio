<template>
    <div class="section-container left-bar">
        <div id="left-bar-container" :class="{ expanded: showLeftBar, collapsed: !showLeftBar}">
            <div class="tab-container left-bar" :class="{ expanded: !showHpoDrawer, shortened: showHpoDrawer}">
                <h1 class="section-head">Patient Information</h1>
                <v-tabs v-model="tab" fixed-tabs height="30px">
                    <v-tab value="phenotypes" variant="text">Phenotypes</v-tab>
                    <v-tab value="variants" variant="text">Variants</v-tab>
                </v-tabs>

                <div id="tab-content-container" class="left-bar">
                    <v-window v-model="tab">
                        <v-window-item value="phenotypes">
                            <div class="list-item left-bar" v-if="targetPatient" v-for="phenotype in targetPatient.getPhenotypeList()">
                                <input type="checkbox" v-model="phenotype.relevant">
                                <span 
                                    @click="getGenesForPhenotype(phenotype)" 
                                    :class="{ selected: selectedPhenotype && selectedPhenotype.hpoId == phenotype.hpoId }" 
                                    class="phenotype-span left-bar">
                                    {{ phenotype.hpoId + " - " + phenotype.term }}
                                </span>
                            </div>
                        </v-window-item>

                        <v-window-item value="variants">
                            <p v-if="!targetPatient || (targetPatient.getGenesList() == null || targetPatient.getGenesList().length == 0)">No variants to display for current patient.</p>
                            <div class="list-item left-bar" v-else="targetPatient && targetPatient.getGenesList()" v-for="gene in targetPatient.getGenesList()">
                                <input type="checkbox">
                                <span class="gene-span left-bar">{{ gene }}</span>
                            </div>
                        </v-window-item>
                    </v-window>
                </div>
            </div>

            <div id="hpo-drawer" :class="{ expanded: showHpoDrawer, collapsed: !showHpoDrawer}">
                <div class="button-container hpo-drawer">
                    <v-btn icon @click="showHpoDrawer = !showHpoDrawer" :class="{ expanded: showHpoDrawer, collapsed: !showHpoDrawer}" class="btn toggle hpo-drawer" height="35px" width="35px" color="#21351f">
                        <v-tooltip offset="3" location="right" activator="parent">
                            <span v-if="!showHpoDrawer">Expand HPO annotations</span>
                            <span v-if="showHpoDrawer">Collapse HPO annotations</span>
                        </v-tooltip>
                        <v-icon v-if="showHpoDrawer" color="white">mdi-arrow-down-circle-outline</v-icon>
                        <v-icon v-if="!showHpoDrawer" color="white">mdi-arrow-up-circle-outline</v-icon>
                    </v-btn>
                </div>
                <div id="hpo-content-container">
                    <h1 class="section-head">HPO Annotations</h1>
                    <h5 v-if="selectedPhenotype"> {{ selectedPhenotype.term }}</h5>

                    <h4><span>Gene Name</span><span>Frequency</span><span>Disease Id</span></h4>

                    <div id="annotations-list-container">
                            <div class="hpo-list-div" v-if="selectedPhenotypeGenes && targetPatient" v-for="gene in selectedPhenotypeGenes" :class="{ inTarget: checkGeneInPatient(gene) }">
                                <span>{{ gene.gene_symbol }}</span>
                                <span>{{ gene.frequency }}</span>
                                <span>{{ gene.disease_id }}</span>
                            </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="button-container left-bar" :class="{ expanded: showLeftBar, collapsed: !showLeftBar}">
            <v-btn icon @click="showLeftBar = !showLeftBar" class="btn toggle" height="35px" width="35px" color="#21351f">
                <v-tooltip offset="3" location="right" activator="parent">
                    <span v-if="!showLeftBar">Expand patient details</span>
                    <span v-if="showLeftBar">Collapse patient details</span>
                </v-tooltip>
                <v-icon v-if="showLeftBar" color="white">mdi-arrow-left-circle-outline</v-icon>
                <v-icon v-if="!showLeftBar" color="white">mdi-arrow-right-circle-outline</v-icon>
            </v-btn>
        </div>
    </div>
</template>

<script>
    import * as hpoDb from '../data/grabData.js'
    import * as d3 from 'd3';

    export default {
        name: 'LeftBar',
        props: {
            targetPatient: Object,
        },
        data: function() {
            return {
                showLeftBar: true,
                showHpoDrawer: false,
                panels: [1,1,0],
                tab: 'phenotypes',
                selectedPhenotype: null,
                selectedGene: null,
                selectedPhenotypeGenes: [],
            }
        },
        methods: {
            async getGenesForPhenotype(phenotype){
                if (this.selectedPhenotype == phenotype) {
                    this.selectedPhenotype = null;
                    this.selectedPhenotypeGenes = [];
                    this.showHpoDrawer = false;
                    return;
                }
                //otherwise, get genes for phenotype
                this.selectedPhenotype = phenotype;
                let res = await hpoDb.getGenesWithPhenotype(phenotype.hpoId);
                let geneList = res;
                this.selectedPhenotypeGenes = geneList;
                if (!this.showHpoDrawer) {
                    this.showHpoDrawer = true;
                }
            },
            checkGeneInPatient(gene) {
                if (this.targetPatient) {
                    return this.targetPatient.genesList.includes(gene.gene_symbol);
                }
                return false;
            }
        },
        watch: {
            selectedPhenotype: function(newVal, oldVal) {
                console.log(this.selectedPhenotypeGenes)
            }
        }
    }
</script>

<style>
    .list-item.left-bar {
        padding-left: 5px;
        padding-right: 5px;
        display: flex;
        flex-direction: row;
        border-bottom: 1px #f4f6f4 solid;
    }
    .list-item.left-bar:hover {
        background-color: #bfc8bf;
    }
    .list-item.left-bar input {
        margin-right: 10px; 
    }
    .phenotype-span.left-bar {
        width: 100%;
        padding: 2px 5px;
        cursor: pointer;
        border-radius: 3px;
    }
    .phenotype-span.left-bar.selected {
        background-color: #9bb39a;
    }
    .gene-span.left-bar {
        width: 100%;
        padding: 2px 5px;
        cursor: pointer;
        border-radius: 3px;
    }
    .gene-span.left-bar.selected {
        background-color: #9bb39a;
    }
    .section-container.left-bar {
        height: 100%;
        width: fit-content;
        background-color: transparent;
        display: flex;
        flex-direction: row;

        position: relative;
    }

    #left-bar-container {
        height: 100%;
        padding-top: 48px;
        display: flex;
        flex-direction: column;
        transition: all .45s ease-in-out;
    }

    #left-bar-container.collapsed {
        width: 0px;
        border-right: 0px solid transparent;
        margin: 0;
        padding: 0;
        overflow: hidden;
    }
    #left-bar-container.expanded {
        width: 30vw;
        border-right: 2px solid #21351f;
        box-shadow: 5px 0px 5px -2px rgba(0,0,0,0.2);
    }
    .button-container.left-bar {
        height: 100%;
        width: 35px;
        background-color: transparent;

        top: 0;
        right: -45px;
        position: absolute;
        overflow: visible;
        transition: all .45s ease-in-out;
    }
    .button-container.left-bar.expanded {
        right: 10px;
    }
    .btn.toggle {

        margin-top: 53px;
        height: 35px;
        width: 35px;
        position: absolute;
    }

    .tab-container.left-bar {
        height: 50%;
        transition: all .45s ease-in-out;
        display: flex;
        flex-direction: column;
    }

    .tab-container.left-bar.expanded {
        height: 100%;
    }
    .tab-container.left-bar.shortened {
        height: 50%;
    }

    .tab-container.left-bar .v-tab {
        text-transform: none;
        font-weight: bold;
        border-radius: 5px 5px 0px 0px;
        transition: all .15s ease-in-out;

        max-height: 100%;
    }

    .tab-container.left-bar .v-tab--selected {
        background-color: #e9ede9;
        color: #133910;
    }

    .tab-container.left-bar .v-tab--selected .v-tab__slider {
        visibility: hidden;
    }

    #tab-content-container.left-bar {
        flex-grow: 1;
        padding: 10px;
        padding-right: 0px;
        background-color: #e9ede9;
        height: 100%;
        overflow-y: hidden;
    }

    #tab-content-container.left-bar .v-window {
        height: 100%;
    }

    #tab-content-container.left-bar .v-window .v-window-item {
        padding: 10px;
        overflow: auto;
    }

    #hpo-drawer {
        width: 100%;
        justify-self: flex-end;
        border-top: 2px solid #21351f;
        transition: all .45s ease-in-out;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
    }
    #hpo-drawer h5 {
        width: 100%;
        text-align: center;
        padding-left: 40px;
        padding-right: 40px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #0a5603;
    }
    #hpo-drawer.expanded {
        height: 50%;
        box-shadow: 0px -5px 5px -2px rgba(0,0,0,0.2);
    }
    #hpo-drawer.collapsed {
        height: 0%;
        border-top: 0px solid transparent;
    }
    #hpo-drawer #hpo-content-container {
        height: 100%;
        widows: 100%;
        overflow: hidden;
    }
    #hpo-drawer h4 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        padding-top: 10px;
        padding-bottom: 2px;
        padding-left: 20px;
        padding-right: 10px;
        align-self: center;
        width: 100%;
        border-bottom: #dde0dd 1px solid;
    }
    #hpo-drawer h4 span {
        text-align: start;
    }
    #hpo-drawer #annotations-list-container {
        height: 80%;
        overflow-y: auto;
        padding: 5px 10px;
        padding-left: 20px;
    }
    #hpo-drawer #annotations-list-container .hpo-list-div {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
    }
    #hpo-drawer #annotations-list-container .hpo-list-div.inTarget {
        color: red;
    }
    
    #hpo-drawer #annotations-list-container .hpo-list-div span {
        text-align: start;
    }
    .button-container.hpo-drawer {
        width: 100%;
        height: 35px;
        background-color: transparent;

        top: -45px;
        left: 0;
        position: absolute;
        overflow: visible;
    }
    .btn.toggle.hpo-drawer {
        top: -58px;
        left: 10px;

        height: 35px;
        width: 35px;
        position: absolute;
        transition: all .45s ease-in-out;
    }

    .btn.toggle.hpo-drawer.expanded {
        top: 0px;
        left: 10px;
    }

    .btn.toggle.hpo-drawer.collapsed {
        top: -52px;
        left: 10px;
    }
</style>