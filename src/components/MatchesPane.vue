<template>
    <div id="matches-container">
        <div class="upper matches">
            <ChartViz
                :targetPatient="targetPatient"
                :patientMap="patientMap"
                :selectedMatches="selectedMatches"
                :hoveredFromMatches="hoveredFromMatches"
                @selectMatch="populateSelectedMatch"
                :chartScales="chartScales"></ChartViz>
        </div>

        <div id="lower-container">
            <div class="lower matches" :class="{ expanded: showDetailsBar, collapsed: !showDetailsBar}">
                <h1 v-if="selectedMatches && selectedMatches.length <= 1" class="section-head">Selected Match</h1>
                <h1 v-if="selectedMatches && selectedMatches.length > 1" class="section-head">Selected Matches ({{ selectedMatches.length }})</h1>
                <h1 v-if="!selectedMatches" class="section-head">Selected Match</h1>
                <h4 v-if="selectedMatches && selectedMatches.length == 0" id="no-match-alt-text">No matches selected. Select matches from the chart to display details.</h4>
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
                                <p class="list-item inTarget" v-for="(value, key) in phenotypesInCommon" :key="key">{{ value.phenotype.hpoId + " " + value.phenotype.term }}</p>
                                <p class="list-item" v-for="(value, key) in phenNotInTarget" :key="key"> {{ value.phenotype.hpoId + " " + value.phenotype.term }}</p>
                            </div>
                        </div>

                        <div class="sub">
                            <h4>Genes:</h4>
                            <div>
                                <p class="list-item inTarget" v-for="(value, key) in genesInCommon" :key="key">{{ value.gene.gene_symbol }}</p>
                                <p class="list-item" v-for="(value, key) in genesNotInTarget" :key="key">{{ value.gene.gene_symbol }}</p>                              
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedMatches && selectedMatches.length > 1" class="column full-height">
                        <div class="sub">
                            <h4>Genes:</h4>
                            <div>
                                <p class="list-item inTarget" v-for="(value, key) in genesInCommon" 
                                    :key="key" 
                                    @mouseover="showHoveredFromMatches(value.matches)"
                                    @mouseout="resetHoveredFromMatches()">
                                        <span>{{ value.gene.gene_symbol }}</span>
                                        <span v-if="value.count > 1">{{ value.count }}</span>
                                </p>
                                <p class="list-item" v-for="(value, key) in genesNotInTarget" 
                                    :key="key" 
                                    @mouseover="showHoveredFromMatches(value.matches)"
                                    @mouseout="resetHoveredFromMatches()">
                                        <span>{{ value.gene.gene_symbol }}</span>
                                        <span v-if="value.count > 1">{{ value.count }}</span>
                                </p>                              
                            </div>
                        </div>
                        <div class="sub">
                            <h4>Diagnoses:</h4>
                            <div>
                                <p class="list-item diagnosis" v-for="(value, key) in diagnoses" 
                                    :key="key" 
                                    @mouseover="showHoveredFromMatches(value.matches)"
                                    @mouseout="resetHoveredFromMatches()">
                                        <span>{{ value.diagnosis }}</span>
                                        <span v-if="value.count > 1">{{ value.count }}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div v-if="selectedMatches && selectedMatches.length > 1" class="column full-height">
                        <div class="sub">
                            <h4>Phenotypes</h4>
                            <div>
                                <p class="list-item inTarget" v-for="(value, key) in phenotypesInCommon" 
                                    :key="key" 
                                    @mouseover="showHoveredFromMatches(value.matches)"
                                    @mouseout="resetHoveredFromMatches()"> 
                                        <span>{{ value.phenotype.hpoId + " " + value.phenotype.term }}</span>
                                        <span v-if="value.count > 1">{{ value.count }}</span>
                                </p>
                                <p class="list-item" v-for="(value, key) in phenNotInTarget" 
                                    :key="key" 
                                    @mouseover="showHoveredFromMatches(value.matches)"
                                    @mouseout="resetHoveredFromMatches()">
                                        <span>{{ value.phenotype.hpoId + " " + value.phenotype.term}}</span>
                                        <span v-if="value.count > 1">{{ value.count }}</span>
                                </p>
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
        phenNotInTarget: {},
        genesNotInTarget: {},
        phenotypesInCommon: {},
        genesInCommon: {},
        diagnoses: {},
        hoveredFromMatches: [],
      }
    },
    methods: {
        showHoveredFromMatches(matches) {
            this.hoveredFromMatches = matches;
        },
        resetHoveredFromMatches() {
            this.hoveredFromMatches = [];
        },
        populateSelectedMatch(matches) {
            let previouslyNull = this.selectedMatches == null;
            this.selectedMatches = matches;
            
            if (!this.showDetailsBar && previouslyNull) {
                this.showDetailsBar = true;
            } 
        },
        setLists() {
            if (this.selectedMatches && this.targetPatient) {
                if (this.selectedMatches.length == 0) {
                    this.phenNotInTarget = {};
                    this.genesNotInTarget = {};
                    this.phenotypesInCommon = {};
                    this.genesInCommon = {};
                    this.diagnoses = {};
                    return;
                } else if (this.selectedMatches.length == 1) {
                    let selectedMatch = this.selectedMatches[0];
                    
                    let phenNotInTarget = {};
                    let phenInCommon = {};
                    phenNotInTarget = selectedMatch.phenotypeList.reduce((obj, phenotype) => {
                        let isInTarget = this.targetPatient.phenotypeList.some(targetPhenotype => targetPhenotype.hpoId == phenotype.hpoId)
                        if (!isInTarget) {
                            obj[phenotype.hpoId] = obj[phenotype.hpoId] || {phenotype: phenotype, count: 0, matches: []};
                            obj[phenotype.hpoId].count++;
                            obj[phenotype.hpoId].matches.push(selectedMatch); //adding the match, one pt should only ever have a phenotype once so this is fine
                        } else {
                            phenInCommon[phenotype.hpoId] = phenInCommon[phenotype.hpoId] || {phenotype: phenotype, count: 0, matches: []};
                            phenInCommon[phenotype.hpoId].count++;
                            phenInCommon[phenotype.hpoId].matches.push(selectedMatch);
                        }
                        return obj;
                    }, {});
                    //order by count
                    this.phenNotInTarget = Object.values(phenNotInTarget).sort((a, b) => b.count - a.count);
                    this.phenotypesInCommon = Object.values(phenInCommon).sort((a, b) => b.count - a.count);

                    let genesInCommon = {};
                    let genesNotInTarget = {};
                    genesNotInTarget = selectedMatch.genesList.reduce((obj, gene) => {
                        let isInTarget = this.targetPatient.genesList.some(targetGene => targetGene.gene_symbol == gene.gene_symbol)
                        if (!isInTarget) {
                            obj[gene.gene_symbol] = obj[gene.gene_symbol] || {gene: gene, count: 0, matches: []};
                            obj[gene.gene_symbol].count++;
                            obj[gene.gene_symbol].matches.push(selectedMatch);
                        } else {
                            genesInCommon[gene.gene_symbol] = genesInCommon[gene.gene_symbol] || {gene: gene, count: 0, matches: []};
                            genesInCommon[gene.gene_symbol].count++;
                            genesInCommon[gene.gene_symbol].matches.push(selectedMatch);
                        }
                        return obj;
                    }, {})
                    this.genesNotInTarget = Object.values(genesNotInTarget).sort((a, b) => b.count - a.count);
                    this.genesInCommon = Object.values(genesInCommon).sort((a, b) => b.count - a.count);

                    this.diagnoses[selectedMatch.clinicalDiagnosis] = this.diagnoses[selectedMatch.clinicalDiagnosis] || {diagnosis: selectedMatch.clinicalDiagnosis, count: 0};
 
                } else if (this.selectedMatches.length > 1) {
                    //Phenotypes
                    let phenNotInTarget = {};
                    let phenInCommon = {};
                    this.selectedMatches.forEach(match => {
                        phenNotInTarget = match.phenotypeList.reduce((obj, phenotype) => {
                            let isInTarget = this.targetPatient.phenotypeList.some(targetPhenotype => targetPhenotype.hpoId == phenotype.hpoId)
                            if (!isInTarget) {
                                obj[phenotype.hpoId] = obj[phenotype.hpoId] || {phenotype: phenotype, count: 0, matches: []};
                                obj[phenotype.hpoId].count++;
                                obj[phenotype.hpoId].matches.push(match);
                            } else {
                                phenInCommon[phenotype.hpoId] = phenInCommon[phenotype.hpoId] || {phenotype: phenotype, count: 0, matches: []};
                                phenInCommon[phenotype.hpoId].count++;
                                phenInCommon[phenotype.hpoId].matches.push(match);
                            }
                            return obj;
                        }, phenNotInTarget);
                    })
                    this.phenNotInTarget = Object.values(phenNotInTarget).sort((a, b) => b.count - a.count);
                    this.phenotypesInCommon = Object.values(phenInCommon).sort((a, b) => b.count - a.count);

                    //Genes
                    let genesNotInTarget = {};
                    let genesInCommon = {};
                    this.selectedMatches.forEach(match => {
                        genesNotInTarget = match.genesList.reduce((obj, gene) => {
                            let isInTarget = this.targetPatient.genesList.some(targetGene => targetGene.gene_symbol == gene.gene_symbol)
                            if (!isInTarget) {
                                obj[gene.gene_symbol] = obj[gene.gene_symbol] || {gene: gene, count: 0, matches: []};
                                obj[gene.gene_symbol].count++;
                                obj[gene.gene_symbol].matches.push(match);
                            } else {
                                genesInCommon[gene.gene_symbol] = genesInCommon[gene.gene_symbol] || {gene: gene, count: 0, matches: []};
                                genesInCommon[gene.gene_symbol].count++;
                                genesInCommon[gene.gene_symbol].matches.push(match);
                            }
                            return obj;
                        }, genesNotInTarget);
                    })
                    this.genesNotInTarget = Object.values(genesNotInTarget).sort((a, b) => b.count - a.count);
                    this.genesInCommon = Object.values(genesInCommon).sort((a, b) => b.count - a.count);

                    //Diagnoses
                    let diagnoses = {};
                    this.selectedMatches.forEach(match => {
                        //only add to diagnoses if it is not "Undiagnosed"
                        if (match.clinicalDiagnosis != "Undiagnosed") {
                            diagnoses[match.clinicalDiagnosis] = diagnoses[match.clinicalDiagnosis] || {diagnosis: match.clinicalDiagnosis, count: 0, matches: []};
                            diagnoses[match.clinicalDiagnosis].count++;
                            diagnoses[match.clinicalDiagnosis].matches.push(match);
                        }
                    })
                    this.diagnoses = Object.values(diagnoses).sort((a, b) => b.count - a.count);
                }
            }
        },
    },
    watch: {
        selectedMatches: function() {
            this.setLists();
        },
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
        flex-direction: row;
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
    .lower.matches #no-match-alt-text {
        margin-top: 10px;
        width: 100%;
        text-align: center;
        font-weight: 500;
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
        background-color: #d7ded7;
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
        overflow: auto;
    }
    .column .sub .list-item {
        border-radius: 3px;
        border: 1px solid #b7beb7;
        margin-bottom: 2px;
        margin-right: 5px;
        margin-left: 5px;
        padding-left: 10px;
        padding-right: 20px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        cursor: default;
    }
    .column .sub .list-item:hover {
        background-color: #e9ede9;
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
    .column .sub .list-item.inTarget:hover {
        background-color: #e9ede9;
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