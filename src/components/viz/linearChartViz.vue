<template>
    <div id="linear-chart-container">
        <button @click="showChartOptions = !showChartOptions" id="chart-options-btn">
            <v-icon color="white">mdi-dots-horizontal-circle-outline</v-icon>
        </button>

        <div id="chart-options-container" :class="{ hidden: showChartOptions === false}">
                <h3>Chart Options</h3>
                <p>Show/Hide Undiagnosed</p>
                <p>Use Genes In Common</p>
                <p>Filter By</p>
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

                    this.linearChart(container, this.targetPatient, this.patientMap);
                }
            },
            selectMatch() {
                //get the data from the point with the selected-match class
                let selectedMatch = d3.select('.selected-match').data()[0];
                this.$emit('selectMatch', selectedMatch);
            }
        },
        watch: {
            patientMap: function(newVal, oldVal) {
                if (newVal != null) {
                    this.showLoading = false;
                } else if (newVal == null || newVal == undefined) {
                    this.showLoading = true;
                }
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
        #chart-options-container.hidden
            height: 0px
            width: 0px
            border: 0px solid transparent
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