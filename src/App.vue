<template>
  <v-app >
    <Main v-if="validFromMosaic && mosaicSession"
      :mosaicSession="mosaicSession"
      :mosaicProjectId="mosaicProjectId"
      :mosaicSampleId="mosaicSampleId"
      :fromMosaic="validFromMosaic"></Main>

    <div v-else id="non-auth-message-container">
      <p>This application is only available to certain Mosaic users.</p>
    </div>
  </v-app>
</template>

<script>
  import Main from './components/Main.vue'
  import MosaicSession from './models/MosaicSession.js';

  export default {
    name: 'App',
    components: {
      Main
    },
    data() {
      return {
        mosaicSession: null,
        mosaicUrlParams: null,
        mosaicProjectId: null,
        mosaicSampleId: null,
        validFromMosaic: true,
      }
    },
    async mounted() {
      this.initMosaicSession();
    },
    created(){
            // let access_token= '7d5e4bdcf03a4264b468cfefb0e48e5069e9d8ff' //TESTING
            this.mosaicUrlParams = new URLSearchParams(window.location.search);
            if (this.mosaicUrlParams.get('access_token')){
                localStorage.setItem('mosaic-iobio-tkn', this.mosaicUrlParams.get('access_token'));
            } else {
                localStorage.setItem('mosaic-iobio-tkn', '');
            }
            // localStorage.setItem('mosaic-iobio-tkn', access_token); //TESTING
    },
    methods: {
      async initMosaicSession() {
        if (localStorage.getItem('mosaic-iobio-tkn') && localStorage.getItem('mosaic-iobio-tkn').length > 0){
          // let tokenType = 'Bearer' //TESTING
          // let source = 'https%3A%2F%2Fmosaic.chpc.utah.edu' //TESTING
          // source = decodeURIComponent(source) //TESTING
          // this.mosaicProjectId = 1281 //TESTING
          // let clientAppNumber = 2 //TESTING
          // this.mosaicSampleId = 56980 //TESTING

          //Gets everything from the URL and assigns what is needed
          this.mosaicProjectId = Number(this.mosaicUrlParams.get('project_id'));
          this.mosaicSampleId = Number(this.mosaicUrlParams.get('sample_id'));
          let tokenType = this.mosaicUrlParams.get('token_type');
          let source = this.mosaicUrlParams.get('source');
          source = decodeURIComponent(source);
          let clientAppNumber = this.mosaicUrlParams.get('client_application_id');

          //Create a new MosaicSession object
          this.mosaicSession = new MosaicSession(clientAppNumber);
          try {
            await this.mosaicSession.promiseInit(source, this.mosaicProjectId, tokenType, this.mosaicSampleId);
          } catch (error) {
            console.error('Error initializing MosaicSession', error);
            this.validFromMosaic = false;
          }
        } else {
            //set not launched from mosaic or not valid
            this.validFromMosaic = false;
        }
      }
    }
  }
</script>

<style>
  #non-auth-message-container {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

</style>
