import Vue from 'vue'
import Router from 'vue-router'
import Tree from '@/components/Tree'
import Mountain from '@/components/Mountain'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Mountain',
      component: Mountain
    }
  ]
})
