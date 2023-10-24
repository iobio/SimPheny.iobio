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
    <div id="left-bar-container" :class="{ expanded: showLeftBar, collapsed: !showLeftBar}">
        <v-btn icon @click="showLeftBar = !showLeftBar" class="btn umbrella">
            <v-tooltip offset="3" location="bottom" activator="parent">
                <span v-if="!showLeftBar">Open patient details</span>
                <span v-if="showLeftBar">Close patient details</span>
            </v-tooltip>
            <v-icon v-if="showLeftBar">mdi-umbrella-outline</v-icon>
            <v-icon v-if="!showLeftBar">mdi-umbrella-closed-outline</v-icon>
        </v-btn>
    </div>
</template>

<style>
    #left-bar-container {
        position: relative;
        height: 100%;
        transition: all .5s ease-in-out;
    }

    #left-bar-container.collapsed {
        width: 60px;
        border-right: 2px solid transparent;
    }
    #left-bar-container.expanded {
        width: 350px;
        border-right: 2px solid #21351f;
        box-shadow: 5px 0px 5px -2px rgba(0,0,0,0.2);
    }
    .btn.umbrella {
        z-index: 9990;
        margin-top: 52px;
        margin-right: 5px;
        position: absolute;
        top: 0;
        right: 0;
    }
</style>