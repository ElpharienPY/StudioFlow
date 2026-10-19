<script setup>
import Avatar from './Avatar.vue'

const props = defineProps({
  users: { type: Array, required: true },
  max: { type: Number, default: 3 },
  size: { type: Number, default: 28 },
})

const shown = () => props.users.slice(0, props.max)
const overflow = () => Math.max(0, props.users.length - props.max)
</script>

<template>
  <div class="stack">
    <Avatar v-for="u in shown()" :key="u.id" :user="u" :size="size" />
    <span v-if="overflow() > 0" class="overflow" :style="{ width: size + 'px', height: size + 'px', fontSize: size * 0.35 + 'px' }">
      +{{ overflow() }}
    </span>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
}

.stack > :deep(*) {
  margin-left: -8px;
}

.stack > :deep(*:first-child) {
  margin-left: 0;
}

.overflow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-surface-800);
  color: #94a3b8;
  font-weight: 700;
  border: 2px solid var(--color-surface-900);
  margin-left: -8px;
}
</style>
