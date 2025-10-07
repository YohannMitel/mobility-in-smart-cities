<template> 
  <div class="p-6 space-y-8">

    <div class="flex gap-4 mb-6">
      <input type="radio" class="btn-check" value="time" id="timeRadio" v-model="mode" @change="recompute" />
      <label class="btn" for="timeRadio">Time</label>

      <input type="radio" class="btn-check" value="distance" id="distanceRadio" v-model="mode" @change="recompute" />
      <label class="btn" for="distanceRadio">Distance</label>
    </div>

    <div class="d-flex flex-row justify-content-between gap-4">

      <!-- Matrice initiale -->
      <div class="d-flex flex-column">
        <h4 class="text-xl font-semibold">Initial matrix ({{ mode }})</h4>
        <table class="border-collapse border border-gray-400 text-center w-full">
          <thead>
            <tr>
              <th class="border border-gray-300 bg-gray-100">#</th>
              <th v-for="n in nodes" :key="'head1-' + n.id" class="border border-gray-300 bg-gray-100 px-2">
                {{ n.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in matrixInitial" :key="'init-' + i">
              <td class="border border-gray-300 bg-gray-50 font-bold">{{ nodes[i].label }}</td>
              <td
                v-for="(cell, j) in row"
                :key="'cell-' + i + '-' + j"
                class="border border-gray-300 px-2 py-1"
                :style="{ backgroundColor: cell > 0 ? '#d1fae5' : 'transparent' }"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Matrice après fermeture transitive -->
      <div class="d-flex flex-column">
        <h4 class="text-xl font-semibold">Matrix after transitive closure</h4>
        <table class="border-collapse border border-gray-400 text-center w-full">
          <thead>
            <tr>
              <th class="border border-gray-300 bg-gray-100">#</th>
              <th v-for="n in nodes" :key="'head2-' + n.id" class="border border-gray-300 bg-gray-100 px-2">
                {{ n.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in matrixClosure" :key="'closure-' + i">
              <td class="border border-gray-300 bg-gray-50 font-bold">{{ nodes[i].label }}</td>
              <td
                v-for="(cell, j) in row"
                :key="'cell2-' + i + '-' + j"
                class="border border-gray-300 px-2 py-1"
                :class="{ 'bg-green-100': cell > 0 && cell !== matrixInitial[i][j] }"
                :style="{ backgroundColor: cell > 0 ? '#d1fae5' : 'transparent' }"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { buildMatrix, transitiveClosure, graphMedianNode, computeDirections } from '../libs/functions.js';

const props = defineProps({
  nodes: {
    type: Array,
    required: true
  },
  edges: {
    type: Array,
    required: true
  }
});

// === Reactive data ===
const matrixInitial = ref([]);
const matrixClosure = ref([]);
const mode = ref("time"); 
const bestNode = ref(null); 
const directions = ref([]);

// === Recompute everything depending on mode ===
function recompute() {
  console.log(`🔁 Recomputing for mode: ${mode.value}`);
  const m = buildMatrix(props.nodes, props.edges, mode.value);
  matrixInitial.value = m;
  matrixClosure.value = transitiveClosure(m);
  bestNode.value = graphMedianNode(props.nodes, matrixClosure.value);
  directions.value = computeDirections(props.nodes, matrixClosure.value, bestNode.value);
  console.log("✅ Recomputed with mode:", mode.value);
}

// === Initialize once ===
onMounted(() => {
  recompute();
});

// === Expose for external access ===
defineExpose({
  computeBestNode: () => bestNode.value,
  computeDirectionsFunc: () => directions.value
});
</script>

<style scoped>
table {
  font-family: monospace;
  font-size: 0.9rem;
}
</style>
