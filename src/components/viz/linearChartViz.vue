<template>
    <div id="linear-chart-container">
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
                        <p>Use Genes In Common</p>
                        <input v-model="filterOptions.useGenesInCommon" type="checkbox" name="" id="" disabled="true">
                    </div>

                    
                    <div  class="group" id="filter-by-radios">
                        <p>Filter By:</p>
                        <div>
                            <input @click="selectFilter('rank')" type="radio" value="rank" name="filterBy">
                            <label for="rank">Rank</label>
                        </div>
                        <div>
                            <input @click="selectFilter('score')" type="radio" value="score" name="filterBy">
                            <label for="score">Score</label>  
                        </div>                 
                    </div>   

                    <div class="filter-num-input group">
                        <p>Max Rank: </p>
                        <input v-model="filterOptions.rankCutOff" step="5" type="number" name="" id="rank-filter" :disabled="!filterOptions.filterByRank">
                    </div>

                    <div class="filter-num-input group">
                        <p>Min Score: </p>
                        <input v-model="filterOptions.scoreCutOff" step=".1" type="number" name="" id="score-filter" :disabled="!filterOptions.filterByScore">
                    </div>
                </div>

                <button @click="applyFilters()">Apply</button>
        </div>

        <div ref="lin-chart-container" id="lin-chart-viz" @click="selectMatch" v-if="targetPatient"></div>
        <div v-else id="lin-chart-alt-text">
            <p>No target patient defined.</p>
            <p>Input target patient to view matches.</p>
        </div>
        <div v-if="targetPatient && showLoading" id="loading-container"><v-icon class="loading-icon">mdi-loading</v-icon><p>loading matches...</p></div>
    </div>
    <div id="lin-chart-tip"></div>
</template>

<script>
    import LinearChart from '../../d3/linearChart.d3';
    import * as d3 from 'd3';

    export default {
        emits: ['selectMatch'],
        name: 'LinearChartViz',

        props: {
            targetPatient: Object,
            patientMap: Object,
            selectedMatch: Object,
            chartScales: Object,
        },
        data: function() {
            return {
                linearChart: null,
                resizeObserver: null,
                showLoading: true,
                showChartOptions: false,
                chartScalesFiltered: this.chartScales,
                filteredPatientMap: this.patientMap,
                filterOptions: {
                    showUndiagnosed: true,
                    useGenesInCommon: true,
                    filterByRank: false,
                    filterByScore: false,
                    rankCutOff: 0,
                    scoreCutOff: 0.0,
                }
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

                this.drawChart();
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
                this.drawChart();
            }
        },
        beforeDestroy() {
            //remove the resize observer if it exists
            if (this.resizeObserver != null) {
                this.resizeObserver.unobserve(linChartContainer);
            }
        },
        methods: {
            drawChart() {
                let container = this.$refs['lin-chart-container'];

                //clear the chart if it already exists
                if (this.linearChart) {
                    //clear container
                    d3.select(container).selectAll("*").remove();
                }

                if (container != null && this.targetPatient && this.chartScales) {
                    //width is based on the width of the container
                    let width = container.clientWidth;

                    this.linearChart = LinearChart()
                    .setWidth(width)
                    .setSelectedMatch(this.selectedMatch)
                    .setXMax(this.chartScalesFiltered.xMin)
                    .setXMin(this.chartScalesFiltered.xMax)
                    .setYMax(this.chartScalesFiltered.yMax)
                    .setYMin(this.chartScalesFiltered.yMin);

                    this.linearChart(container, this.targetPatient, this.filteredPatientMap);
                }
            },
            selectMatch() {
                //get the data from the point with the selected-match class
                let selectedMatch = d3.select('.selected-match').data()[0];
                this.$emit('selectMatch', selectedMatch);
            },
            applyFilters() {
                let filteredPatientMap = { ...this.patientMap };
                let newMinSimilartyScore = this.chartScales.xMin
                let newMaxSimilartyScore = this.chartScales.xMax
                let minOfPatients = 1;
                let maxOfPatients = 0;

                for (let patientId in this.patientMap) {
                    if (!this.filterOptions.showUndiagnosed){
                        if (this.patientMap[patientId].dx === 'undiagnosed') {
                            delete filteredPatientMap[patientId];
                            continue;
                        }
                    }
                    if (this.filterOptions.filterByRank){
                        let maxRank = this.filterOptions.rankCutOff;
                        if (this.patientMap[patientId].rank && (parseInt(this.patientMap[patientId].rank) > maxRank)) {
                            delete filteredPatientMap[patientId];
                            continue;
                        }
                    }
                    if (this.filterOptions.filterByScore){
                        let minScore = this.filterOptions.scoreCutOff;
                        if (this.patientMap[patientId].similarityScore && (parseFloat(this.patientMap[patientId].similarityScore) < minScore)) {
                            delete filteredPatientMap[patientId];
                            continue;
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

                this.filteredPatientMap = filteredPatientMap;

                this.drawChart();
                this.showChartOptions = false;
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
                    if (newVal == null) {
                        this.showLoading = true;
                    } else {
                        this.applyFilters();
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
    #linear-chart-container 
        height: 90%
        max-height: 500px
        width: 80%
        background-color: rgb(255, 255, 255)
        display: flex
        flex-direction: column
        justify-content: center
        position: relative

        border-radius: 5px
        #chart-options-btn
            background-color: #21351f
            position: absolute
            top: 0px
            right: -45px
            border-radius: 50%
            height: 35px
            width: 35px
            z-index: 2
        #chart-options-btn:hover
            box-shadow: 0px 2px 4px -1px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)), 0px 4px 5px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)), 0px 1px 10px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.12))
        #chart-options-container
            position: absolute
            top: 2px
            right: -7px
            border-radius: 5px
            display: flex
            flex-direction: column
            justify-content: space-evenly
            align-items: center
            border: 1px solid #D4DAD4
            width: 55%
            max-width: 500px
            height: 98%
            background-color: white
            opacity: 0.96
            transition: all .45s ease-in-out
            box-shadow: 0px 2px 4px -1px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2)), 0px 4px 5px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.14)), 0px 1px 10px 0px var(--v-shadow-key-penumbra-opacity, rgba(0, 0, 0, 0.12))
            #options-content
                display: flex
                flex-direction: column
                justify-content: space-between
                align-items: center
                text-align: center
                width: 70%
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
                    flex-direction: column
                    justify-content: center
                    align-items: center
                #filter-by-radios
                    div
                        width: 100%
                        display: flex
                        flex-direction: row
                        justify-content: center
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
        #lin-chart-viz 
            height: 100%
            width: 100%
            display: flex
            flex-direction: column
            justify-content: center
        #lin-chart-alt-text 
            height: 100%
            width: 100%
            display: flex
            flex-direction: column
            justify-content: center
            p
                text-align: center
                font-size: large
        #loading-container
            position: absolute
            top: 50%
            left: 45%
            display: flex
            flex-direction: column
            justify-content: center
            align-items: center
            p
                text-align: center
                font-size: large
                transform: translate(-20px, -10px)
            .loading-icon
                font-size: 50px
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