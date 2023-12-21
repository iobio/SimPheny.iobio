import { createApp } from 'vue'
import App from './App.vue'

import './assets/base.css'
import './assets/main.sass'

// Vuetify
// import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'


const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
})

const app = createApp(App)
app.use(vuetify)
app.mount('#app')