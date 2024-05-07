import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue')
  },
  {
    path: '/contatti',
    name: 'contatti',
    component: () => import('../views/ContattiView.vue')
  },
  {
    path: '/radio3d',
    name: 'Radio3DGlobo',
    component: () => import('../views/Radio3DGlobo.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
