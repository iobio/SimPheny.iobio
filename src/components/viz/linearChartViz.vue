<template>
    <div id="linear-chart-container">
        <button @click="showChartOptions = !showChartOptions" id="chart-options-btn">
            <v-icon color="white">mdi-dots-horizontal-circle-outline</v-icon>
        </button>

        <div id="chart-options-container" :class="{ hidden: showChartOptions === false}">
                <h3>Chart Options</h3>
                <p>Show Undiagnosed <input v-model="filterOptions.showUndiagnosed" type="checkbox" name="" id=""></p>
                <p>Use Genes In Common <input v-model="filterOptions.useGenesInCommon" type="checkbox" name="" id=""></p>
                <p>Filter By:
                        <br>
                        <input @click="selectFilter('rank')" type="radio" value="rank" name="filterBy">
                        <label for="rank">Rank</label>
                        <input @click="selectFilter('score')" type="radio" value="score" name="filterBy">
                        <label for="score">Score</label> 
                        <br>
                        <span v-if="filterOptions.filterByRank">Max Rank: </span><input v-if="filterOptions.filterByRank" v-model="filterOptions.rankCutOff" type="number" name="" id="rank-filter">
                        <span v-if="filterOptions.filterByScore">Min Score: </span><input v-if="filterOptions.filterByScore" v-model="filterOptions.scoreCutOff" type="number" name="" id="score-filter">
                </p>
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
                showLoading: this.patientMap,
                showChartOptions: false,
                filteredPatientMap: this.patientMap,
                filterOptions: {
                    showUndiagnosed: true,
                    useGenesInCommon: true,
                    filterByRank: false,
                    filterByScore: false,
                    rankCutOff: 0,
                    scoreCutOff: 0,
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
                    .setXMax(this.chartScales.xMin)
                    .setXMin(this.chartScales.xMax)
                    .setYMax(this.chartScales.yMax)
                    .setYMin(this.chartScales.yMin);

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
            }
        },
        watch: {
            patientMap: {
                handler: function(newVal, oldVal) {
                    if (!this.patientMap && (newVal == null || newVal == undefined)) {
                        this.showLoading = true;
                    } else if (this.patientMap) {
                        this.applyFilters();
                        this.showLoading = false;
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
            top: 0px
            right: 0px
            border-radius: 5px
            display: flex
            flex-direction: column
            justify-content: space-evenly
            align-items: center
            border: 1px solid #D4DAD4
            width: 55%
            height: 100%
            background-color: #F0F0F0
            opacity: 0.9
            transition: all .45s ease-in-out
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