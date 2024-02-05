<template>
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
    
    <div id="lin-chart-tip"></div>

    <button @mouseenter="showToggleOptTip" @mouseleave="unshowToggleOptTip" @click="showChartOptions = !showChartOptions" id="chart-options-btn">
        <v-icon color="white">mdi-dots-horizontal-circle-outline</v-icon>
        <span id="toggle-options-tip">Chart Options</span>
    </button>

    <div id="chart-options-container" :class="{ hidden: showChartOptions === false}">
            <h3>Chart Options</h3>

            <div id="options-content">
                <div class="group">
                    <p>Genes In Common Only</p>
                    <input v-model="filterOptions.showGenesInCommonOnly" type="checkbox" name="" id="">
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
                            <label for="rank">Rank</label>
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
                            <label for="score">Score</label> 
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
    },
    data: function () {
        return {
            chart: null,
            resizeObserver: null,
            showChartOptions: true,
            showChartKey: false,
            selectedMatches: this.selectedMatchesProp,
            chartScalesFiltered: this.chartScales,
            filteredPatientMap: this.patientMap,
            filterOptions: {
                showUndiagnosed: false,
                showGenesInCommonOnly: false,
                filterByRank: false,
                filterByScore: false,
                rankCutOff: 0,
                scoreCutOff: 0.0,
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
                    .setSelectedMatchesObj(selectedMatchesMap);
                if (Object.keys(this.anglesMap).length > 0) {
                    this.chart.setXYCoords(this.anglesMap);
                }
                this.chart(container, this.filteredPatientMap);
                this.anglesMap = this.chart.getXYCoords();
            }
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
                showGenesInCommonOnly: false,
                filterByRank: false,
                filterByScore: false,
                rankCutOff: 0,
                scoreCutOff: 0.0,
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
        applyFilters() {
            let filteredPatientMap = { ...this.patientMap };
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
                if (this.filterOptions.showGenesInCommonOnly) {
                    filterNeverFired = false;
                    if (this.patientMap[patientId].genesInCommon.length === 0) {
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
                        showGenesInCommonOnly: false,
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
}

</script>

<style lang="sass">
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
            background-color: #85C189
            color: black
    #chart-key-hoverable
        position: absolute
        top: 5px
        right: 5px
        background-color: #21351f
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
            color: #21351F
            background-color: #E9EDE8
            border: 1px solid #21351F
        .v-icon
            font-size: 14pt
    #chart-options-btn
        background-color: #21351f
        position: absolute
        top: 55px
        right: 20px
        border-radius: 50%
        height: 35px
        width: 35px
        z-index: 2
    #toggle-options-tip
        position: absolute
        top: 4px
        right: 36px
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
            background-color: #21351f
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
        border-radius: 5px
        display: flex
        flex-direction: column
        justify-content: flex-start
        align-items: center
        width: 30%
        max-width: 310px
        height: fit-content
        max-height: 500px
        margin-left: 10px
        padding-top: 10px
        padding-bottom: 10px
        background-color: white
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
                    &:hover
                        background-color: #85C189
                        color: black
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
            background-color: #21351f
            color: white
            border: none
            border-radius: 5px
            padding: 5px
            width: 30%
            &:hover
                cursor: pointer
                background-color: #1a2e1a
    #chart-options-container.hidden
        height: 0px
        width: 0px
        border: 0px solid transparent
        button
            display: none
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

        font-size: small
</style>