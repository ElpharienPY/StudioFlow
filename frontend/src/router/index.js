import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useProjectsStore } from '../stores/projects.js'

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

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.name === 'login' && auth.isAuthenticated) return { name: 'projects' }
  // make sure the project list + active project content are loaded before showing a data view
  if (auth.isAuthenticated && !to.meta.public) await useProjectsStore().ensureLoaded()
  return true
})

export default router
