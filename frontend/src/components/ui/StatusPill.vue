<script setup>
const props = defineProps({
  status: { type: String, required: true },
  label: { type: String, required: true },
})

const COLOR_VAR = {
  kickoff: '--color-status-kickoff',
  in_production: '--color-status-production',
  almost_done: '--color-status-almost',
  on_track: '--color-status-ontrack',
}
</script>

<template>
  <span class="pill" :style="{ color: `var(${COLOR_VAR[status]})`, borderColor: `var(${COLOR_VAR[status]})` }">
    {{ label }}
  </span>
</template>

<style scoped>
.pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid;
  background: color-mix(in srgb, currentColor 14%, transparent);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
</style>
