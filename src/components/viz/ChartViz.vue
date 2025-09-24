<template>
    <div id="chart-opt-and-button">
        <button @mouseenter="showToggleOptTip" @mouseleave="unshowToggleOptTip" @click="showChartOptions = !showChartOptions" id="chart-options-btn">
            <v-icon color="white">mdi-dots-horizontal-circle-outline</v-icon>
            <span id="toggle-options-tip">Chart Options</span>
        </button>

        <div id="chart-options-container" :class="{ hidden: showChartOptions === false}">
                <h3>Chart Options</h3>

                <div id="options-content">
                    <div class="group">
                        <p>SimPheny Matches Only</p>
                        <input v-model="filterOptions.showGenesInCommonOnly" type="checkbox" name="" id="">
                    </div>

                    <div v-if="whichPopulation == 'both'" class="group">
                        <fieldset>
                            <legend>Filter Population:</legend>
                            <div>
                                <input type="radio" id="both" name="population" value="both" v-model="filterOptions.populationFilter">
                                <label for="both">Orpha & UDN</label>
                            </div>
                            <div>
                                <input type="radio" id="udn" name="population" value="udn" v-model="filterOptions.populationFilter">
                                <label for="udn">UDN</label>
                            </div>
                            <div>
                                <input type="radio" id="orpha" name="population" value="orpha" v-model="filterOptions.populationFilter">
                                <label for="orpha">Orphanet</label>
                            </div>
                        </fieldset>
                    </div>

                    <div class="group zoom-to-select">
                        <label v-if="!zoomed" for="zoom-to-select">Zoom on Selection</label>
                        <button v-if="!zoomed" @click="zoomToSelect()" :disabled="!selectedMatches || selectedMatches.length == 0"><v-icon>mdi-magnify-plus-outline</v-icon></button>
                        
                        <label v-if="zoomed" for="zoom-to-select">Return to Origin</label>
                        <button v-if="zoomed" @click="applyFilters()"><v-icon>mdi-magnify-minus-outline</v-icon></button>
                    </div> 

                    <div class="group" id="filter-by-radios" :class="{filterByCollapsed: filterByRadiosCollapsed}">
                        <p>More Filters 
                            <div class="collapse-btn radios" @click="filterByRadiosCollapsed = !filterByRadiosCollapsed">
                                <v-icon v-if="filterByRadiosCollapsed">mdi-chevron-down</v-icon>
                                <v-icon v-else>mdi-chevron-up</v-icon>
                            </div>
                        </p>
                        <div v-if="!filterByRadiosCollapsed" class="filterby-wrapper">
                            <div>
                                <input @click="selectFilter('rank')" type="checkbox" v-model="filterOptions.filterByRank">
                                <label for="rank">PhenoSim Rank</label>
                            </div>
                            <div class="filter-num-input">
                                <v-text-field
                                    ref="rankField"
                                    :rules="[validRank]"
                                    variant="outlined" 
                                    label="Max"
                                    type="number"
                                    density="compact"
                                    step="5"
                                    v-model="filterOptions.rankCutOff"
                                    :disabled="!filterOptions.filterByRank"
                                    :hint="'0 <= N => ' + Object.keys(filteredPatientMap).length">
                                </v-text-field>
                            </div>
                        </div>
                        <div v-if="!filterByRadiosCollapsed" class="filterby-wrapper">
                            <div>
                                <input @click="selectFilter('score')" type="checkbox" v-model="filterOptions.filterByScore">
                                <label for="score">PhenoSim Score</label> 
                            </div>
                            <div class="filter-num-input">
                                <v-text-field
                                    ref="scoreField"
                                    :rules="[validScore]"
                                    variant="outlined" 
                                    label="Min"
                                    type="number"
                                    density="compact"
                                    step=".1"
                                    v-model="filterOptions.scoreCutOff"
                                    :disabled="!filterOptions.filterByScore"
                                    hint="0 <= N => 1">
                                </v-text-field>
                            </div>
                        </div>                 
                    </div>  
                </div>

                <div id="options-buttons">
                    <button @click="applyFilters()" :disabled="!canApplyFilters()">Apply<v-icon v-if="zoomed">mdi-magnify-minus-outline</v-icon></button>
                    <button @click="resetChart()">Reset <v-icon>mdi-reload-alert</v-icon></button>
                </div>
        </div>
    </div>    
    <div id="chart-wrapper">
    <div id="linear-chart-container">
        <div id="chart-key-container">
            <p id="chart-key-hoverable" 
                @mouseenter="showChartKey = true" 
                @mouseleave="showChartKey = false">
                    <v-icon>mdi-key-variant</v-icon>
            </p>
            <ChartKeyPopout 
                :showChartKey="showChartKey">
            </ChartKeyPopout>
        </div>
        
        <div ref="lin-chart-container" id="lin-chart-viz" v-if="requiredPresent()"></div>
        <div v-else id="lin-chart-alt-text">
            <p>No target patient defined.</p>
            <p>Input target patient to view matches.</p>
        </div>
        
    </div>        
    </div>

    <div id="ranked-list-section">
        <div v-if="geneHits.length > 0" id="inner-section">
            <h4 class="gene-hits-title">Gene Candidates</h4>
            <div v-for="(gene, i) in geneHits" :key="gene.gene" class="gene-hit-item" @click="selectPatientsForGene(gene.patients)">
                <div class="rank" v-if="gene.patients[0].simphenyScore">{{ i + 1 }}</div>
                <div class="gene-hit-details">
                    <div class="gene-and-count">
                        <div class="gene-name">{{ gene.gene }}</div>
                        <div class="avg-score" v-if="gene.patients[0].simphenyScore">Top2 Avg {{ gene.averageScore.toFixed(2) }}</div>
                    </div>
                    <div class="patient-count">{{ gene.patients.length }} Match{{ gene.patients.length > 1 ? 'es' : '' }}</div>
                    <div class="patients-scores">
                        <span 
                            v-for="(pt, index) in gene.patients.slice(0, 3)" 
                            :key="pt.id"
                            class="score-badge"
                        >
                            <span v-if="pt.simphenyScore">{{ pt.simphenyScore.toFixed(2) }}</span>
                        </span>
                        <span v-if="gene.patients.length > 3 && gene.patients[0].simphenyScore" class="more-patients">+{{ gene.patients.length - 3 }}</span>
                    </div>                    
                </div>
            </div>
        </div>
        <div v-else id="inner-section">
            <h4 class="gene-hits-title">Gene Candidates</h4>
            <div class="no-candidates-container">
                <p class="no-candidates-text">No gene candidates available.</p>
                <button v-if="filterOptions.showGenesInCommonOnly" @click="showNonMatches" class="show-non-matches-btn">
                    Show Non-Matches
                    <v-icon>mdi-eye-outline</v-icon>
                </button>
            </div>
        </div>
    </div>
    
    <div id="lin-chart-tip"></div>

