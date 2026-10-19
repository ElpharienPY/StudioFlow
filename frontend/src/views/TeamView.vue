<script setup>
import { computed } from 'vue'
import { useProjectsStore } from '../stores/projects.js'
import { useAuthStore } from '../stores/auth.js'
import AppShell from '../components/layout/AppShell.vue'
import MemberRow from '../components/team/MemberRow.vue'
import InviteMemberForm from '../components/team/InviteMemberForm.vue'

const store = useProjectsStore()
const auth = useAuthStore()

const members = computed(() => (store.activeProjectId ? store.membersOf(store.activeProjectId) : []))

const myRole = computed(() =>
  auth.currentUser && store.activeProjectId ? store.roleOf(store.activeProjectId, auth.currentUser.id) : null
)
const canManage = computed(() => myRole.value === 'owner')
const ownerCount = computed(() => members.value.filter((m) => m.role === 'owner').length)

function canRemove(member) {
  return !(member.role === 'owner' && ownerCount.value <= 1)
}

function changeRole(userId, role) {
  store.updateMemberRole(store.activeProjectId, userId, role)
}

function remove(userId) {
  store.removeMember(store.activeProjectId, userId)
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
</style>
