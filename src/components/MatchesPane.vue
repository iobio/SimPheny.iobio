<template>
    <div id="matches-container">
        <div class="upper matches">
            <ChartViz
                :targetPatient="targetPatient"
                :patientMap="patientMap"
                :selectedMatches="selectedMatches"
                @selectMatch="populateSelectedMatch"
                :chartScales="chartScales"></ChartViz>
        </div>

        <div id="lower-container">
            <div class="lower matches" :class="{ expanded: showDetailsBar, collapsed: !showDetailsBar}">
                <h1 v-if="selectedMatches && selectedMatches.length <= 1" class="section-head">Selected Match</h1>
                <h1 v-if="selectedMatches && selectedMatches.length > 1" class="section-head">Selected Matches</h1>
                <div v-if="selectedMatches" class="column-container">
                    <div v-if="selectedMatches && selectedMatches.length == 1" class="column">
                        <h4>Summary</h4>
                        <div id="summary-container">
                            <p><b>ID:</b> {{ selectedMatches[0].id }}</p>
                            <p><b>Rank:</b> {{ selectedMatches[0].rank }}</p>
                            <p><b>Score:</b> {{ Math.round(selectedMatches[0].similarityScore * 10000)/10000 }}</p>
                            <p><b>Dx Status:</b> {{ selectedMatches[0].dx }}</p>
                            <p><b>Clinical Dx:</b> {{ selectedMatches[0].clinicalDiagnosis }}</p>
                        </div>
                    </div>

                    <div v-if="selectedMatches && selectedMatches.length == 1" class="column">
                        <div class="sub">
                            <h4>Phenotypes</h4>
                            <div>
                                <p class="list-item inTarget" v-for="phenotype in phenotypesInCommon"> {{ phenotype.hpoId + " " + phenotype.term }}</p>
                                <p class="list-item" v-for="phenotype in phenNotInTarget"> {{ phenotype.hpoId + " " + phenotype.term }}</p>
                            </div>
                        </div>

                        <div class="sub">
                            <h4>Genes:</h4>
                            <div>
                                <p class="list-item inTarget" v-for="gene in genesInCommon">{{ gene.gene_symbol }}</p>
                                <p class="list-item" v-for="gene in genesNotInTarget">{{ gene.gene_symbol }}</p>                              
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedMatches && selectedMatches.length > 1" class="column full-height">
                        <div class="sub">
                            <h4>Genes:</h4>
                            <div>
                                <p class="list-item inTarget" v-for="gene in genesInCommon">{{ gene.gene_symbol }}</p>
                                <p class="list-item" v-for="gene in genesNotInTarget">{{ gene.gene_symbol }}</p>                              
                            </div>
                        </div>
                        <div class="sub">
                            <h4>Diagnoses:</h4>
                            <div>
                                <p class="list-item diagnosis" v-for="diagnosis in diagnoses">{{ diagnosis }}</p>
                            </div>
                        </div>
                    </div>
                    <div v-if="selectedMatches && selectedMatches.length > 1" class="column full-height">
                        <div class="sub">
                            <h4>Phenotypes</h4>
                            <div>
                                <p class="list-item inTarget" v-for="phenotype in phenotypesInCommon"> {{ phenotype.hpoId + " " + phenotype.term }}</p>
                                <p class="list-item" v-for="phenotype in phenNotInTarget"> {{ phenotype.hpoId + " " + phenotype.term }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="button-container matches">
            <v-btn icon @click="showDetailsBar = !showDetailsBar" :class="{ expanded: showDetailsBar, collapsed: !showDetailsBar}" class="btn umbrella matches" height="35px" width="35px" color="#21351f">
                <v-tooltip offset="3" location="right" activator="parent">
                    <span v-if="!showDetailsBar">Expand match details</span>
                    <span v-if="showDetailsBar">Collapse match details</span>
                </v-tooltip>
                <v-icon v-if="showDetailsBar" color="white">mdi-arrow-down-circle-outline</v-icon>
                <v-icon v-if="!showDetailsBar" color="white">mdi-arrow-up-circle-outline</v-icon>
            </v-btn>
        </div>
        </div>
    </div>
</template>

<script> 
    import ChartViz from './viz/ChartViz.vue';
  export default {
    name: 'MatchesPane',
    components: {
        ChartViz,
    }, 
    props: {
        targetPatient: Object,
        patientMap: Object,
        chartScales: Object,
    },
    data: function() {
      return {
        showDetailsBar: false,
        selectedMatches: null,
        phenNotInTarget: [],
        genesNotInTarget: [],
        phenotypesInCommon: [],
        genesInCommon: [],
        diagnoses: [],
      }
    },
    methods: {
        populateSelectedMatch(matches) {
            let previouslyNull = this.selectedMatches == null;
            this.selectedMatches = matches;
            if (!this.showDetailsBar && previouslyNull) {
                this.showDetailsBar = true;
            } else if (!this.selectedMatches) {
                this.showDetailsBar = false;
            }
        },
    },
    watch: {
        selectedMatches: function() {
            if (this.selectedMatches && this.targetPatient) {
                if (this.selectedMatches.length == 0) {
                    this.phenNotInTarget = [];
                    this.genesNotInTarget = [];
                    this.phenotypesInCommon = [];
                    this.genesInCommon = [];
                    this.diagnoses = [];
                    this.showDetailsBar = false;
                    return;
                } else if (this.selectedMatches.length == 1) {
                    let selectedMatch = this.selectedMatches[0];

                    this.phenNotInTarget = selectedMatch.phenotypeList.filter(phenotype => {
                        return !this.targetPatient.phenotypeList.some(targetPhenotype => {
                            return targetPhenotype.hpoId == phenotype.hpoId;
                        })
                    })

                    this.phenotypesInCommon = selectedMatch.phenotypeList.filter(phenotype => {
                        return this.targetPatient.phenotypeList.some(targetPhenotype => {
                            return targetPhenotype.hpoId == phenotype.hpoId;
                        })
                    })

                    this.genesNotInTarget = selectedMatch.genesList.filter(gene => {
                        return !this.targetPatient.genesList.some(targetGene => {
                            return targetGene.gene_symbol == gene.gene_symbol;
                        })
                    })

                    this.genesInCommon = selectedMatch.genesList.filter(gene => {
                        return this.targetPatient.genesList.some(targetGene => {
                            return targetGene.gene_symbol == gene.gene_symbol;
                        })
                    })

                    this.diagnoses = selectedMatch.diagnoses;
 
                } else if (this.selectedMatches.length > 1) {
                    //iterate through each match and find the phenotypes that are not in the target
                    let phenNotInTarget = [];
                    this.selectedMatches.forEach(match => {
                        phenNotInTarget = phenNotInTarget.concat(match.phenotypeList.filter(phenotype => {
                            return !this.targetPatient.phenotypeList.some(targetPhenotype => {
                                return targetPhenotype.hpoId == phenotype.hpoId;
                            })
                        }))
                    })
                    this.phenNotInTarget = phenNotInTarget;

                    let genesNotInTarget = [];
                    this.selectedMatches.forEach(match => {
                        genesNotInTarget = genesNotInTarget.concat(match.genesList.filter(gene => {
                            return !this.targetPatient.genesList.some(targetGene => {
                                return targetGene.gene_symbol == gene.gene_symbol;
                            })
                        }))
                    })
                    this.genesNotInTarget = genesNotInTarget;

                    let phenotypesInCommon = [];
                    this.selectedMatches.forEach(match => {
                        phenotypesInCommon = phenotypesInCommon.concat(match.phenotypeList.filter(phenotype => {
                            return this.targetPatient.phenotypeList.some(targetPhenotype => {
                                return targetPhenotype.hpoId == phenotype.hpoId;
                            })
                        }))
                    })
                    this.phenotypesInCommon = phenotypesInCommon;

                    let genesInCommon = [];
                    this.selectedMatches.forEach(match => {
                        genesInCommon = genesInCommon.concat(match.genesList.filter(gene => {
                            return this.targetPatient.genesList.some(targetGene => {
                                return targetGene.gene_symbol == gene.gene_symbol;
                            })
                        }))
                    })
                    this.genesInCommon = genesInCommon;

                    let diagnoses = [];
                    this.selectedMatches.forEach(match => {
                        //only add to diagnoses if it is not "Undiagnosed"
                        if (match.clinicalDiagnosis != "Undiagnosed") {
                            diagnoses = diagnoses.concat(match.clinicalDiagnosis);
                        }
                    })
                    this.diagnoses = diagnoses;
                }
            }
        }
    }
  }
</script>

<style>
    #matches-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: hidden;
    }

    .upper.matches {
        flex-grow: 1;
        width: 100%;
        background-color: #ffffff;
        padding-top: 48px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    #lower-container {
        width: 100%;
        height: fit-content;
        position: relative;
    }

    .lower.matches {
        width: 100%;
        transition: all .45s ease-in-out;
        height: 100%;
    }

    .lower.matches.expanded {
        height: 40vh;
        border-top: 2px solid #21351f;
        box-shadow: 0px -5px 5px -2px rgba(0,0,0,0.2);
    }

    .lower.matches.collapsed {
        height: 0vh;
        border-top: 0px solid transparent;
        overflow: hidden;
    }

    .lower.matches .column-container {
        width: 98%;
        height: 93%;
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        align-items: start;
        overflow: hidden;
        padding-bottom: 5px;
    }
    .lower.matches .column-container .column {
        max-width: 55%;
        min-width: 45%;
        height: 97%;
    }
    .lower.matches .column-container .column:first-of-type {
        max-width: 26%;
        min-width: 20%;
    }
    .lower.matches .column-container .column h4 {
        margin-bottom: 5px;
        margin-top: 10px;
        background-color: #e9ede9;
        padding-left: 10px;
        border-radius: 3px;
    }
    .column-container .column #summary-container {
        padding-left: 10px;
    }
    .lower.matches .column-container .column .sub:first-of-type {
        width: 100%;
        height: 60%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
    }
    .lower.matches .column-container .column .sub:last-of-type {
        width: 100%;
        height: 31%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
    }
    .lower.matches .column-container .column .sub:first-of-type div {
        width: 100%;
        overflow: auto;
    }
    .lower.matches .column-container .column .sub:last-of-type div {
        width: 100%;
        padding-left: 10px;
        overflow: auto;
    }
    .column .sub .list-item {
        border-bottom: 1px solid #b7beb7;
        margin-bottom: 2px;
        padding-left: 10px;
    }
    .column .sub .list-item.diagnosis {
        text-transform: uppercase;
        font-size: small;
    }
    .column .sub .list-item.inTarget {
        color: #2e482e;
        background-color: #dae4da;
        border-radius: 3px;
        border: 1px solid #b7beb7;

    }
    .lower.matches .column-container .column.full-height {
        height: 100%;
    }
    .lower.matches .column-container .column.full-height:first-of-type {
        height: 100%;
        max-width: 35%;
    }
    .lower.matches .column-container .column.full-height .sub {
        height: 95%;
    }
    .lower.matches .column-container .column.full-height:first-of-type .sub {
        height: 47%;
    }
    .lower.matches .column-container .column li {
        list-style-type: none;
    }
    .button-container.matches {
        width: 100%;
        height: 35px;
        background-color: transparent;

        top: -45px;
        left: 0;
        position: absolute;
        overflow: visible;
    }
    .btn.umbrella.matches {
        top: -58px;
        left: 10px;

        height: 35px;
        width: 35px;
        position: absolute;
        transition: all .45s ease-in-out;
    }

    .btn.umbrella.matches.expanded {
        top: 55px;
        left: 10px;
    }

    .btn.umbrella.matches.collapsed {
        top: 0px;
        left: 10px;
    }

</style>