<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects.js'
import { useAuthStore } from '../stores/auth.js'
import AppShell from '../components/layout/AppShell.vue'
import MemberRow from '../components/team/MemberRow.vue'
import InviteMemberForm from '../components/team/InviteMemberForm.vue'

const store = useProjectsStore()
const auth = useAuthStore()
const router = useRouter()

const members = computed(() => (store.activeProjectId ? store.membersOf(store.activeProjectId) : []))

const myRole = computed(() =>
  auth.currentUser && store.activeProjectId ? store.roleOf(store.activeProjectId, auth.currentUser.id) : null
)
// an archived project is read-only for everyone, owners included (the API answers 409)
const archived = computed(() => Boolean(store.activeProject?.archived_at))
const canManage = computed(() => myRole.value === 'owner' && !archived.value)
const ownerCount = computed(() => members.value.filter((m) => m.role === 'owner').length)

function canRemove(member) {
  return !(member.role === 'owner' && ownerCount.value <= 1)
}

function changeRole(userId, role) {
  store.updateMemberRole(store.activeProjectId, userId, role)
}

async function remove(userId) {
  const isMe = userId === auth.currentUser?.id
  const result = await store.removeMember(store.activeProjectId, userId, auth.currentUser?.id)
  // I took myself off the project: it is gone from my list, go back to the project list
  if (result.ok && isMe) router.push('/projects')
}

// any member can leave, whatever their role (the API refuses when I'm the last owner)
async function leaveProject() {
  if (!auth.currentUser || !store.activeProject) return
  if (!window.confirm(`Leave "${store.activeProject.name}"? You will lose access to it and be removed from its tasks.`)) return
  await remove(auth.currentUser.id)
}
</script>

<template>
  <AppShell>
    <header class="header">
      <h1>Team</h1>
      <p class="subtitle">{{ members.length }} members on {{ store.activeProject?.name }}</p>
    </header>

    <section v-if="canManage" class="invite">
      <h2>Invite a member</h2>
      <InviteMemberForm v-if="store.activeProjectId" :project-id="store.activeProjectId" />
    </section>
    <p v-else-if="archived" class="viewer-note">This project is archived: the team can't be changed until an owner restores it.</p>
    <p v-else class="viewer-note">Only project owners can invite members or change roles.</p>

    <div class="members">
      <MemberRow
        v-for="m in members"
        :key="m.id"
        :member="m"
        :can-manage="canManage"
        :can-remove="canRemove(m)"
        @change-role="(role) => changeRole(m.id, role)"
        @remove="remove(m.id)"
      />
    </div>

    <section v-if="store.activeProject && !archived" class="leave">
      <button type="button" class="leave-btn" @click="leaveProject">Leave project</button>
      <p v-if="myRole === 'owner' && ownerCount <= 1" class="leave-note">
        You are the only owner: make someone else an owner before leaving.
      </p>
    </section>
  </AppShell>
</template>

<style scoped>
.header {
  margin-bottom: var(--space-4);
}

h1 {
  margin: 0;
  font-size: 1.6rem;
}

.subtitle {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.invite {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  max-width: 560px;
}

.invite h2 {
  margin: 0 0 var(--space-2);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
}

.viewer-note {
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: var(--space-4);
}

.members {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 560px;
}

.leave {
  margin-top: var(--space-6, 32px);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-subtle);
}

.leave-btn {
  background: transparent;
  border: 1px solid #7f1d1d;
  color: #f87171;
  border-radius: var(--radius-md);
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
}

.leave-btn:hover {
  background: rgba(248, 113, 113, 0.1);
}

.leave-note {
  margin: var(--space-2) 0 0;
  color: #94a3b8;
  font-size: 0.82rem;
}
</style>
