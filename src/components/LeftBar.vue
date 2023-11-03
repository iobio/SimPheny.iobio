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
                                <span 
                                    class="num-in-target" 
                                        v-if="phenotypeAssociationsMap && phenotypeAssociationsMap[phenotype.hpoId].numInTarget > 0">
                                        {{ phenotypeAssociationsMap[phenotype.hpoId].numInTarget }}
                                </span>
                            </div>
                        </v-window-item>

                        <v-window-item value="variants">
                            <p v-if="!targetPatient || (targetPatient.getGenesList() == null || targetPatient.getGenesList().length == 0)">No variants to display for current patient.</p>
                            <div class="list-item left-bar" v-else="targetPatient && targetPatient.getGenesList()" v-for="gene in targetPatient.getGenesList()">
                                <input type="checkbox" v-model="gene.relevant">
                                <span 
                                    @click="getPhenotypesForGene(gene)"
                                    :class="{ selected: selectedGene && selectedGene.gene_id == gene.gene_id }"  
                                    class="gene-span left-bar">
                                    {{ gene.gene_symbol }}
                                </span>
                                <span 
                                    class="num-in-target" 
                                    v-if="geneAssociationsMap && geneAssociationsMap[gene.gene_symbol].numInTarget > 0">
                                    {{ geneAssociationsMap[gene.gene_symbol].numInTarget }}
                                </span>
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
                <div id="hpo-content-container" class="tab-container left-bar">
                    <h3>HPO Associations</h3>
                    <v-tabs v-model="hpoTab" fixed-tabs height="30px">
                        <v-tab value="phenToGene" variant="text">Genes</v-tab>
                        <v-tab value="geneToPhen" variant="text">Phenotypes</v-tab>
                    </v-tabs>

                    <div id="annotations-list-container">
                        <div v-if="hpoTab == 'phenToGene'" class="hpo-anno-header">
                                    <h3 v-if="selectedPhenotype"> Genes for {{ selectedPhenotype.term }}</h3>
                                    <h4><span>Gene Name</span><span>Frequency</span><span>Disease Id</span></h4>
                        </div>
                        <div v-if="hpoTab == 'geneToPhen'" class="hpo-anno-header">
                                    <h3 v-if="selectedGene"> Phenotypes for {{ selectedGene.gene_symbol }}</h3>
                                    <h4><span>HPO Id</span><span>Term</span><span>Disease Id</span></h4>
                        </div>
                        <v-window v-model="hpoTab">
                            <v-window-item value="phenToGene">
                                <div class="hpo-list-div" v-if="selectedPhenotypeGenes && targetPatient" v-for="gene in selectedPhenotypeGenes" :class="{ inTarget: checkGeneInPatient(gene) }">
                                    <span>{{ gene.gene_symbol }}</span>
                                    <span>{{ gene.frequency }}</span>
                                    <span>{{ gene.disease_id }}</span>
                                </div>
                            </v-window-item>
                            <v-window-item value="geneToPhen">
                                <div class="hpo-list-div" v-if="selectedGenePhenotypes && targetPatient" v-for="phenotype in selectedGenePhenotypes" :class="{ inTarget: checkPhenotypeInPatient(phenotype) }">
                                    <span>{{ phenotype.term_id }}</span>
                                    <span>{{ phenotype.name }}</span>
                                    <span>{{ phenotype.disease_id }}</span>
                                </div>
                            </v-window-item>
                        </v-window>
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
                hpoTab: 'phenToGene',
                selectedPhenotype: null,
                selectedGene: null,
                selectedPhenotypeGenes: [],
                selectedGenePhenotypes: [],
                phenotypeAssociationsMap: null,
                geneAssociationsMap: null,
            }
        },
        mounted: function(){
            if (this.targetPatient && this.targetPatient.genesList.length > 0 && this.targetPatient.phenotypeList.length > 0) {
                this.createAssociationsMaps(this.targetPatient).then(res => {
                    this.phenotypeAssociationsMap = res[0];
                    this.geneAssociationsMap = res[1];
                });
            }
        },
        updated: function() {
            if (this.targetPatient && this.targetPatient.genesList.length > 0 && this.targetPatient.phenotypeList.length > 0) {
                this.createAssociationsMaps(this.targetPatient).then(res => {
                    this.phenotypeAssociationsMap = res[0];
                    this.geneAssociationsMap = res[1];
                });
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
                if (this.hpoTab != 'phenToGene') {
                    this.hpoTab = 'phenToGene';
                }
            },
            async getPhenotypesForGene(gene) {
                if (this.selectedGene == gene) {
                    this.selectedGene = null;
                    this.selectedGenePhenotypes = [];
                    this.showHpoDrawer = false;
                    return
                }
                //otherwise, get phenotypes for the gene
                this.selectedGene = gene;
                let res = await hpoDb.getPhenotypesWithGene(gene.gene_id)
                let phenotypeList = res;
                this.selectedGenePhenotypes = phenotypeList;
                if (!this.showHpoDrawer) {
                    this.showHpoDrawer = true;
                }
                if (this.hpoTab != 'geneToPhen') {
                    this.hpoTab = 'geneToPhen';
                }

            },
            checkGeneInPatient(gene) {
                if (this.targetPatient) {
                    let patientGeneSymbols = this.targetPatient.genesList.map(gene => gene.gene_symbol);
                    return patientGeneSymbols.includes(gene.gene_symbol);
                }
                return false;
            },
            checkPhenotypeInPatient(phenotype) {
                if (this.targetPatient) {
                    let phenIdsList = this.targetPatient.phenotypeList.map((phen) => phen.hpoId);
                    return phenIdsList.includes(phenotype.term_id);
                }
                return false;
            },
            async createAssociationsMaps(targetPatient) {
                let phenotypeAssociations = {};
                let geneAssociations = {};

                let geneSymbolList = targetPatient.genesList.map(gene => gene.gene_symbol);
                let phenotypeIdList = targetPatient.phenotypeList.map(phenotype => phenotype.hpoId);

                let phenotypePromises = targetPatient.phenotypeList.map(phenotype => 
                    hpoDb.getGenesWithPhenotype(phenotype.hpoId).then(res => {
                        phenotypeAssociations[phenotype.hpoId] = { genes: res };
                        phenotypeAssociations[phenotype.hpoId]['numInTarget'] = res.filter(gene => 
                            geneSymbolList.includes(gene.gene_symbol)
                        ).length;
                    })
                    .catch(err => {
                        console.log("getGenesWithPhen Error", err);
                    })
                );
                
                let genePromises = targetPatient.genesList.map(gene =>
                    hpoDb.getPhenotypesWithGene(gene.gene_id).then(res => {
                        geneAssociations[gene.gene_symbol] = { phenotypes: res };
                        geneAssociations[gene.gene_symbol]['numInTarget'] = res.filter(phenotype =>     
                        phenotypeIdList.includes(phenotype.term_id)
                        ).length;
                    })
                    .catch(err => {
                        console.log("getPhenotypesWithGene Error", err);
                    })
                );

                // Wait for all promises to resolve before returning
                await Promise.all(phenotypePromises.concat(genePromises));

                return [phenotypeAssociations, geneAssociations];
            }
        },
        watch: {
            selectedPhenotype: function(newVal, oldVal) {

            },
            targetPatient: {
                handler(newVal, oldVal) {
                if (newVal && newVal.genesList.length > 0 && newVal.phenotypeList.length > 0) {
                    this.createAssociationsMaps(newVal).then(res => {
                        this.phenotypeAssociationsMap = res[0];
                        this.geneAssociationsMap = res[1];
                    });
                }
            }, deep: true
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
    .list-item.left-bar .num-in-target {
        width: 1.55em;
        height: 1.55em;
        font-size: 10pt;
        padding: 0%;
        margin: 0%;
        border-radius: 50%;
        background-color: #4d5a4f;
        border: 1px solid #c2cfc4;
        color: white;
        text-align: center;
        line-height: 1.4em;
        align-self: center;
        z-index: 2;
        transition: all .1s ease-in-out;
        cursor: pointer;
    }
    .list-item.left-bar .num-in-target:hover {
        background-color: #81977f;
        width: 1.8em;
        height: 1.8em;
        line-height: 1.6em;
    }
    .phenotype-span.left-bar {
        width: 100%;
        padding: 2px 5px;
        margin-right: 5px;
        cursor: pointer;
        border-radius: 3px;
    }
    .phenotype-span.left-bar.selected {
        background-color: #9bb39a;
    }
    .gene-span.left-bar {
        width: 100%;
        padding: 2px 5px;
        margin-right: 5px;
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
    #hpo-drawer h3 {
        width: 100%;
        text-align: center;
        padding-left: 40px;
        padding-right: 40px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #042c09;
    }
    #hpo-drawer #annotations-list-container h3 {
        color: #0d6b04;
        font-style: italic;
        font-size: 1em;
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
        padding-top: 5px;
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
        height: 85%;
        overflow-y: auto;
        padding: 0px 0px 0px 0px;
    }
    #hpo-drawer #annotations-list-container .hpo-anno-header {
        position: sticky;
        top: 0px;
        background-color: #e9ede9;
        width: 100%;
        z-index: 1;
    }
    #hpo-drawer #annotations-list-container .hpo-list-div {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        padding-left: 20px;
    }
    #hpo-drawer #annotations-list-container .hpo-list-div.inTarget {
        color: red;
        background-color: rgb(253, 190, 190);
        border-radius: 3px;
        border: 1px solid rgb(245, 215, 215);
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
        z-index: 2;
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