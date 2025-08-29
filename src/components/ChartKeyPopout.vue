<template>
    <p id="chart-key-popout" :class="{ show: showChartKey }">
        <span>
            <svg height="15" width="15">
                <polygon
                    points="7.5,0.75 3,14.25 14.25,5.625 0.75,5.625 12,14.25"
                    style="fill: #ff0000; stroke: #ff0000"></polygon>
            </svg>
            Gene match
        </span>
    </p>
</template>

<script>
export default {
    name: "ChartKeyPopout",
    props: {
        showChartKey: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style lang="sass">
#chart-key-popout
    display: flex
    flex-direction: column
    justify-content: center
    align-items: start
    font-size: 9pt
    border-radius: 5px
    width: 0px
    height: 0px
    padding: 0px
    overflow: hidden
    position: absolute
    background-color: white
    bottom: 18px
    left: 18px
    transition: all .45s ease-in-out
#chart-key-popout.show
    height: 50px
    width: 100px
    padding: 5px
    border: 1px solid #E9EDEA
    color: #21351F
</style>
