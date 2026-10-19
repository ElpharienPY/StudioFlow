<script setup>
const props = defineProps({
  value: { type: Number, required: true }, // 0-100
})
</script>

<template>
  <div class="track">
    <div class="fill" :style="{ width: Math.min(100, Math.max(0, value)) + '%' }" />
  </div>
</template>

<style scoped>
.track {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: var(--color-surface-800);
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--color-accent-500);
  border-radius: 999px;
}
</style>
