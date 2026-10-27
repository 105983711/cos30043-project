<script setup>
defineProps({ page: Number, total: Number, pageSize: { default: 6 } });
defineEmits(['update:page']);
</script>
<template>
  <nav v-if="total > pageSize" class="pagination" aria-label="Results pages">
    <button
      class="button outline small"
      :disabled="page === 1"
      @click="$emit('update:page', page - 1)"
    >
      Previous</button
    ><button
      v-for="n in Math.ceil(total / pageSize)"
      :key="n"
      class="page-button"
      :class="{ active: page === n }"
      :aria-label="`Page ${n}`"
      :aria-current="page === n ? 'page' : undefined"
      @click="$emit('update:page', n)"
    >
      {{ n }}</button
    ><button
      class="button outline small"
      :disabled="page === Math.ceil(total / pageSize)"
      @click="$emit('update:page', page + 1)"
    >
      Next
    </button>
  </nav>
</template>
