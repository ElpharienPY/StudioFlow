<script setup>
defineProps({
  user: { type: Object, required: true },
  size: { type: Number, default: 28 },
})
</script>

<template>
  <span
    class="avatar"
    :style="{ width: size + 'px', height: size + 'px', background: user.color, fontSize: size * 0.4 + 'px' }"
    :title="user.full_name"
  >
    {{ user.initials }}
  </span>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  font-weight: 700;
  border: 2px solid var(--color-surface-900);
  flex-shrink: 0;
}
</style>
