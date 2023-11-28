<template>
    <p id="chart-key-popout" :class="{show: showChartKey}">
    <span>
        <svg height="8" width="8">
            <rect x="1" y="1" width="6" height="6" style="fill:rgb(218, 180, 237); stroke: rgb(116, 4, 172);"></rect>
        </svg>
        = Diagnosed
    </span>
    <span>
        <svg height="8" width="8">
            <rect x="1" y="1" width="6" height="6" style="fill:rgb(9, 9, 9); stroke: rgb(14, 14, 14);"></rect>
        </svg>
        = Clinical Dx Only
    </span>
    <span>
        <svg height="8" width="8">
            <circle cx="4" cy="4" r="3" style="fill:rgb(189, 74, 247); stroke: rgb(116, 4, 172);"></circle>
        </svg>
        = Undiagnosed
    </span>
    <span>
        <svg height="10" width="10">
            <circle cx="5" cy="5" r="4" style="fill:rgb(201, 153, 225); stroke: rgb(116, 4, 172);"></circle>
        </svg> /
        <svg height="10" width="10">
            <rect x="1" y="1" width="8" height="8" style="fill:rgb(201, 153, 225); stroke: rgb(116, 4, 172);"></rect>
        </svg>
        = Genes in Common
    </span>
</p>
</template>

<script>
export default {
    name: 'ChartKeyPopout',
    props: {
        showChartKey: {
            type: Boolean,
            default: false
        }
    }
}
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
        top: 18px
        right: 18px
        transition: all .45s ease-in-out
    #chart-key-popout.show
        height: 100px
        width: 160px
        padding: 5px
        border: 1px solid #E9EDEA
        color: #21351F
</style>