import { createApp } from 'vue'
import App from './App.vue'

import './assets/base.css'
import './assets/main.sass'

// Vuetify
// import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

//local things
import * as Be from "./data/fetchFromBackend.js";

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
})

const app = createApp(App)
app.use(vuetify)
app.config.globalProperties.$hpoTermsMap = await Be.getAllPhenotypes()
app.mount('#app')