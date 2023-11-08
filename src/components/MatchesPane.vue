<template>
    <div id="matches-container">
        <div class="upper matches">
            <h1 class="section-head">Matches Chart</h1>
            <LinearChartViz
                :targetPatient="targetPatient"
                :patientMap="patientMap"
                :selectedMatch="selectedMatch"
                @selectMatch="populateSelectedMatch"
                :chartScales="chartScales"></LinearChartViz>
        </div>

        <div id="lower-container">
            <div class="lower matches" :class="{ expanded: showDetailsBar, collapsed: !showDetailsBar}">
                <h1 class="section-head">Selected Match</h1>
                <div v-if="selectedMatch" class="column-container">
                    <div class="column">
                        <h3>In Common with Target</h3>
                        <h4>Phenotypes In Common</h4>
                        <div class="in-common-container" v-if="selectedMatch.phenotypesInCommon.length > 0">
                            <ul>
                                <li v-for="phenotype in selectedMatch.phenotypesInCommon">{{ phenotype.hpoId + " " + phenotype.term }}</li>
                            </ul>    
                        </div>
                        <p v-if="selectedMatch.phenotypesInCommon.length == 0">No phenotypes in common</p>
                        <h4>Variants In Common</h4>
                        <div class="in-common-container" v-if="selectedMatch.genesInCommon.length > 0">
                            <ul>
                                <li v-for="gene in selectedMatch.genesInCommon">{{ gene.gene_symbol }}</li>
                            </ul>    
                        </div>
                        <div class="in-common-container" v-if="selectedMatch.genesInCommon.length == 0">No variants in common</div>
                    </div>
                    <div class="column">
                        <div class="sub">
                            <h4>Phenotypes</h4>
                            <div>
                                <p v-for="phenotype in selectedMatch.phenotypeList"> {{ phenotype.hpoId + " " + phenotype.term }}</p>
                            </div>
                        </div>

                        <div class="sub">
                            <h4>Variants:</h4>
                            <div>
                                <ul>
                                    <li v-for="gene in selectedMatch.genesList">{{ gene.gene_symbol }}</li>
                                </ul>                                 
                            </div>
                        </div>
                    </div>
                    <div class="column">
                        <h4>Summary</h4>
                        <div id="summary-container">
                            <p><b>ID:</b> {{ selectedMatch.id }}</p>
                            <p><b>Rank:</b> {{ selectedMatch.rank }}</p>
                            <p><b>Score:</b> {{ Math.round(selectedMatch.similarityScore * 10000)/10000 }}</p>
                            <p><b>Dx Status:</b> {{ selectedMatch.dx }}</p>
                            <p><b>Clinical Dx:</b> {{ selectedMatch.clinicalDiagnosis }}</p>
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
    import LinearChartViz from './viz/linearChartViz.vue';
  export default {
    name: 'MatchesPane',
    components: {
        LinearChartViz,
    }, 
    props: {
        targetPatient: Object,
        patientMap: Object,
        chartScales: Object,
    },
    data: function() {
      return {
        showDetailsBar: false,
        selectedMatch: null,
      }
    },
    methods: {
        populateSelectedMatch(match) {
            this.selectedMatch = match;
            if (!this.showDetailsBar && this.selectedMatch) {
                this.showDetailsBar = true;
            } else if (!this.selectedMatch) {
                this.showDetailsBar = false;
            }
        }
    },
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
        background-color: #e9ede9;
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
        max-width: 34%;
        height: 97%;
    }
    .lower.matches .column-container .column:last-of-type {
        max-width: 26%;
    }
    .lower.matches .column-container .column:first-of-type {
        border-right: #21351f 1px solid;
        padding-right: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
    }
    .lower.matches .column-container .column h4 {
        margin-bottom: 5px;
        margin-top: 10px;
        background-color: #e9ede9;
        padding-left: 10px;
        border-radius: 3px;
    }
    .lower.matches .column-container .column .in-common-container {
        padding-left: 10px;
        overflow-y: auto;
    }
    .lower.matches .column-container .column h3 {
        width: 100%;
        text-align: center;
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
        padding-left: 10px;
        overflow: auto;
    }
    .lower.matches .column-container .column .sub:last-of-type div {
        width: 100%;
        padding-left: 10px;
        overflow: auto;
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