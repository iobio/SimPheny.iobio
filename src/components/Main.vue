<script>
    import NavBar from './NavBar.vue'
    import LeftBar from './LeftBar.vue'
    import MatchesPane from './MatchesPane.vue'

    export default {
        name: 'Main',
        components: {
            NavBar, 
            LeftBar,
            MatchesPane,
        }
    }
</script>

<template>
    <NavBar></NavBar>

    <div id="main-content-container">
        <LeftBar></LeftBar>
        <MatchesPane></MatchesPane>
    </div>
</template>

<style>
    #main-content-container {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: flex-start;
    }
</style>