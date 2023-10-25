<script>
    export default {
        name: 'LeftBar',
        props: {
            
        },
        data: function() {
            return {
                showLeftBar: true,
            }
        },
        methods: {

        },
    }
</script>

<template>
    <div class="section-container left-bar">
        <div id="left-bar-container" :class="{ expanded: showLeftBar, collapsed: !showLeftBar}"></div>

        <div class="button-container left-bar" :class="{ expanded: showLeftBar, collapsed: !showLeftBar}">
            <v-btn icon @click="showLeftBar = !showLeftBar" class="btn umbrella" height="35px" width="35px" color="#21351f">
                <v-tooltip offset="3" location="right" activator="parent">
                    <span v-if="!showLeftBar">Open target pt details</span>
                    <span v-if="showLeftBar">Close target pt details</span>
                </v-tooltip>
                <v-icon v-if="showLeftBar" color="white">mdi-arrow-left-circle-outline</v-icon>
                <v-icon v-if="!showLeftBar" color="white">mdi-arrow-right-circle-outline</v-icon>
            </v-btn>
        </div>
    </div>
</template>

<style>
    .section-container.left-bar {
        height: 100%;
        width: fit-content;
        background-color: transparent;
        display: flex;
        flex-direction: row;

        position: relative;
    }

    #left-bar-container {
        height: 100%;
        transition: all .45s ease-in-out;
    }

    #left-bar-container.collapsed {
        width: 0px;
        border-right: 0px solid transparent;
        margin: 0;
        padding: 0;
    }
    #left-bar-container.expanded {
        width: 30vw;
        border-right: 2px solid #21351f;
        box-shadow: 5px 0px 5px -2px rgba(0,0,0,0.2);
    }
    .button-container.left-bar {
        height: 100%;
        width: 35px;
        background-color: transparent;

        top: 0;
        right: -45px;
        position: absolute;
        overflow: visible;
        transition: all .45s ease-in-out;
    }
    .button-container.left-bar.expanded {
        right: 10px;
    }
    .btn.umbrella {
        z-index: 9990;

        margin-top: 53px;
        height: 35px;
        width: 35px;
        position: absolute;
    }

</style>