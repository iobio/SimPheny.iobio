<template>
    <div id="linear-chart-container">
        <div ref="lin-chart-container" id="lin-chart-viz" v-if="targetPatient"></div>
        <div v-else id="lin-chart-alt-text">
            <p>No target patient defined.</p>
            <p>Input target patient to view matches.</p>
        </div>
        <div v-if="targetPatient && showLoading" id="loading-container"><p><v-icon class="loading-icon">mdi-loading</v-icon></p><p>loading matches...</p></div>
    </div>
    <div id="lin-chart-tip"></div>

    <button @click="showChartOptions = !showChartOptions" id="chart-options-btn">
        <v-icon color="white">mdi-dots-horizontal-circle-outline</v-icon>
    </button>

    <div id="chart-options-container" :class="{ hidden: showChartOptions === false}">
            <h3>Chart Options</h3>

            <div id="options-content">
                <div class="group">
                    <p>Show Undiagnosed</p>
                    <input v-model="filterOptions.showUndiagnosed" type="checkbox" name="" id="">
                </div>
                <div class="group">
                    <p>Genes In Common Only</p>
                    <input v-model="filterOptions.showGenesInCommonOnly" type="checkbox" name="" id="">
                </div>

                <div  class="group" id="filter-by-radios">
                    <p>Filter By:</p>
                    <div class="filterby-wrapper">
                        <div>
                            <input @click="selectFilter('rank')" type="radio" value="rank" name="filterBy">
                            <label for="rank">Rank</label>
                        </div>
                        <div class="filter-num-input">
                            <p>Max:</p>
                            <input 
                            v-model="filterOptions.rankCutOff" 
                            step="5" 
                            type="number" 
                            name="" 
                            id="rank-filter" 
                            :disabled="!filterOptions.filterByRank">
                        </div>

                    </div>
                    <div class="filterby-wrapper">
                        <div>
                            <input @click="selectFilter('score')" type="radio" value="score" name="filterBy">
                            <label for="score">Score</label> 
                        </div>
                        <div class="filter-num-input">
                            <p>Min: </p>
                            <input 
                            v-model="filterOptions.scoreCutOff" 
                            step=".1" 
                            type="number" 
                            name="" 
                            id="score-filter" 
                            :disabled="!filterOptions.filterByScore">
                        </div>
                    </div>                 
                </div>   
            </div>

            <div id="options-buttons">
                <button @click="applyFilters()">Apply</button>
                <button @click="resetChart()">Reset <v-icon>mdi-reload-alert</v-icon></button>
            </div>
    </div>
</template>

