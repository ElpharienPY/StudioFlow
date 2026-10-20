<script setup>
import TaskCard from './TaskCard.vue'

defineProps({
  title: { type: String, required: true },
  dotColor: { type: String, required: true },
  tasks: { type: Array, required: true },
})
</script>

<template>
  <div class="column">
    <div class="column-head">
      <span class="dot" :style="{ background: dotColor }" />
      <h2>{{ title }}</h2>
      <span class="count">{{ tasks.length }}</span>
    </div>
    <div class="tasks">
      <TaskCard v-for="task in tasks" :key="task.id" :task="task" />
    </div>
  </div>
</template>

<style scoped>
.column {
  flex: 1;
  min-width: 260px;
  background: var(--color-surface-900);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.column-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

h2 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  flex: 1;
}

.count {
  font-size: 0.75rem;
  color: #64748b;
  background: var(--color-surface-800);
  padding: 1px 8px;
  border-radius: 999px;
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>