</template>

<script>
    import CircularChart from '../../d3/CircularChart.d3';
    import ChartKeyPopout from '../ChartKeyPopout.vue';
    import * as d3 from 'd3';

    export default {
    emits: ['selectMatch'],
    name: 'ChartViz',
    components: {
        ChartKeyPopout
    },
    props: {
        targetPatient: Object,
        patientMap: Object,
        selectedMatchesProp: Array,
        chartScales: Object,
        hoveredFromMatches: Array,
        whichPopulation: String,
    },
    data: function () {
        return {
            chart: null,
            resizeObserver: null,
            showChartOptions: false,
            showChartKey: false,
            selectedMatches: this.selectedMatchesProp,
            chartScalesFiltered: this.chartScales,
            filteredPatientMap: this.patientMap,
            filterOptions: {
                showUndiagnosed: false,
                showGenesInCommonOnly: true,
                filterByRank: false,
                filterByScore: false,
                rankCutOff: 0,
                scoreCutOff: 0.0,
                populationFilter: 'both',
            },
            anglesMap: {},
            zoomed: false,
            filterByRadiosCollapsed: true,
        };
    },
    mounted() {
        if (this.targetPatient) {
            var linChartContainer = this.$refs['lin-chart-container'];
            //add a listener for when the window is resized or the container is resized
            this.resizeObserver = new ResizeObserver(() => {
                this.drawChart();
            });
            this.resizeObserver.observe(linChartContainer);
            this.applyFilters();
        }
    },
    updated() {
        if (this.targetPatient) {
            if (this.resizeObserver == null) {
                var linChartContainer = this.$refs['lin-chart-container'];
                //add a listener for when the window is resized or the container is resized
                this.resizeObserver = new ResizeObserver(() => {
                    this.drawChart();
                });
                this.resizeObserver.observe(linChartContainer);
            }
        }
    },
    beforeDestroy() {
        //remove the resize observer if it exists
        if (this.resizeObserver != null) {
            this.resizeObserver.unobserve(linChartContainer);
        }
    },
    methods: {
        showToggleOptTip() {
            let tip = document.getElementById('toggle-options-tip');
            tip.classList.add('shown');
        },
        unshowToggleOptTip() {
            let tip = document.getElementById('toggle-options-tip');
            tip.classList.remove('shown');
        },
        requiredPresent() {
            return this.targetPatient && this.patientMap && this.chartScales && this.filteredPatientMap && this.chartScalesFiltered;
        },
        canApplyFilters() {
            return this.validRank(this.filterOptions.rankCutOff) && this.validScore(this.filterOptions.scoreCutOff);
        },
        validRank(v) {
            return !isNaN(v) && Number.isInteger(+v) && v >= 0 && v <= Object.keys(this.filteredPatientMap).length && v !== '';
        },
        validScore(v) {
            return !isNaN(v) && v >= 0.0 && v <= 1.0;
        },
        showNonMatches() {
            this.filterOptions.showGenesInCommonOnly = false;
            this.applyFilters();
        },
        drawChart() {
            let container = this.$refs['lin-chart-container'];
            //clear the chart if it already exists
            if (this.chart) {
                //clear container
                d3.select(container).selectAll("*").remove();
            }
            if (container != null && this.targetPatient && this.chartScales) {
                let height = container.clientHeight;
                //create a map with the hovered maches if they exist where id is the key
                let hoveredMatchesMap = {};
                if (this.hoveredFromMatches && this.hoveredFromMatches.length > 0) {
                    for (let match of this.hoveredFromMatches) {
                        hoveredMatchesMap[match.id] = match;
                    }
                }
                let selectedMatchesMap = {};
                if (this.selectedMatches && this.selectedMatches.length > 0) {
                    for (let match of this.selectedMatches) {
                        selectedMatchesMap[match.id] = match;
                    }
                }
                this.chart = CircularChart()
                    .setSize(height)
                    .setSelectedMatches(this.selectedMatches)
                    .setXMax(this.chartScalesFiltered.xMin)
                    .setXMin(1 - ((1 - this.chartScalesFiltered.xMax) * .9))
                    .onMatchSelected(this.selectMatches)
                    .onRectangleSelected(this.selectRectangle)
                    .setHoveredFromMatches(this.hoveredFromMatches)
                    .setHoveredObjFromMatches(hoveredMatchesMap)
                    .setSelectedMatchesObj(selectedMatchesMap)
                    .setTargetPatient(this.targetPatient);
                if (Object.keys(this.anglesMap).length > 0) {
                    this.chart.setXYCoords(this.anglesMap);
                }
                this.chart(container, this.filteredPatientMap);
                this.anglesMap = this.chart.getXYCoords();
            }
        },
        selectPatientsForGene(patients) {
            // Select all patients associated with the clicked gene
            this.selectMatches(patients);
        },
        selectMatches(matches = null) {
            if (matches && Array.isArray(matches) && matches.length === 0) {
                //select all the matches
                d3.selectAll('.selected-match').classed('selected-match', false);
                this.selectedMatches = [];
                this.$emit('selectMatch', []);
                //timeout to allow the chart to update
                setTimeout(() => {
                    this.drawChart();
                }, 10);
                return;
            }
            if (matches == null || !Array.isArray(matches)) {
                //get the data from the point with the selected-match class
                let selectedMatches = d3.selectAll('.selected-match').data();
                this.selectedMatches = selectedMatches;
                this.$emit('selectMatch', selectedMatches);
                //timeout to allow the chart to update
                setTimeout(() => {
                    this.drawChart();
                }, 10);
                return;
            }
            //otherwise we have an array of matches so we need to emit them
            this.selectedMatches = matches;
            this.$emit('selectMatch', matches);
            //timeout to allow the chart to update
            setTimeout(() => {
                this.drawChart();
            }, 10);
        },
        resetChart() {
            this.clearSelection();
            //reset the filters to default
            this.filterOptions = {
                showUndiagnosed: false,
                showGenesInCommonOnly: true,
                filterByRank: false,
                filterByScore: false,
                rankCutOff: 0,
                scoreCutOff: 0.0,
                populationFilter: 'both',
            },
            this.chartScalesFiltered = this.chartScales;
            this.filteredPatientMap = this.patientMap;
            this.applyFilters();
        },
        clearSelection() {
            //select all the matches
            d3.selectAll('.selected-match').classed('selected-match', false);
            //emit the empty array
            this.selectMatches([]);
        },
        selectRectangle(selectedMatches) {
            this.$emit('selectMatch', selectedMatches);
            //timeout to allow the chart to update
            setTimeout(() => {
                this.drawChart();
            }, 10);
        },
        zoomToSelect() {
            //get the selected matches and make them the only "filtered" matches
            let selectedMatches = d3.selectAll('.selected-match').data();
            let filteredPatientMap = {};
            let minOfPatients = 1;
            let maxOfPatients = 0;
            let newMinSimilartyScore = this.chartScales.xMin;
            let newMaxSimilartyScore = this.chartScales.xMax;
            for (let match of selectedMatches) {
                filteredPatientMap[match.id] = match;
                //if we get here then the patient passed all the filters so we need to update the min similarity score
                if (match.similarityScore && (parseFloat(match.similarityScore) < minOfPatients)) {
                    minOfPatients = parseFloat(match.similarityScore);
                }
                //update max
                if (match.similarityScore && (parseFloat(match.similarityScore) > maxOfPatients)) {
                    maxOfPatients = parseFloat(match.similarityScore);
                }
            }
            if (minOfPatients < 1) {
                this.chartScalesFiltered.xMin = minOfPatients;
            }
            else {
                this.chartScalesFiltered.xMin = newMinSimilartyScore;
            }
            if (maxOfPatients > 0) {
                this.chartScalesFiltered.xMax = maxOfPatients;
            }
            else {
                this.chartScalesFiltered.xMax = newMaxSimilartyScore;
            }
            this.filteredPatientMap = filteredPatientMap;
            this.zoomed = true;
            this.drawChart();
        },
        async applyFilters() {
            let filteredPatientMap = { ...this.patientMap };
            let ptWithGeneInCommon = {};
            let newSelectedMatches = [];
            let filterNeverFired = true;
            let newMinSimilartyScore = this.chartScales.xMin;
            let newMaxSimilartyScore = this.chartScales.xMax;
            let minOfPatients = 1;
            let maxOfPatients = 0;
            for (let patientId in this.patientMap) {
                if (!this.filterOptions.showUndiagnosed) {
                    filterNeverFired = false;
                    if (this.patientMap[patientId].dx === 'Undiagnosed') {
                        delete filteredPatientMap[patientId];
                        continue;
                    }
                    else {
                        //otherwise if the patient is part of the selected matches then we need to keep them in the new selected matches
                        if (this.selectedMatches && this.selectedMatches.includes(this.patientMap[patientId])) {
                            newSelectedMatches.push(this.patientMap[patientId]);
                        }
                    }
                }
                if (this.filterOptions.populationFilter !== 'both') {
                    filterNeverFired = false;
                    if (this.filterOptions.populationFilter === 'udn' && this.patientMap[patientId].id.startsWith('ORPHA:')) {
                        delete filteredPatientMap[patientId];
                        continue;
                    }
                    else if (this.filterOptions.populationFilter === 'orpha' && this.patientMap[patientId].id.startsWith('UDN:')) {
                        delete filteredPatientMap[patientId];
                        continue;
                    }
                }
                if (this.filterOptions.showGenesInCommonOnly) {
                    filterNeverFired = false;

                    if (this.patientMap[patientId].genesInCommon.length !== 0) {
                        ptWithGeneInCommon[patientId] = this.patientMap[patientId];
                    } else {
                        delete filteredPatientMap[patientId];
                        continue;
                    }
                }
                if (this.filterOptions.filterByRank) {
                    filterNeverFired = false;
                    let maxRank = this.filterOptions.rankCutOff;
                    if (this.patientMap[patientId].rank && (parseInt(this.patientMap[patientId].rank) > maxRank)) {
                        delete filteredPatientMap[patientId];
                        continue;
                    }
                    else {
                        //otherwise if the patient is part of the selected matches then we need to keep them in the new selected matches
                        if (this.selectedMatches && this.selectedMatches.includes(this.patientMap[patientId])) {
                            newSelectedMatches.push(this.patientMap[patientId]);
                        }
                    }
                }
                if (this.filterOptions.filterByScore) {
                    filterNeverFired = false;
                    let minScore = this.filterOptions.scoreCutOff;
                    if (this.patientMap[patientId].similarityScore && (parseFloat(this.patientMap[patientId].similarityScore) < minScore)) {
                        delete filteredPatientMap[patientId];
                        continue;
                    }
                    else {
                        //otherwise if the patient is part of the selected matches then we need to keep them in the new selected matches
                        if (this.selectedMatches && this.selectedMatches.includes(this.patientMap[patientId])) {
                            newSelectedMatches.push(this.patientMap[patientId]);
                        }
                    }
                }
                //if we get here then the patient passed all the filters so we need to update the min similarity score
                if (this.patientMap[patientId].similarityScore && (parseFloat(this.patientMap[patientId].similarityScore) < minOfPatients)) {
                    minOfPatients = parseFloat(this.patientMap[patientId].similarityScore);
                }
                //update max
                if (this.patientMap[patientId].similarityScore && (parseFloat(this.patientMap[patientId].similarityScore) > maxOfPatients)) {
                    maxOfPatients = parseFloat(this.patientMap[patientId].similarityScore);
                }
            }
            if (minOfPatients < 1) {
                this.chartScalesFiltered.xMin = minOfPatients;
            }
            else {
                this.chartScalesFiltered.xMin = newMinSimilartyScore;
            }
            if (maxOfPatients > 0) {
                this.chartScalesFiltered.xMax = maxOfPatients;
            }
            else {
                this.chartScalesFiltered.xMax = newMaxSimilartyScore;
            }
            //if the new selected matches is empty then we need to assign it to the previous selected matches
            if (newSelectedMatches.length === 0 && filterNeverFired === true && this.selectedMatches && this.selectedMatches.length > 0) {
                newSelectedMatches = this.selectedMatches;
            }
            else if (this.selectedMatches && this.selectedMatches.length === 0) {
                newSelectedMatches = [];
            }
            this.zoomed = false;

            //sort the filtered patient map my similarity score and then re-rank them
            let sortedFilteredPatientMap = Object.values(filteredPatientMap).sort((a, b) => {
                return parseFloat(b.similarityScore) - parseFloat(a.similarityScore);
            });

            //re-rank the patients
            for (let i = 0; i < sortedFilteredPatientMap.length; i++) {
                sortedFilteredPatientMap[i].rank = i + 1;
            }

            this.filteredPatientMap = filteredPatientMap;
            this.selectMatches(newSelectedMatches);
            this.drawChart();
        },
        selectFilter(filter) {
            if (filter == 'rank' && !this.filterOptions.filterByRank) {
                this.filterOptions.filterByRank = true;
                this.filterOptions.filterByScore = false;
                this.filterOptions.scoreCutOff = 0.0;
            }
            else if (filter == 'score' && !this.filterOptions.filterByScore) {
                this.filterOptions.filterByScore = true;
                this.filterOptions.filterByRank = false;
                this.filterOptions.rankCutOff = 0;
            }
            else {
                this.filterOptions.filterByRank = false;
                this.filterOptions.rankCutOff = 0;
                this.filterOptions.filterByScore = false;
                this.filterOptions.scoreCutOff = 0.0;
            }
        },
    },
    watch: {
        targetPatient: {
            handler: function (newVal) {
                if (newVal && newVal !== this.targetPatient) {
                    this.clearSelection();
                    this.anglesMap = {};

                    //clear the filters
                    this.filterOptions = {
                        showUndiagnosed: false,
                        showGenesInCommonOnly: true,
                        filterByRank: false,
                        filterByScore: false,
                        rankCutOff: 0,
                        scoreCutOff: 0.0,
                    },
                    
                    this.chartScalesFiltered = this.chartScales;
                    this.filteredPatientMap = this.patientMap;
                    this.applyFilters();
                }
            },
            deep: true
        },
        selectedMatchesProp: {
            handler: function (newVal) {
                if (newVal && newVal !== this.selectedMatches) {
                    this.selectedMatches = newVal;
                    this.drawChart();
                }
            },
            deep: true
        },
        hoveredFromMatches: {
            handler: function (newVal) {
                if (this.chart) {
                    this.chart.setHoveredFromMatches(newVal);
                    this.drawChart();
                }
            },
            deep: true
        },
        patientMap: {
            handler: function (newVal) {
                if (this.patientMap == null || this.patientMap !== newVal || newVal == null) {
                    //loading
                } else {
                    this.applyFilters();
                }
            },
            deep: true
        },
        chartScales: {
            handler: function () {
                if (this.chartScales) {
                    this.chartScalesFiltered = this.chartScales;
                    //timeout to allow the chart to update
                    setTimeout(() => {
                        this.drawChart();
                    }, 10);
                }
            },
            deep: true
        },
    },
    computed: {
      geneHits() {
        // Essentially we will look at the filteredPatient map and catch all the ones that have genes in common put those into a new list here
        let geneHits = [];
        if (this.filteredPatientMap) {
            for (let ptId in this.filteredPatientMap) {
                let pt = this.filteredPatientMap[ptId] || null;
                if (pt && pt.genesInCommon && pt.genesInCommon.length > 0) {
                    // Loop over the genes in common for this patient and add them to the geneHits list if they are not already there
                    for (let gene of pt.genesInCommon) {
                        let geneInList = geneHits.find(g => g.gene === gene.gene_symbol);
                        if (!geneInList) {
                            let geneObject = {
                                gene: gene.gene_symbol,
                                patients: [],
                                averageScore: 0
                            };
                            geneObject.patients.push(pt);
                            geneHits.push(geneObject);
                        // If the gene is already in the list, add the patient to the patients array for that gene
                        } else {
                            // The only way we get here is if the gene is already in the list so we can safely assume it exists
                            let existingGene = geneHits.find(g => g.gene === gene.gene_symbol);
                            existingGene.patients.push(pt);
                        }
                    }
                }
            }
        }    
        
        // Sort patients by simphenyScore and calculate average score for each gene based on top 2 patients' simphenyScores
        geneHits.forEach(geneHit => {
            // Sort patients by simphenyScore in descending order
            geneHit.patients.sort((a, b) => (b.simphenyScore || 0) - (a.simphenyScore || 0));
            
            let scores = geneHit.patients.map(pt => pt.simphenyScore).sort((x, y) => y - x);
            geneHit.averageScore = (scores[0] + (scores[1] || 0)) / (scores.length >= 2 ? 2 : 1);
        });
        
        // Sorting gene hits by the average simphenyScore of the top two patients for each gene (if just one then just that one score)
        geneHits.sort((a, b) => {
            return b.averageScore - a.averageScore;
        });

        // We need to make sure all these gene hits are still "in" the target patient's genes list
        if (this.targetPatient && this.targetPatient.genesList) {
            // All gene hits must be in the target patient's genes list (identified by gene_symbol) and that gene must have relevant == true
            geneHits = geneHits.filter(geneHit => {
                return this.targetPatient.genesList.some(gene => gene.gene_symbol === geneHit.gene && gene.relevant === true);
            });
        } 
        return geneHits;
      }  
    },
}