<script>
    import CircularChart from '../../d3/CircularChart.d3';
    import * as d3 from 'd3';

    export default {
        emits: ['selectMatch'],
        name: 'ChartViz',

        props: {
            targetPatient: Object,
            patientMap: Object,
            selectedMatches: Array,
            chartScales: Object,
        },
        data: function() {
            return {
                chart: null,
                resizeObserver: null,
                showLoading: true,
                showChartOptions: true,
                chartScalesFiltered: this.chartScales,
                filteredPatientMap: this.patientMap,
                filterOptions: {
                    showUndiagnosed: true,
                    showGenesInCommonOnly: false,
                    filterByRank: false,
                    filterByScore: false,
                    rankCutOff: 0,
                    scoreCutOff: 0.0,
                },
                anglesMap: null,
            }
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
            validateRank() {
                let minRank = 1;
                let maxRank = this.filteredPatientMap.keys().length;
            },
            validateScore() {
                let minScore = 0;
                let maxScore = 1;
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

                    this.chart = CircularChart()
                        .setSize(height)
                        .setSelectedMatches(this.selectedMatches)
                        .setXMax(this.chartScalesFiltered.xMin)
                        .setXMin(1-((1-this.chartScalesFiltered.xMax)/2))
                        .onMatchSelected(this.selectMatch)
                        .onRectangleSelected(this.selectRectangle);

                    if (this.anglesMap) {
                        this.chart.setXYCoords(this.anglesMap);
                    }

                    this.chart(container, this.filteredPatientMap);
                    this.anglesMap = this.chart.getXYCoords();
                }
            },
            selectMatch(matches=null) {
                if (matches == null || typeof matches !== 'array') {
                    //get the data from the point with the selected-match class
                    let selectedMatches = d3.selectAll('.selected-match').data();
                    this.$emit('selectMatch', selectedMatches);
                } else {
                    this.$emit('selectMatch', matches);
                }
            },
            resetChart() {
                this.$emit('selectMatch', []);
                //reset the filters to default
                this.filterOptions.showUndiagnosed = true;
                this.filterOptions.showGenesInCommonOnly = false;
                this.filterOptions.filterByRank = false;
                this.filterOptions.filterByScore = false;
                this.filterOptions.rankCutOff = 0;
                this.filterOptions.scoreCutOff = 0.0;
                this.chartScalesFiltered = this.chartScales;
                this.filteredPatientMap = this.patientMap;

                this.applyFilters();
            },
            clearSelection() {
                this.$emit('selectMatch', []);
            },
            selectRectangle(selectedMatches){
                this.$emit('selectMatch', selectedMatches);
                //timeout to allow the chart to update
                setTimeout(() => {
                    this.drawChart();
                }, 10);
            },
            applyFilters() {
                let filteredPatientMap = { ...this.patientMap };
                let newSelectedMatches = [];
                let filterNeverFired = true;
                let newMinSimilartyScore = this.chartScales.xMin
                let newMaxSimilartyScore = this.chartScales.xMax
                let minOfPatients = 1;
                let maxOfPatients = 0;

                for (let patientId in this.patientMap) {
                    if (!this.filterOptions.showUndiagnosed){
                        filterNeverFired = false;
                        if (this.patientMap[patientId].dx === 'undiagnosed') {
                            delete filteredPatientMap[patientId];
                            continue;
                        } else {
                            //otherwise if the patient is part of the selected matches then we need to keep them in the new selected matches
                            if (this.selectedMatches.includes(this.patientMap[patientId])) {
                                newSelectedMatches.push(this.patientMap[patientId]);
                            }
                        }
                    }
                    if (this.filterOptions.showGenesInCommonOnly){
                        filterNeverFired = false;
                        if (this.patientMap[patientId].genesInCommon.length === 0) {
                            delete filteredPatientMap[patientId];
                            continue;
                        } else {
                            //otherwise if the patient is part of the selected matches then we need to keep them in the new selected matches
                            if (this.selectedMatches.includes(this.patientMap[patientId])) {
                                newSelectedMatches.push(this.patientMap[patientId]);
                            }
                        }
                    }
                    if (this.filterOptions.filterByRank){
                        filterNeverFired = false;
                        let maxRank = this.filterOptions.rankCutOff;
                        if (this.patientMap[patientId].rank && (parseInt(this.patientMap[patientId].rank) > maxRank)) {
                            delete filteredPatientMap[patientId];
                            continue;
                        } else {
                            //otherwise if the patient is part of the selected matches then we need to keep them in the new selected matches
                            if (this.selectedMatches.includes(this.patientMap[patientId])) {
                                newSelectedMatches.push(this.patientMap[patientId]);
                            }
                        }
                    }
                    if (this.filterOptions.filterByScore){
                        filterNeverFired = false;
                        let minScore = this.filterOptions.scoreCutOff;
                        if (this.patientMap[patientId].similarityScore && (parseFloat(this.patientMap[patientId].similarityScore) < minScore)) {
                            delete filteredPatientMap[patientId];
                            continue;
                        } else {
                            //otherwise if the patient is part of the selected matches then we need to keep them in the new selected matches
                            if (this.selectedMatches.includes(this.patientMap[patientId])) {
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
                } else {
                    this.chartScalesFiltered.xMin = newMinSimilartyScore;
                }

                if (maxOfPatients > 0) {
                    this.chartScalesFiltered.xMax = maxOfPatients;
                } else {
                    this.chartScalesFiltered.xMax = newMaxSimilartyScore;
                }

                //if the new selected matches is empty then we need to assign it to the previous selected matches
                if (newSelectedMatches.length == 0 && filterNeverFired == true) {
                    newSelectedMatches = this.selectedMatches;
                }

                this.filteredPatientMap = filteredPatientMap;
                this.selectMatch(newSelectedMatches);
                this.drawChart();
            },
            selectFilter(filter) {
                if (filter == 'rank') {
                    this.filterOptions.filterByRank = true;
                    this.filterOptions.filterByScore = false;
                } else if (filter == 'score') {
                    this.filterOptions.filterByRank = false;
                    this.filterOptions.filterByScore = true;
                }
            },
        },
        watch: {
            patientMap: {
                handler: function(newVal) {
                    if (this.patientMap == null) {
                        //loading
                    } else {
                        this.applyFilters();
                        this.showLoading = false;
                    } 
                },
                deep: true
            },
            chart: {
                handler: function() {
                    if (!this.chart) {
                        this.showLoading = true;
                    } else {
                        this.showLoading = false;
                    }
                },
                deep: true
            },
            chartScales: {
                handler: function() {
                    if (this.chartScales) {
                        this.chartScalesFiltered = this.chartScales;
                        this.drawChart();
                    }
                },
                deep: true
            }
        }
    }

</script>

<style lang="sass">
    #chart-options-btn
        background-color: #21351f
        position: absolute
        top: 55px
        right: 20px
        border-radius: 50%
        height: 35px
        width: 35px
        z-index: 2
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
        button:nth-of-type(2)
            background-color: red
            margin-left: 5px
            &:hover
                background-color: #FF5C5C
    #chart-options-container
        border-radius: 5px
        display: flex
        flex-direction: column
        justify-content: space-evenly
        align-items: center
        width: 30%
        max-width: 310px
        height: 90%
        max-height: 500px
        margin-left: 10px
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
            .filter-num-input
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
        *
            overflow: hidden
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
        #loading-container
            height: 80vh
            max-height: 700px
            width: 80vh
            max-width: 700px
            display: flex
            flex-direction: column
            align-items: center
            p:nth-of-type(2)
                text-align: center
                font-size: large
                transform: translate(0px, -10px)
            p:nth-of-type(1)
                transform: translate(15px, 0px)
            .loading-icon
                font-size: 50px
                transform: translate(100px, -10px)
                animation: spin 1s linear infinite
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
    @keyframes spin 
        from 
            transform: translate(-50%, -50%) rotate(0deg)
        to 
            transform: translate(-50%, -50%) rotate(360deg) 
</style>