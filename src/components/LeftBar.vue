<script>
    export default {
        name: 'LeftBar',
        props: {
            showLeftBar: {
                type: Boolean,
                default: true
            }
            
        },
        data: function() {
            return {
            
            }
        },
        methods: {

        },
    }
</script>

<template>
    <div class="section-container left-bar">
        <div id="left-bar-container" :class="{ expanded: showLeftBar, collapsed: !showLeftBar}"></div>

        <div class="button-container left-bar">
            <v-btn icon @click="showLeftBar = !showLeftBar" class="btn umbrella" height="35px" width="35px" color="#21351f">
                <v-tooltip offset="3" location="bottom" activator="parent">
                    <span v-if="!showLeftBar">Open patient details</span>
                    <span v-if="showLeftBar">Close patient details</span>
                </v-tooltip>
                <v-icon v-if="showLeftBar" color="white">mdi-umbrella-outline</v-icon>
                <v-icon v-if="!showLeftBar" color="white">mdi-umbrella-closed-outline</v-icon>
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
        width: 27vw;
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
    }
    .btn.umbrella {
        z-index: 9990;

        margin-top: 53px;
        height: 35px;
        width: 35px;
        position: absolute;
    }
</style>