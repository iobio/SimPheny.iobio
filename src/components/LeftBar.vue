<template>
    <div class="section-container left-bar">
        <div v-if="this.targetPtProp" id="left-bar-container" :class="{ expanded: showLeftBar, collapsed: !showLeftBar}">
            <div class="tab-container left-bar" :class="{ expanded: !showHpoDrawer, shortened: showHpoDrawer}">
                <h1 class="section-head">Patient Information</h1>
                <p v-if="this.targetPtProp && this.targetPtProp.dx.toLowerCase() == 'diagnosed'">DX: {{ this.targetPtProp.clinicalDiagnosis }}</p>
                <v-tabs v-model="tab" fixed-tabs height="30px">
                    <v-tab value="phenotypes" variant="text">Phenotypes</v-tab>
                    <v-tab value="genes" variant="text">Genes</v-tab>
                </v-tabs>

                <div id="tab-content-container" class="left-bar">
                    <v-window v-model="tab">
                        <v-window-item value="phenotypes">
                            <div class="list-item left-bar" v-if="targetPatient" v-for="phenotype in targetPatient.phenotypeList" :key="phenotype.hpoId">
                                <input v-if="targetPhenotypes" @change="patientInfoChanged()" type="checkbox" v-model="targetPhenotypes[phenotype.hpoId].relevant"> 
                                <span 
                                    @click="getGenesForPhenotype(phenotype)" 
                                    :class="{ selected: selectedPhenotype && selectedPhenotype.hpoId == phenotype.hpoId, dontUse: targetPhenotypes[phenotype.hpoId].relevant == false}" 
                                    class="phenotype-span left-bar">
                                    {{ phenotype.hpoId + " - " + phenotype.term }}
                                </span>
                                <span 
                                    class="num-in-target"
                                    @mouseenter="showAssociationsPeek($event, phenotypeAssociationsMap[phenotype.hpoId].uniqueGenes, 'genes')"
                                    @mouseleave="showAssociationsPeek($event, [], 'none')" 
                                    v-if="phenotypeAssociationsMap && phenotypeAssociationsMap[phenotype.hpoId] && phenotypeAssociationsMap[phenotype.hpoId].numInTarget > 0">
                                        {{ phenotypeAssociationsMap[phenotype.hpoId].numInTarget }}
                                </span>
                            </div>
                        </v-window-item>

                        <v-window-item value="genes">
                            <p v-if="!targetPatient || (targetPatient.getGenesList() == null || targetPatient.getGenesList().length == 0)">No genes to display for current patient.</p>
                            <div class="list-item left-bar" v-else="targetPatient && targetPatient.getGenesList()" v-for="gene in targetPatient.genesList">
                                <input v-if="targetGenes" @change="patientInfoChanged()" type="checkbox" v-model="targetGenes[gene.gene_symbol].relevant">
                                <span 
                                    @click="getPhenotypesForGene(gene)"
                                    :class="{ selected: selectedGene && selectedGene.gene_symbol == gene.gene_symbol, dontUse: targetGenes[gene.gene_symbol].relevant == false}"  
                                    class="gene-span left-bar">
                                    {{ gene.gene_symbol }}
                                </span>
                                <span 
                                    class="num-in-target"
                                    @mouseenter="showAssociationsPeek($event, geneAssociationsMap[gene.gene_symbol].uniquePhenotypes, 'phenotypes')"
                                    @mouseleave="showAssociationsPeek($event, [], 'none')" 
                                    v-if="geneAssociationsMap && geneAssociationsMap[gene.gene_symbol] && geneAssociationsMap[gene.gene_symbol].numInTarget > 0">
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
                                    <h4 class="genes-h4"><span>Gene Name</span><span>#Diseases</span></h4>
                        </div>
                        <div v-if="hpoTab == 'geneToPhen'" class="hpo-anno-header">
                                    <h3 v-if="selectedGene"> Phenotypes for {{ selectedGene.gene_symbol }}</h3>
                                    <h4 class="phenotypes-h4"><span>HPO Id</span><span>Term</span><span>#Diseases</span></h4>
                        </div>
                        <v-window v-model="hpoTab">
                            <v-window-item value="phenToGene">
                                <span v-if="selectedPhenotypeGenes.length == 0">No genes for the selected phenotype found.</span>
                                <div class="hpo-list-div genes" v-if="selectedPhenotypeGenes && targetPatient" v-for="gene in selectedPhenotypeGenes" :class="{ inTarget: checkGeneInPatient(gene) }">
                                    <span>{{ gene.gene.gene_symbol }}</span>
                                    <span class="clickable" @click="toggleDiseaseDetails(gene.gene.gene_symbol)">{{ gene.numDiseases }}</span>
                                    <div v-if="inspectedDiseases && inspectedDiseases == gene.gene.gene_symbol">
                                        <span v-for="disease in gene.diseases">{{ disease }}</span>
                                    </div>
                                </div>
                            </v-window-item>
                            <v-window-item value="geneToPhen">
                                <span v-if="selectedGenePhenotypes.length == 0">No phenotypes for the selected gene found.</span>
                                <div class="hpo-list-div phenotypes" v-if="selectedGenePhenotypes && targetPatient" v-for="phenotype in selectedGenePhenotypes" :class="{ inTarget: checkPhenotypeInPatient(phenotype) }">
                                    <span>{{ phenotype.phenotype.term_id }}</span>
                                    <span>{{ phenotype.phenotype.name }}</span>
                                    <span class="clickable" @click="toggleDiseaseDetails(phenotype.phenotype.term_id)">{{ phenotype.numDiseases }}</span>
                                    <div v-if="inspectedDiseases && inspectedDiseases == phenotype.phenotype.term_id ">
                                        <span v-for="disease in phenotype.diseases">{{ disease }}</span>
                                    </div>
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

        <div id="associations-peek"></div>

        <div id="reload-revert-container" :class="{ hidden: !showReloadRevert}">
            <p>Reload with new criteria?</p>
            <div class="buttons">
                <button @click="submitInfoChanged('reload')">Reload <v-icon>mdi-reload-alert</v-icon></button>
                <button @click="submitInfoChanged('revert')">Revert <v-icon>mdi-arrow-u-left-top</v-icon></button>
            </div>
        </div>
    </div>
