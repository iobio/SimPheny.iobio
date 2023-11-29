<template>
    <div id="chart-options-container" :class="{ hidden: showComponent === false}">
            <h3>Chart Options</h3>

            <div id="options-content">
                <div class="group">
                    <p>Show Undiagnosed</p>
                    <input v-model="filterOptions.showUndiagnosed" type="checkbox" name="" id="">
                </div>

                <div class="group">
                    <p>Genes In Common Only</p>
                    <input v-model="filterOptions.showGenesInCommonOnly" type="checkbox" name="" id="">
                </div>

                <div  class="group" id="filter-by-radios">
                    <p>Filter By</p>

                    <div class="filterby-wrapper">
                        <div>
                            <input @click="selectFilter('rank')" type="checkbox" v-model="filterOptions.filterByRank">
                            <label for="rank">Rank</label>
                        </div>
                        <div class="filter-num-input">
                            <v-text-field
                                ref="rankField"
                                :rules="[validRank]"
                                variant="outlined" 
                                label="Max"
                                type="number"
                                density="compact"
                                step="5"
                                v-model="filterOptions.rankCutOff"
                                :disabled="!filterOptions.filterByRank"
                                :hint="'0 <= N => ' + Object.keys(filteredPatientMap).length">
                            </v-text-field>
                        </div>
                    </div>

                    <div class="filterby-wrapper">
                        <div>
                            <input @click="selectFilter('score')" type="checkbox" v-model="filterOptions.filterByScore">
                            <label for="score">Score</label> 
                        </div>
                        <div class="filter-num-input">
                            <v-text-field
                                ref="scoreField"
                                :rules="[validScore]"
                                variant="outlined" 
                                label="Min"
                                type="number"
                                density="compact"
                                step=".1"
                                v-model="filterOptions.scoreCutOff"
                                :disabled="!filterOptions.filterByScore"
                                hint="0 <= N => 1">
                            </v-text-field>
                        </div>
                    </div>                 
                </div>  
                <div class="group zoom-to-select">
                    <label v-if="!zoomed" for="zoom-to-select">Zoom on Selection</label>
                    <button v-if="!zoomed" @click="zoomToSelect()" :disabled="!selectedMatches || selectedMatches.length == 0"><v-icon>mdi-magnify-plus-outline</v-icon></button>
                    
                    <label v-if="zoomed" for="zoom-to-select">Return to Origin</label>
                    <button v-if="zoomed" @click="applyFilters()"><v-icon>mdi-magnify-minus-outline</v-icon></button>
                </div> 
            </div>

            <div id="options-buttons">
                <button @click="applyFilters()" :disabled="!canApplyFilters()">Apply<v-icon v-if="zoomed">mdi-magnify-minus-outline</v-icon></button>
                <button @click="resetChart()">Reset <v-icon>mdi-reload-alert</v-icon></button>
            </div>
    </div>

</template>

<script>
export default {
    name: 'ChartOptions',
    props: {
        showComponent: {
            type: Boolean,
            default: true
        },
        filterOptionsProp: {
            type: Object,
            default: () => {}
        },
        maxRank: {
            type: Number,
            default: 0
        },
        zoomed: {
            type: Boolean,
            default: false
        },
        matchesSelected: {
            type: Boolean,
            default: false
        },
    },
    data: function() {
        return {
            filterOptions: this.filterOptionsProp,
        }
    },
    methods: {
        //resetChart
        //zoomToSelect
        zoomToSelect() {
            this.$emit('zoom-to-select');
        },
        //applyFilters
        applyFilters() {
            this.$emit('apply-filters', this.filterOptions);
        },
        selectFilter(filter) {
            if (filter == 'rank' && !this.filterOptions.filterByRank) {
                this.filterOptions.filterByRank = true;
                this.filterOptions.filterByScore = false;
                this.filterOptions.scoreCutOff = 0.0;
            }
            else if (filter == 'score' && !this.filterOptions.filterByScore) {
                this.filterOptions.filterByScore = true;
                this.filterOptions.filterByRank = false;
                this.filterOptions.rankCutOff = 0;
            }
            else {
                this.filterOptions.filterByRank = false;
                this.filterOptions.rankCutOff = 0;
                this.filterOptions.filterByScore = false;
                this.filterOptions.scoreCutOff = 0.0;
            }
            this.$emit('update-filter-options', this.filterOptions);
        },
    }
}
</script>

<style>

</style>