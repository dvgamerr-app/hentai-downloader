import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
// import Router from 'vue-router'

import './bootwatch/css/bootstrap.css'
import './bootwatch/css/font-awesome.css'

import App from './App'
// import routes from './routes'
import vModel from './modules/model.vue'

Vue.use(Electron)
Vue.use(Resource)
// Vue.use(Router)

Vue.component('v-model', vModel)
Vue.config.debug = true

// const router = new Router({
//   scrollBehavior: () => ({ y: 0 }),
//   routes
// })

new Vue({
  // router,
  ...App
}).$mount('#app')
