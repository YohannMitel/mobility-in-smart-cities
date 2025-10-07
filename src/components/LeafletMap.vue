<script setup>

import { onMounted, onBeforeUnmount, ref, watch, defineEmits, defineProps, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// =======================
// === Props & Emits ====
// =======================
const props = defineProps({
  center: {
    type: Object, 
    default: () => ({ lat: 48.8566, lng: 2.3522 })
  },
  zoom: {
    type: Number,
    default: 13
  },
  tileUrl: {
    type: String,
    default: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  attribution: {
    type: String,
    default: '&copy; OpenStreetMap contributors'
  },
  markers: {
    type: Array,
    default: () => []
  },
  
  paths: {
    type: Array,
    default: () => []
  },
  scrollWheelZoom: {
    type: Boolean,
    default: true
  },
  height: {
    type: String,
    default: '400px'
  },
  
  highlightId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits([
  'map-ready',
  'marker-click',
  'geometric-median-click',
  'directions-for-each-person-click'
])

// =======================
// === Map references ===
// =======================
const mapContainer = ref(null)
let mapInstance = null
let tileLayer = null
const markerLayerGroup = L.layerGroup()
const pathLayerGroup = L.layerGroup()

// =======================
// === ICONS ============
// =======================

// Helper to build icons with custom color
function iconBase(color, path) {
  return L.divIcon({
    className: 'custom-svg-marker',
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="24" height="24">
        <path fill="${color}" d="${path}" />
      </svg>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  })
}


const pathStop = "M128 252.6C128 148.4 214 64 320 64C426 64 512 148.4 512 252.6C512 371.9 391.8 514.9 341.6 569.4C329.8 582.2 310.1 582.2 298.3 569.4C248.1 514.9 127.9 371.9 127.9 252.6zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z";
const pathPerson = "M376 88C376 57.1 350.9 32 320 32C289.1 32 264 57.1 264 88C264 118.9 289.1 144 320 144C350.9 144 376 118.9 376 88zM400 300.7L446.3 363.1C456.8 377.3 476.9 380.3 491.1 369.7C505.3 359.1 508.3 339.1 497.7 324.9L427.2 229.9C402 196 362.3 176 320 176C277.7 176 238 196 212.8 229.9L142.3 324.9C131.8 339.1 134.7 359.1 148.9 369.7C163.1 380.3 183.1 377.3 193.7 363.1L240 300.7L240 576C240 593.7 254.3 608 272 608C289.7 608 304 593.7 304 576L304 416C304 407.2 311.2 400 320 400C328.8 400 336 407.2 336 416L336 576C336 593.7 350.3 608 368 608C385.7 608 400 593.7 400 576L400 300.7z";


const stopIcon = iconBase("#000000", pathStop);
const personIcon = iconBase("#000000", pathPerson);

const greenStopIcon = iconBase("#00C853", pathStop);
const greenPersonIcon = iconBase("#00C853", pathPerson);

function getIconForNode(marker) {
  if (props.highlightId && marker.id === props.highlightId) {
    return marker.type === 'stop' ? greenStopIcon : greenPersonIcon;
  }
  return marker.type === 'stop' ? stopIcon : personIcon;
}

// =======================
// === Marker handling ===
// =======================
function rebuildMarkers() {
  markerLayerGroup.clearLayers();

  props.markers.forEach(m => {
    const icon = getIconForNode(m);
    const marker = L.marker([m.lat, m.lng], { icon });
    if (m.label) marker.bindPopup(m.label);

    marker.on('click', () =>
      emit('marker-click', { id: m.id, lat: m.lat, lng: m.lng })
    );

    markerLayerGroup.addLayer(marker);
  });

  if (mapInstance && !markerLayerGroup.getLayers().length) return;
  if (mapInstance && !markerLayerGroup._map)
    markerLayerGroup.addTo(mapInstance);
}

// =======================
// === Draw Paths ========
// =======================
async function drawPaths() {
  if (!mapInstance) return;
  pathLayerGroup.clearLayers();

  if (!props.paths || !props.paths.length) return;

  const idToMarker = new Map(props.markers.map(m => [m.id, m]));

  // Create an array of promises to fetch all routes in parallel
  const fetchPromises = props.paths.map(async (route) => {
    const color = `hsl(${Math.floor(Math.random() * 360)}, 85%, 50%)`;
    const coords = route.path
      .map(id => idToMarker.get(id))
      .filter(m => m)
      .map(m => [m.lat, m.lng]);

    if (coords.length < 2) return null;

    const start = coords[0];
    const end = coords[coords.length - 1];
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    try {
      const res = await fetch(osrmUrl);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const geometry = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        const polyline = L.polyline(geometry, {
          color,
          weight: 5,
          opacity: 0.9
        }).addTo(pathLayerGroup);

        const personLabel = idToMarker.get(route.person)?.label ?? `Person ${route.person}`;
        const destLabel = idToMarker.get(route.path.at(-1))?.label ?? 'Destination';
        polyline.bindPopup(`${personLabel} → ${destLabel}<br>Cost: ${route.cost}`);

        return polyline;
      }
    } catch (err) {
      console.error("OSRM route fetch error:", err);
      return null;
    }
  });

  await Promise.all(fetchPromises);

  if (!pathLayerGroup._map) pathLayerGroup.addTo(mapInstance);
}

// =======================
// === Public functions ===
// =======================
function flyTo(lat, lng, zoom = props.zoom) {
  if (!mapInstance) return;
  mapInstance.flyTo([lat, lng], zoom, { duration: 0.8 });
}

function fitToMarkers(padding = [20, 20]) {
  if (!mapInstance) return;
  const layers = markerLayerGroup.getLayers();
  if (!layers.length) return;
  const group = L.featureGroup(layers);
  mapInstance.fitBounds(group.getBounds(), { padding });
}

// =======================
// === Lifecycle ========
// =======================
onMounted(async () => {
  await nextTick();

  mapInstance = L.map(mapContainer.value, {
    center: [props.center.lat, props.center.lng],
    zoom: props.zoom,
    scrollWheelZoom: props.scrollWheelZoom
  });

  tileLayer = L.tileLayer(props.tileUrl, {
    attribution: props.attribution,
    crossOrigin: true
  }).addTo(mapInstance);

  markerLayerGroup.addTo(mapInstance);
  pathLayerGroup.addTo(mapInstance);

  rebuildMarkers();
  drawPaths();

  emit('map-ready', { flyTo, fitToMarkers, getMap: () => mapInstance });
  setTimeout(() => mapInstance.invalidateSize(), 0);

  // === Custom control buttons ===
  const customControl = L.Control.extend({
    onAdd: function () {
      const div = L.DomUtil.create('div', '');
      div.innerHTML = `
        <div class="btn-group btn-group-sm" role="group" aria-label="Custom Control">
          <button id="leaflet-btn1" class="btn btn-secondary" type="button">Geometric median</button>
          <button id="leaflet-btn2" class="btn btn-secondary" type="button">Directions for each person</button>
        </div>
      `;
      L.DomEvent.disableClickPropagation(div);
      div.querySelector('#leaflet-btn1').addEventListener('click', () => emit('geometric-median-click'));
      div.querySelector('#leaflet-btn2').addEventListener('click', () => emit('directions-for-each-person-click'));
      return div;
    }
  });
  mapInstance.addControl(new customControl({ position: 'topright' }));
});

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});

// =======================
// === Watchers ========
// =======================
watch(() => props.center, (c) => {
  if (mapInstance && c) mapInstance.setView([c.lat, c.lng]);
}, { deep: true });

watch(() => props.zoom, (z) => {
  if (mapInstance && typeof z === 'number') mapInstance.setZoom(z);
});

watch(() => props.markers, () => {
  rebuildMarkers();
}, { deep: true });

watch(() => props.paths, () => {
  drawPaths();
}, { deep: true });

watch(() => props.highlightId, () => {
  rebuildMarkers();
});

defineExpose({
  flyTo,
  fitToMarkers,
  drawPaths
});
</script>

<template>
  <div
    ref="mapContainer"
    :style="{ width: '100%', height: props.height, borderRadius: '12px', overflow: 'hidden' }"
  ></div>
</template>

<style scoped>
/* Minimal styling */
</style>
