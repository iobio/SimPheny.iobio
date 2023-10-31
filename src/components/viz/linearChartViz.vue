<template>
    <div id="linear-chart-container">
        <div ref="lin-chart-container" id="lin-chart-viz" @click="selectMatch" v-if="targetPatient"></div>
        <div v-else id="lin-chart-alt-text">
            <p>No target patient defined.</p>
            <p>Input target patient to view matches.</p>
        </div>
        <div id="lin-chart-tip"></div>
    </div>

</template>

<script>
    import LinearChart from '../../d3/linearChart.d3';
    import * as d3 from 'd3';

    export default {
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

        border-radius: 5px
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
        #lin-chart-tip 
            position: absolute
            visibility: hidden
            background-color: rgba(0, 0, 0, 0.8)
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