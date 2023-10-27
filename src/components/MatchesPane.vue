<script> 
    import LinearChartViz from './viz/linearChartViz.vue';
  export default {
    name: 'MatchesPane',
    components: {
        LinearChartViz,
    }, 
    props: {
        targetPatient: Object,
        patientMap: Object,
    },
    data: function() {
      return {
        showDetailsBar: false,
      }
    },
  }
</script>

<template>
    <div id="matches-container">
        <div class="upper matches">
            <h1 class="section-head">Chart</h1>
            <LinearChartViz
                :targetPatient="targetPatient"
                :patientMap="patientMap"></LinearChartViz>
        </div>

        <div id="lower-container">
            <div class="lower matches" :class="{ expanded: showDetailsBar, collapsed: !showDetailsBar}">
                <h1 class="section-head">Selected Match</h1>
            </div>

            <div class="button-container matches">
            <v-btn icon @click="showDetailsBar = !showDetailsBar" :class="{ expanded: showDetailsBar, collapsed: !showDetailsBar}" class="btn umbrella matches" height="35px" width="35px" color="#21351f">
                <v-tooltip offset="3" location="right" activator="parent">
                    <span v-if="!showDetailsBar">Expand match details</span>
                    <span v-if="showDetailsBar">Collapse match details</span>
                </v-tooltip>
                <v-icon v-if="showDetailsBar" color="white">mdi-arrow-down-circle-outline</v-icon>
                <v-icon v-if="!showDetailsBar" color="white">mdi-arrow-up-circle-outline</v-icon>
            </v-btn>
        </div>
        </div>
    </div>
</template>

<style>
    #matches-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }

    .upper.matches {
        flex-grow: 1;
        width: 100%;
        background-color: #e9ede9;
        padding-top: 48px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    #lower-container {
        width: 100%;
        height: fit-content;
        position: relative;
    }

    .lower.matches {
        width: 100%;
        transition: all .45s ease-in-out;
    }

    .lower.matches.expanded {
        height: 40vh;
        border-top: 2px solid #21351f;
        box-shadow: 0px -5px 5px -2px rgba(0,0,0,0.2);
    }

    .lower.matches.collapsed {
        height: 0vh;
        border-top: 0px solid transparent;
        overflow: hidden;
    }

    .button-container.matches {
        width: 100%;
        height: 35px;
        background-color: transparent;

        top: -45px;
        left: 0;
        position: absolute;
        overflow: visible;
    }
    .btn.umbrella.matches {
        z-index: 9990;
        top: -58px;
        left: 10px;

        height: 35px;
        width: 35px;
        position: absolute;
        transition: all .45s ease-in-out;
    }

    .btn.umbrella.matches.expanded {
        top: 55px;
        left: 10px;
    }

    .btn.umbrella.matches.collapsed {
        top: 0px;
        left: 10px;
    }

</style>