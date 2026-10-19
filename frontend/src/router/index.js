import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    { path: '/', redirect: '/projects' },
    { path: '/projects', name: 'projects', component: () => import('../views/ProjectsView.vue') },
    { path: '/boards', name: 'boards', component: () => import('../views/BoardView.vue') },
    { path: '/boards/:taskId', name: 'board-task', component: () => import('../views/BoardView.vue') },
    { path: '/deliverables', name: 'deliverables', component: () => import('../views/DeliverablesView.vue') },
    { path: '/assets', name: 'assets', component: () => import('../views/AssetsView.vue') },
    { path: '/team', name: 'team', component: () => import('../views/TeamView.vue') },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'projects' }
  return true
})

export default router
