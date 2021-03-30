import Vue from 'vue'
import Router from 'vue-router'
import Tree from '@/components/Tree'
import Mountain from '@/components/Mountain'
import Seismic from '@/components/Seismic'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/Mountain',
      name: 'Mountain',
      component: Mountain
    },
    {
      path: '/Tree',
      name: 'Tree',
      component: Tree
    },
    {
      path: '/Seismic',
      name: 'Seismic',
      component: Seismic
    },
  ]
})