</template>

<script>
    import * as d3 from 'd3';
    import * as Be from '../data/fetchFromBackend.js';

    export default {
        name: 'LeftBar',
        props: {
            targetPtProp: Object,
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
                targetPatient: this.targetPtProp,
                showReloadRevert: false,
                targetPhenotypes: {},
                targetGenes: {},
                inspectedDiseases: null
            }
        },
        methods: {
            setTargetPhenotypes(phenList){
                let copyPhenotypes = {};
                for (let phen of phenList){
                    copyPhenotypes[phen.hpoId] = { relevant: phen.relevant };
                }
                this.targetPhenotypes = copyPhenotypes;
            },
            setTargetGenes(geneList){
                let copyGenes = {};
                for (let gene of geneList){
                    copyGenes[gene.gene_symbol] = { relevant: gene.relevant };
                }
                this.targetGenes = copyGenes;
            },
            toggleDiseaseDetails(phenGeneId) {
                if (this.inspectedDiseases == phenGeneId) {
                    this.inspectedDiseases = null;
                } else {
                    this.inspectedDiseases = phenGeneId;
                }
            },
            patientInfoChanged() {
                if (!this.showReloadRevert) {
                    this.showReloadRevert = true;
                }
            },
            submitInfoChanged(action) {
                if (action == 'revert') {
                    this.showReloadRevert = false;
                    this.targetPatient = this.targetPtProp;
                    this.setTargetPhenotypes(this.targetPatient.phenotypeList);
                    this.setTargetGenes(this.targetPatient.genesList);
                } else {
                    let newGenesList = [];
                    for (let gene of this.targetPatient.genesList) {
                        if (this.targetGenes[gene.gene_symbol].relevant) {
                            gene.relevant = true;
                            newGenesList.push(gene);
                        } else {
                            gene.relevant = false;
                            newGenesList.push(gene);
                        }
                        this.targetPatient.genesList = newGenesList;
                    }
                    let newPhenList = [];
                    for (let phen of this.targetPatient.phenotypeList) {
                        if (this.targetPhenotypes[phen.hpoId].relevant) {
                            phen.relevant = true;
                            newPhenList.push(phen);
                        } else {
                            phen.relevant = false;
                            newPhenList.push(phen);
                        }
                        this.targetPatient.phenotypeList = newPhenList;
                    }

                    // this.setTargetPhenotypes(this.targetPatient.phenotypeList);
                    // this.setTargetGenes(this.targetPatient.genesList)
                    this.showReloadRevert = false;
                    this.$emit('patientInfoChanged', this.targetPatient);
                }
            },
            async getGenesForPhenotype(phenotype){
                if (this.selectedPhenotype == phenotype) {
                    this.selectedPhenotype = null;
                    this.selectedPhenotypeGenes = [];
                    this.showHpoDrawer = false;
                    return;
                }
                //otherwise, get genes for phenotype
                this.selectedPhenotype = phenotype;

                //Creates a list of the objects which contain the gene name as the keys and then the object containing the information as the value of each object
                //Because genes in target are first they should also be the first part of the list which should solve the order issue
                let genesInTarget = Object.values(this.phenotypeAssociationsMap[phenotype.hpoId].uniqueGenes);
                let genesNotInTarget = Object.values(this.phenotypeAssociationsMap[phenotype.hpoId].uniqueGenesNotInTarget);

                this.selectedPhenotypeGenes = [...genesInTarget, ...genesNotInTarget];
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
                let phensInTarget = Object.values(this.geneAssociationsMap[gene.gene_symbol].uniquePhenotypes);
                let phensNotInTarget = Object.values(this.geneAssociationsMap[gene.gene_symbol].uniquePhenotypesNotInTarget);
                this.selectedGenePhenotypes = [...phensInTarget, ...phensNotInTarget]
                if (!this.showHpoDrawer) {
                    this.showHpoDrawer = true;
                }
                if (this.hpoTab != 'geneToPhen') {
                    this.hpoTab = 'geneToPhen';
                }

            },
            checkGeneInPatient(geneInfoObj) {
                if (this.targetPatient) {
                    let patientGeneSymbols = this.targetPatient.genesList.map(gene => gene.gene_symbol);
                    return patientGeneSymbols.includes(geneInfoObj.gene.gene_symbol);
                }
                return false;
            },
            checkPhenotypeInPatient(phenotypeInfoObj) {
                if (this.targetPatient) {
                    let phenIdsList = this.targetPatient.phenotypeList.map((phen) => phen.hpoId);
                    return phenIdsList.includes(phenotypeInfoObj.phenotype.term_id);
                }
                return false;
            },
            showAssociationsPeek(event, uniqueObj, type) {
                let peek = d3.select("#associations-peek");
                //clear out peek
                peek.selectAll("p").remove();
                if (type == 'genes') {
                    for (let key in uniqueObj) {
                        let gene = uniqueObj[key]['gene'];
                        let p = peek.append("p");
                        p.html(gene.gene_symbol);
                    }
                    peek.style("top", event.target.offsetTop + 120 + "px");
                    peek.style("left", event.target.offsetLeft + 35 + "px");
                    peek.style("display", "block");
                    peek.style("min-width", "100px");
                } else if (type == 'phenotypes') {
                    
                    for (let key in uniqueObj) {
                        let phenotype = uniqueObj[key]['phenotype'];
                        let p = peek.append("p");
                        p.html(phenotype.name);
                    }
                    peek.style("top", event.target.offsetTop + 120 + "px");
                    peek.style("left", event.target.offsetLeft + 35 + "px");
                    peek.style("display", "block");
                    peek.style("min-width", "200px")
                } else {
                    //hide the tip
                    peek.style("display", "none");
                }
            },
            async createAssociationsMaps(targetPatient) {
                let phenotypeAssociations = {};
                let geneAssociations = {};

                let geneSymbolList = targetPatient.genesList.map(gene => gene.gene_symbol);
                let phenotypeIdList = targetPatient.phenotypeList.map(phenotype => phenotype.hpoId);

                let phenotypePromises = targetPatient.phenotypeList.map(phenotype => 
                    Be.getGenesWithPhenotype(phenotype.hpoId).then(res => {
                        phenotypeAssociations[phenotype.hpoId] = { genes: res };
                        
                        let seenInTarget = new Set();
                        let seenNotInTarget = new Set();
                        let uniqueGenes = {};
                        let uniqueGenesNotInTarget = {};
                        let genesIn = res.filter(gene => {
                            if (geneSymbolList.includes(gene.gene_symbol) && !seenInTarget.has(gene.gene_symbol)) {
                                seenInTarget.add(gene.gene_symbol);
                                uniqueGenes[gene.gene_symbol] = {};
                                uniqueGenes[gene.gene_symbol]['gene'] = gene;
                                uniqueGenes[gene.gene_symbol]['diseases'] = [gene.disease_id]
                                uniqueGenes[gene.gene_symbol]['numDiseases'] = 1;
                                return true;
                            } else if (geneSymbolList.includes(gene.gene_symbol)) {
                                uniqueGenes[gene.gene_symbol]['diseases'].push(gene.disease_id);
                                uniqueGenes[gene.gene_symbol]['numDiseases'] += 1;
                            } else if (!seenNotInTarget.has(gene.gene_symbol)) {
                                seenNotInTarget.add(gene.gene_symbol);
                                uniqueGenesNotInTarget[gene.gene_symbol] = {};
                                uniqueGenesNotInTarget[gene.gene_symbol]['gene'] = gene;
                                uniqueGenesNotInTarget[gene.gene_symbol]['diseases'] = [gene.disease_id]
                                uniqueGenesNotInTarget[gene.gene_symbol]['numDiseases'] = 1;
                            } else {
                                uniqueGenesNotInTarget[gene.gene_symbol]['diseases'].push(gene.disease_id);
                                uniqueGenesNotInTarget[gene.gene_symbol]['numDiseases'] += 1;
                            }
                            return false;
                        });
                        phenotypeAssociations[phenotype.hpoId]['numInTarget'] = genesIn.length;
                        phenotypeAssociations[phenotype.hpoId]['uniqueGenes'] = {...uniqueGenes};
                        phenotypeAssociations[phenotype.hpoId]['uniqueGenesNotInTarget'] = {...uniqueGenesNotInTarget};
                    })
                    .catch(err => {
                        console.log("getGenesWithPhen Error", err);
                    })
                );
                
                let genePromises = targetPatient.genesList.map(gene =>
                    Be.getPhenotypesWithGene(gene.gene_id).then(res => {
                        geneAssociations[gene.gene_symbol] = { phenotypes: res };
                        let seen = new Set();
                        let seenNotInTarget = new Set();
                        let uniquePhenotypes = {};
                        let uniquePhenotypesNotInTarget = {};
                        let phenotypesIn = res.filter(phenotype => {
                            if (phenotypeIdList.includes(phenotype.term_id) && !seen.has(phenotype.term_id)) {
                                seen.add(phenotype.term_id);
                                uniquePhenotypes[phenotype.term_id] = {};
                                uniquePhenotypes[phenotype.term_id]['phenotype'] = phenotype;
                                uniquePhenotypes[phenotype.term_id]['diseases'] = [phenotype.disease_id];
                                uniquePhenotypes[phenotype.term_id]['numDiseases'] = 1;
                                return true;
                            } else if (phenotypeIdList.includes(phenotype.term_id)) {
                                uniquePhenotypes[phenotype.term_id]['diseases'].push(phenotype.disease_id);
                                uniquePhenotypes[phenotype.term_id]['numDiseases'] += 1;
                            } else if (!seenNotInTarget.has(phenotype.term_id)) {
                                seenNotInTarget.add(phenotype.term_id);
                                uniquePhenotypesNotInTarget[phenotype.term_id] = {};
                                uniquePhenotypesNotInTarget[phenotype.term_id]['phenotype'] = phenotype;
                                uniquePhenotypesNotInTarget[phenotype.term_id]['diseases'] = [phenotype.disease_id];
                                uniquePhenotypesNotInTarget[phenotype.term_id]['numDiseases'] = 1;
                            } else {
                                uniquePhenotypesNotInTarget[phenotype.term_id]['diseases'].push(phenotype.disease_id);
                                uniquePhenotypesNotInTarget[phenotype.term_id]['numDiseases'] += 1;
                            }
                            return false;
                        });

                        geneAssociations[gene.gene_symbol]['numInTarget'] = phenotypesIn.length;
                        geneAssociations[gene.gene_symbol]['uniquePhenotypes'] = {...uniquePhenotypes};
                        geneAssociations[gene.gene_symbol]['uniquePhenotypesNotInTarget'] = {...uniquePhenotypesNotInTarget};
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
            targetPtProp: {
                handler(newVal) {
                    if (newVal) {
                        this.targetPatient = this.targetPtProp;
                        this.setTargetPhenotypes(this.targetPatient.phenotypeList);
                        this.setTargetGenes(this.targetPatient.genesList);
                    }
                    if (newVal && newVal.genesList.length > 0 && newVal.phenotypeList.length > 0) {
                        this.createAssociationsMaps(this.targetPatient).then(res => {
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
    .clickable {
        cursor: pointer;
    }
    .clickable:hover {
        background-color: #042c09;
        color: white;
    }
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
        position: relative;
    }
    #associations-peek {
        position: absolute;
        display: none;
        background-color: white;
        color: #133910;
        border: #133910 1px solid;
        opacity: .9;
        border-radius: 5px;        
        padding: 10px 5px;
        z-index: 2;
    }
    #associations-peek p {
        border-bottom: #a7b9a6 1px solid;
        text-align: center;
    }
    #associations-peek p:last-of-type {
        border-bottom: none;
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
        background-color: #6c7b6b;
        color: white;
    }
    .phenotype-span.left-bar.dontUse {
        text-decoration: line-through;
        color: #4d5a4f;
    }
    .gene-span.left-bar {
        width: 100%;
        padding: 2px 5px;
        margin-right: 5px;
        cursor: pointer;
        border-radius: 3px;
    }
    .gene-span.left-bar.selected {
        background-color: #6c7b6b;
        color: white;
    }
    .gene-span.left-bar.dontUse {
        text-decoration: line-through;
        color: #4d5a4f;
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
    #hpo-drawer h4.genes-h4 {
        grid-template-columns: 1fr .25fr;
    }
    #hpo-drawer h4.phenotypes-h4 {
        grid-template-columns: .6fr 1fr .35fr;
    }
    #hpo-drawer h4 span {
        text-align: start;
    }
    #hpo-drawer h4.genes-h4 span {
        text-align: center;
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
        padding-left: 20px;
        margin-bottom: 2px;
        border-bottom: #bfc8bf 1px solid;
    }
    #hpo-drawer #annotations-list-container .hpo-list-div.phenotypes {
        grid-template-columns: .6fr 1fr .35fr;
    }
    #hpo-drawer #annotations-list-container .hpo-list-div.genes {
        grid-template-columns: 1fr .25fr;
    }
    #hpo-drawer #annotations-list-container .hpo-list-div.inTarget {
        color: #2e482e;
        background-color: #dae4da;
        border-radius: 3px;
        border: 1px solid #b7beb7;
    }
    
    #hpo-drawer #annotations-list-container .hpo-list-div span {
        text-align: start;
    }
    #hpo-drawer #annotations-list-container .hpo-list-div.genes span {
        text-align: center;
    }
    #hpo-drawer #annotations-list-container .hpo-list-div.genes span:nth-of-type(2) {
        text-align: end;
        padding-right: 1.5rem;
    }
    #hpo-drawer #annotations-list-container .hpo-list-div.phenotypes span:nth-of-type(3) {
        text-align: end;
        padding-right: 1.5rem;
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

<style lang="sass">
    #reload-revert-container
        width: 70%
        min-height: 100px
        padding: 10px
        border-radius: 5px
        background-color: #21351f
        position: absolute
        display: flex
        flex-direction: column
        justify-content: space-evenly
        align-items: center
        bottom: 50vh
        right: -71%
        z-index: 3
        box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75)
        transition: all 0.5s ease
        &.hidden
            opacity: 0
            visibility: hidden
            bottom: 0%
        p
            color: white
            width: 100%
            text-align: center
            text-transform: capitalize
        .buttons
            width: 100%
            display: flex
            flex-direction: row
            justify-content: space-around
            font-size: small
            button
                padding: 5px 10px
                border-radius: 5px
                border: 1px solid white
            button:first-of-type
                background-color: red
                color: white
            button:first-of-type:hover
                background-color: #FF5C5C
                cursor: pointer
                color: black
            button:nth-of-type(2)
                background-color: #448849
                color: white
            button:nth-of-type(2):hover
                background-color: #85C189
                cursor: pointer
                color: black
</style>