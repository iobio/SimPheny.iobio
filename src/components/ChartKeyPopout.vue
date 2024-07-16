<template>
    <p id="chart-key-popout" :class="{show: showChartKey}">
    <span>
        <svg height="10" width="10">
            <circle cx="5" cy="5" r="4" style="fill:#90E0FF; stroke: #0089BF;"></circle>
        </svg>
        / 
        <svg height="10" width="10">
            <circle cx="5" cy="5" r="4" style="fill:#8B817E; stroke: #403B3A;"></circle>
        </svg> 
        /
        <svg height="10" width="10">
            <circle cx="5" cy="5" r="4" style="fill:#B2BEC3; stroke: #7D98A1;"></circle>
        </svg> 
        UDN/Orphanet/ Decipher (no genes match)
    </span>
    <span>
        <svg height="15" width="15">
            <polygon points="7.5,0.75 3,14.25 14.25,5.625 0.75,5.625 12,14.25" style="fill:#FF0000; stroke: #FF0000;"></polygon>
        </svg>
         Gene match
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
        background-color: white
        top: 18px
        right: 18px
        transition: all .45s ease-in-out
    #chart-key-popout.show
        height: 100px
        width: 100px
        padding: 5px
        border: 1px solid #E9EDEA
        color: #21351F
</style>