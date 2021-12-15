import Vue from 'vue'
import axios from 'axios'
import VTooltip from 'v-tooltip'

import App from './App.vue'

import * as vEvents from '../plugins/events'

import './bootwatch/scss/index.scss'
import './bootwatch/scss/font-awesome.css'
import 'v-tooltip/dist/v-tooltip.css'

Vue.use(vEvents.client)
Vue.use(VTooltip)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

// const router = new Router({
//   scrollBehavior: () => ({ y: 0 }),
//   routes
// })

new Vue({
  // router,
  ...App
}).$mount('#app')
