<script>
    export default {
        name: 'NavBar',
        props: {
            
        },
        data: function() {
            return {
                hide: false,
                collapseTooltipOpen: false,
            }
        },
        methods: {
            toggleCollapseToolbar: function() {
                this.hide = !this.hide;
                this.collapseTooltipOpen = false;
            },
        },
    }
</script>

<template>
    <div id="nav-bar">
        <v-toolbar density="compact" color="#21351f" :collapse="hide">
            <v-btn icon @click="">
                <v-tooltip offset="3" location="bottom" activator="parent">
                    <span>Show patient details</span>
                </v-tooltip>
                <v-icon>mdi-menu</v-icon>
            </v-btn>

            <v-toolbar-title>Pheno-Matcher.iobio</v-toolbar-title>

            <v-btn icon @click="toggleCollapseToolbar">
                <v-tooltip offset="3" v-model="collapseTooltipOpen" location="bottom" activator="parent">
                    <span>Collapse</span>
                </v-tooltip>
                <v-icon v-if="hide == false">mdi-menu-left-outline</v-icon>
                <v-icon v-if="hide == true">mdi-menu-right-outline</v-icon>
            </v-btn>
        </v-toolbar>
    </div>
</template>

<style>

</style>