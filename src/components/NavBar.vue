<script>
    import LeftBar from './LeftBar.vue'

    export default {
        name: 'NavBar',
        components: {
            LeftBar,
        },
        props: {
            
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
    <div id="nav-bar">
        <v-app-bar density="compact" color="#21351f" >
            <v-toolbar-title>Pheno-Matcher.iobio</v-toolbar-title>
        </v-app-bar>
    </div>
</template>

<style>

</style>