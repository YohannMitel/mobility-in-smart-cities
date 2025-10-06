<template>
  <div class="map-wrap justify-content-center">
    <div class="left">
      <canvas ref="canvasEl" class="m-auto"></canvas>
    </div>

    <div>
      <div class="mb-2">
      <button class="btn btn-primary me-2" @click="activeMenu = 'controls'">Menu Contrôles</button>
      <button class="btn btn-secondary" @click="activeMenu = 'other'">Menu Autre</button>
      </div>
      <div v-if="activeMenu === 'controls'" class="controls">
      <div class="modes">
        <button :class="{active: currentMode === 'person'}" @click="selectMode('person')">👤 Personne</button>
        <button :class="{active: currentMode === 'bus'}" @click="selectMode('bus')">🚌 Bus</button>
        <button :class="{active: currentMode === 'flag'}" @click="selectMode('flag')">🚩 Destination</button>
      </div>
      <h4>Parameters</h4>
      <label>Colonnes: <input type="number" v-model.number="cols" min="1" /></label>
      <label>Lignes: <input type="number" v-model.number="rows" min="1" /></label>
      <label>Taille case (px): <input type="number" v-model.number="size" min="8" /></label>
      <div class="actions">
        <button @click="recreate">recreate map</button>
        <button @click="reset">Reset</button>
      </div>
      <div class="legend">
        <h4>Légende</h4>
        <div>👤 Personne</div>
        <div>🚌 Arrêt de bus</div>
        <div>🚩 Destination</div>
      </div>
      </div>
      <div v-else-if="activeMenu === 'other'" class="controls">
      <!-- Ajoute ici le contenu de ton deuxième menu -->
      <h4>Autre menu</h4>
      <p>Contenu personnalisé...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Map from './libs/Map.js';

const canvasEl = ref(null);
let map = null;

const cols = ref(19);
const rows = ref(17);
const size = ref(32);
const activeMenu = ref('controls'); // 'controls' or 'other'


const timeMatrix = ref([
  [0, 10, 15],
  [10, 0, 12],
  [15, 12, 0]
]);

const currentMode = ref(null); 

onMounted(() => {
  map = new Map(cols.value, rows.value, size.value);
  map.attachTo(canvasEl.value);
});

onBeforeUnmount(() => {
  if (map) map.detach();
});

function selectMode(kind) {
  console.log(map.getPerson())
  currentMode.value = kind;
  map?.setMode(kind);
}



function reset() {
  map?._initGrid();
  map?.render();
}

function recreate() {
  if (map) {
    map.detach();
    map = new Map(cols.value, rows.value, size.value);
    map.attachTo(canvasEl.value);
    map.setMode(currentMode.value);
  }
}


</script>

<style>
.map-wrap { display: flex; align-items: flex-start; gap: 16px; height: 100%; padding: 12px }
canvas { image-rendering: crisp-edges; border: 1px solid #ddd; display:block }
.controls { width: 260px; display:flex; flex-direction:column; gap:8px }
.controls label { display:flex; justify-content:space-between; gap:8px }
.modes button { margin-right:6px }
.actions button { margin-right:6px }
.active { background:rgb(206, 229, 222); color:white }
.legend { font-size: 13px; color:#333 }

</style>