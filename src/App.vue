<template>
  <div class="container-fluid d-flex flex-column h-100 p-3 gap-3">

    <LeafletMap ref="leafletMap" v-show="!bottomFullScreen" class="h-50" :center="{ lat: 47.559384, lng: 6.855469 }" :zoom="13" :markers="markers" :highlightId="highlightedNode"
      :scrollWheelZoom="true" height="500px" @map-ready="onMapReady" @marker-click="handleMarkerClick" @geometric-median-click="handleGeometricMedianClick" @directions-for-each-person-click="handleDirectionsForEachPersonClick" />


    <div class="d-flex flex-column">
      <ul class="nav nav-tabs mb-3" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link" :class="{ active: activeTab === 'dataset' }" @click="activeTab = 'dataset'"
            type="button" role="tab" aria-selected="activeTab === 'dataset'">
            Dataset
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" :class="{ active: activeTab === 'functions' }" @click="activeTab = 'functions'"
            type="button" role="tab" aria-selected="activeTab === 'functions'">
            Transitive closure
          </button>
        </li>

        <li class="ms-auto">
          <button class="btn btn-light" @click="bottomFullScreen = !bottomFullScreen">
            <i :class="[bottomFullScreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand']"></i>
          </button>
        </li>
      </ul>
      <div class="tab-content">
        <div class="tab-pane fade" :class="{ 'show active': activeTab === 'dataset' }" role="tabpanel">
            <div :style="bottomFullScreen ? { overflowY: 'auto' } : { maxHeight: '250px', overflowY: 'auto' }">
            <DatasetTable :nodes="markers" />
            </div>
        </div>
        <div class="tab-pane fade" :class="{ 'show active': activeTab === 'functions' }" role="tabpanel">
          <div class="d-flex flex-column" :style="bottomFullScreen ? { overflowY: 'auto' } : { maxHeight: '250px', overflowY: 'auto' }">
           <!-- <div class="input-group input-group-sm mb-3">

              <span class="input-group-text">Active</span>
              <button class="btn btn-outline-secondary">Transitive closure</button>
              <button class="btn btn-outline-secondary">Geometric median</button>
              <button class="btn btn-outline-secondary">Directions for each person</button>

            </div>
            -->
            <TransitivePart ref="transitivePart" :nodes="nodes" :edges="edges"  />
          </div>


        </div>
      </div>
    </div>
  </div>


</template>



<script setup>
import { onMounted, ref } from 'vue'
import LeafletMap from './components/LeafletMap.vue'
import DatasetTable from './components/DatasetTable.vue'
import TransitivePart from './components/TransitivePart.vue'
import nodes from './datasets/nodes.js' // example dataset import
import edges from './datasets/edges.js' // example dataset import

const markers = ref(nodes)
const activeTab = ref('dataset')
const bottomFullScreen = ref(false);
const transitivePart = ref(null);
const leafletMap = ref(null);
const highlightedNode = ref(null);

console.log('nodes:', nodes)
function handleMarkerClick(payload) {
  console.log('marker-click:', payload)
}

function handleGeometricMedianClick() {
  if(transitivePart.value) {
    const bestNode = transitivePart.value.computeBestNode();
    console.log("Best node from TransitivePart:", bestNode);
    if(!bestNode.node.lat || !bestNode.node.lng) return
    if(bestNode && leafletMap.value && leafletMap.value.flyTo) {
      leafletMap.value.flyTo(bestNode.node.lat, bestNode.node.lng, 15);
      highlightedNode.value = bestNode.node.id;
    }
  }
  console.log('geometric-median-click')
}

function handleDirectionsForEachPersonClick() {
  console.log('directions-for-each-person-click')
}

let api = null


function onMapReady(exposed) {
  api = exposed
  api.fitToMarkers()
}


onMounted(() => {
  console.log('leafletMap:', leafletMap.value)
})
</script>
