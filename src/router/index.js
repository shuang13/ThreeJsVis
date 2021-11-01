import Vue from 'vue'
import Router from 'vue-router'
import Tree from '@/components/Tree'
import Mountain from '@/components/Mountain'
import Seismic from '@/components/Seismic'
import Seismic2 from '@/components/Seismic2'
import Layer from '@/components/Layer'

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
    {
      path: '/Seismic2',
      name: 'Seismic2',
      component: Seismic
    },
    {
      path: '/Layer',
      name: 'Layer',
      component: Layer
    },
  ]
})
