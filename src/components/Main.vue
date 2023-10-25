<script>
    import NavBar from './NavBar.vue'
    import LeftBar from './LeftBar.vue'

    export default {
        name: 'Main',
        components: {
            NavBar, 
            LeftBar,
        }
    }
</script>

<template>
    <NavBar></NavBar>

    <div id="main-content-container">
        <LeftBar></LeftBar>
        <div id="matches-container">

        </div>
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

    #matches-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        background-color: #89ae8a;
    }
</style>