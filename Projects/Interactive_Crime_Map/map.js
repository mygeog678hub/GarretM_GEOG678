var map = L.map('mapid').setView([29.76, -95.37], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var clusterLayer = L.markerClusterGroup();
var heatLayer;
var crimePoints = [];

// ✅ REAL DATASETS
var dataUrl = "https://raw.githubusercontent.com/glynnbird/usstatesgeojson/master/california.geojson";

function loadCityData() {

  clusterLayer.clearLayers();
  crimePoints = [];

  fetch(dataUrl)
    .then(res => res.json())
    .then(data => {

      console.log("DATA:", data);

      data.features.forEach(f => {

        var coords = f.geometry.coordinates[0][0];
        var latlng = [coords[1], coords[0]];

        var marker = L.circleMarker(latlng, {
          radius: 6,
          fillColor: "blue",
          color: "#000",
          weight: 1,
          fillOpacity: 0.8
        });

        marker.bindPopup("Test Feature");

        clusterLayer.addLayer(marker);
        crimePoints.push(latlng);

      });

      map.addLayer(clusterLayer);
      buildHeat();

    })
    .catch(err => console.error("FETCH ERROR:", err));

}
function getType(f) {
  return f.attributes?.offense ||
         f.attributes?.offense_type ||
         f.attributes?.incident_type ||
         f.attributes?.ucr_description ||
         "Other";
}

function getDescription(f) {
  return f.attributes?.offense_desc ||
         f.attributes?.description ||
         "No description";
}

function getColor(type) {
  type = type.toLowerCase();

  if (type.includes("assault") || type.includes("robbery")) return "red";
  if (type.includes("theft") || type.includes("burglary")) return "orange";

  return "blue";
}

// 🔥 HEATMAP
function buildHeat() {
  if (heatLayer) {
    map.removeLayer(heatLayer);
  }

  heatLayer = L.heatLayer(crimePoints, {
    radius: 25,
    blur: 15
  });
}

function toggleHeat() {
  if (map.hasLayer(heatLayer)) {
    map.removeLayer(heatLayer);
  } else {
    map.addLayer(heatLayer);
  }
}

function getCityCenter(city) {
  switch(city) {
    case "austin": return [30.27, -97.74];
    default: return [29.76, -95.37];
  }
}

// 🚀 INITIAL LOAD
loadCityData();