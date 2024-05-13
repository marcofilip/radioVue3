import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/radio3d',
    name: 'Radio3DGlobo',
    component: () => import('../views/Radio3DGlobo.vue')
  },
  {
    path: '/infoview',
    name: 'infoview',
    component: () => import('../views/InfoView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
