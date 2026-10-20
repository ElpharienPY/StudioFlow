<script setup>
import { computed } from 'vue'
import { STAGE_ORDER } from '../../stores/projects.js'

const props = defineProps({
  currentStage: { type: String, required: true },
})

const currentIndex = computed(() => STAGE_ORDER.indexOf(props.currentStage))

function statusOf(index) {
  if (index < currentIndex.value) return 'done'
  if (index === currentIndex.value) return 'current'
  return 'upcoming'
}

function label(stage) {
  return stage.charAt(0).toUpperCase() + stage.slice(1)
}
</script>

<template>
  <div class="stepper">
    <div class="stepper-head">
      <h2>Production stages</h2>
      <span class="progress-label">Step {{ currentIndex + 1 }} of {{ STAGE_ORDER.length }} · currently {{ currentStage }}</span>
    </div>
    <ol class="steps">
      <li v-for="(stage, i) in STAGE_ORDER" :key="stage" class="step" :class="statusOf(i)">
        <span class="circle">
          <template v-if="statusOf(i) === 'done'">✓</template>
          <template v-else-if="statusOf(i) === 'current'">●</template>
          <template v-else>{{ i + 1 }}</template>
        </span>
        <div class="step-label">
          <div class="name">{{ label(stage) }}</div>
          <div class="state">{{ statusOf(i) === 'done' ? 'Done' : statusOf(i) === 'current' ? 'In progress' : 'Upcoming' }}</div>
        </div>
        <span v-if="i < STAGE_ORDER.length - 1" class="connector" />
      </li>
    </ol>
  </div>
</template>

<style scoped>
.stepper {
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.stepper-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: 4px;
}

h2 {
  margin: 0;
  font-size: 1rem;
}

.progress-label {
  color: var(--color-accent-400);
  font-size: 0.82rem;
  font-weight: 600;
}

.steps {
  list-style: none;
  display: flex;
  margin: 0;
  padding: 0;
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  text-align: center;
}

.circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  background: var(--color-surface-800);
  color: #64748b;
  border: 2px solid var(--color-surface-800);
  z-index: 1;
}

.step.done .circle {
  background: var(--color-accent-500);
  border-color: var(--color-accent-500);
  color: white;
}

.step.current .circle {
  background: var(--color-surface-900);
  border-color: var(--color-accent-500);
  color: var(--color-accent-400);
}

.step-label {
  margin-top: 8px;
}

.name {
  font-size: 0.85rem;
  font-weight: 600;
}

.state {
  font-size: 0.72rem;
  color: #64748b;
}

.step.current .state {
  color: var(--color-accent-400);
}

.connector {
  position: absolute;
  top: 18px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--color-surface-800);
  z-index: 0;
}

.step.done .connector {
  background: var(--color-accent-500);
}
</style>