</script>

<style lang="sass">
    #chart-wrapper
        display: flex
        flex-direction: row
        justify-content: center
        align-items: center
        height: 100%
    #ranked-list-section
        height: 90%
        max-height: 50vh
        padding: 8px 8px 8px 20px
        display: flex
        width: 248px
        flex-shrink: 1
        #inner-section
            height: 100%
            border-radius: 8px
            overflow-y: auto
            width: 100%
            max-width: 220px
            padding: 5px
            box-shadow: 0px 2px 4px -1px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)), 0px 4px 5px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)), 0px 1px 10px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.12))
        .gene-hits-title
            text-align: center
            padding: 10px
        .gene-hit-item
            margin-bottom: 5px
            display: flex
            flex-direction: row
            justify-content: space-between
            align-items: center
            padding: 5px 10px
            border: 1px solid #D4DAD4
            border-radius: 5px
            cursor: pointer
            transition: all 0.2s ease-in-out
            &:hover
                background-color: #E6EBEF
                border-color: #19354D
                transform: translateY(-1px)
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1)
            .rank
                font-weight: bold
                font-size: 12pt
                color: #19354D
                margin-right: 10px
                align-self: flex-start
            .gene-hit-details
                display: flex
                flex-direction: column
                flex-grow: 1
                .gene-name
                    font-weight: bold
                    flex-basis: 40%
                    text-overflow: ellipsis
                    overflow: hidden
                    white-space: nowrap
                .avg-score
                    font-size: 10pt
                    color: gray
                .gene-and-count
                    display: flex
                    flex-direction: row
                    justify-content: space-between
                    align-items: center
                .patients-scores
                    flex-basis: 40%
                    display: flex
                    flex-wrap: wrap
                    align-items: center
                    .score-badge
                        background: #19354D
                        color: white
                        border-radius: 12px
                        padding: 0px 5px
                        margin: 2px
                        font-size: 10pt
                    .more-patients
                        font-size: 10pt
                        color: gray
                        border: 1px solid gray
                        border-radius: 12px
                        padding: 0px 5px
                .patient-count
                    text-align: left
                    font-size: 10pt
                    color: gray
                    margin-bottom: 5px
        .no-candidates-container
            display: flex
            flex-direction: column
            align-items: center
            justify-content: center
            padding: 20px
            height: 150px
            .no-candidates-text
                color: gray
                font-style: italic
                text-align: center
                margin-bottom: 15px
                font-size: 11pt
            .show-non-matches-btn
                background-color: #19354D
                color: white
                border: none
                border-radius: 5px
                padding: 3px 8px
                font-size: 10pt
                cursor: pointer
                display: flex
                align-items: center
                gap: 5px
                transition: all 0.2s ease-in-out
                &:hover
                    background-color: #2E5F8A
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1)
                .v-icon
                    font-size: 12pt
    .collapse-btn.radios
        cursor: pointer
        color: black
        width: 20px
        height: 20px
        display: inline-flex
        transform: translateY(5px)
        justify-content: center
        align-items: center
        border-radius: 50%
        &:hover
            background-color: #DCE1E5
            color: black
    #chart-key-hoverable
        position: absolute
        bottom: 5px
        left: 5px
        background-color: #19354D
        color: #E9EDEA
        border: 1px solid #E9EDEA
        border-radius: 50%
        width: 25px
        height: 25px
        display: flex
        flex-direction: column
        justify-content: center
        align-items: center
        cursor: pointer
        z-index: 2
        &:hover
            background-color: #2E5F8A
            border: 1px solid #DCE1E5
        .v-icon
            font-size: 14pt
    #chart-opt-and-button
        width: fit-content
        min-width: 50px
        height: 90%
        max-height: 700px
        display: flex
        flex-direction: column
        justify-content: flex-start
        align-items: flex-start
        align-self: center
        position: relative
    #chart-options-btn
        background-color: #19354D
        position: absolute
        top: -20px
        right: 0px
        border-radius: 50%
        height: 35px
        width: 35px
        z-index: 2
    #toggle-options-tip
        position: absolute
        top: 4px
        left: 36px
        color: white
        font-size: 10pt
        background-color: #464C49
        border-radius: 5px
        overflow: hidden
        width: 0px
        white-space: nowrap
        padding: 0px
        transition: all .3s ease-in-out
        &.shown
            width: 100px
            padding: 5px
    #chart-options-btn:hover
        box-shadow: 0px 2px 4px -1px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)), 0px 4px 5px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)), 0px 1px 10px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.12))
    #options-buttons
        display: flex
        flex-direction: row
        justify-content: center
        align-items: center
        width: 100%
        font-size: 11pt
        button:nth-of-type(1)
            background-color: #448849
            &:hover
                background-color: #85C189
                color: black
            &:disabled
                background-color: #D4DAD4
                font-style: italic
                color: gray
                cursor: not-allowed
        button:nth-of-type(2)
            background-color: red
            margin-left: 5px
            &:hover
                background-color: #FF5C5C
                color: black
    #chart-options-container
        position: relative
        top: 20px
        right: 10px
        border-radius: 5px
        display: flex
        flex-direction: column
        justify-content: flex-start
        align-items: center
        width: 250px
        height: fit-content
        max-height: 500px
        margin-left: 10px
        padding-top: 10px
        padding-bottom: 10px
        background-color: white
        opacity: 0.9
        overflow: hidden
        overflow-y: auto
        white-space: nowrap
        transition: all .45s ease-in-out
        box-shadow: 0px 2px 4px -1px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)), 0px 4px 5px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)), 0px 1px 10px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.12))
        #options-content
            display: flex
            flex-direction: column
            justify-content: space-between
            align-items: center
            text-align: center
            width: 85%
            .group
                width: 100%
                text-overflow: wrap
                display: flex
                flex-direction: column
                justify-content: center
                border: 1px solid #D4DAD4
                border-radius: 5px
                margin-top: 5px
                margin-bottom: 5px
                padding: 5px
            .zoom-to-select
                display: flex
                flex-direction: row
                justify-content: space-evenly
                align-items: center
                button
                    width: 40px
                    background-color: #19354D
                    &:hover
                        background-color: #2E5F8A
                    &:disabled
                        background-color: #D4DAD4
                        font-style: italic
                        color: gray
                        cursor: not-allowed
            .filter-num-input
                margin-top: 5px
                display: flex
                flex-direction: row
                justify-content: space-evenly
                align-items: center
                width: 50%
            #filter-by-radios
                .filterby-wrapper
                    width: 100%
                    display: flex
                    flex-direction: row
                    justify-content: space-evenly
                    label
                        line-height: 30px
            input
                margin-right: 5px
                cursor: pointer
            input:disabled
                cursor: not-allowed
                text-decoration: line-through
        #rank-filter, #score-filter
            width: 50%
            border: 1px solid #D4DAD4
            border-radius: 5px
            text-align: center
        button
            background-color: #2E5F8A
            color: white
            border: none
            border-radius: 5px
            padding: 5px
            width: 30%
            &:hover
                cursor: pointer
                background-color: #2E5F8A
    #chart-options-container.hidden
        width: 0px
        border: 0px solid transparent
        *
            overflow: hidden
    #linear-chart-container 
        height: 90%
        max-height: 700px
        background-color: rgb(255, 255, 255)
        display: flex
        flex-direction: column
        justify-content: center
        position: relative
        box-shadow: 0px 2px 4px -1px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)), 0px 4px 5px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)), 0px 1px 10px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.12))
        border-radius: 5px
        #lin-chart-viz 
            height: 100%
            width: fit-content
            display: flex
            flex-direction: column
            justify-content: center
        #lin-chart-alt-text 
            height: 80vh
            width: 80vh
            display: flex
            flex-direction: column
            justify-content: center
            p
                text-align: center
                font-size: large
    #lin-chart-tip 
        position: absolute
        visibility: hidden
        background-color: rgba(0, 0, 0, 0.7)
        color: white
        padding: 5px
        border-radius: 5px
        display: flex
        flex-direction: column
        justify-content: center
        align-items: start
        height: fit-content
        width: fit-content
        z-index: 3
        font-size: small
    fieldset
        border: 1px solid #D4DAD4
        border-radius: 5px
        padding: 5px
        legend
            padding: 0px 5px
            font-size: 12pt
</style>