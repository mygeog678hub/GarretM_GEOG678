var map = L.map('mapid').setView([37.8, -96], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var clusterLayer = L.markerClusterGroup();
var heatLayer;
var crimePoints = [];

// WORKING TEST DATA
var dataUrl = "https://raw.githubusercontent.com/glynnbird/usstatesgeojson/master/california.geojson";

function loadData() {

  clusterLayer.clearLayers();
  crimePoints = [];

  fetch("houston_crime.geojson")
  .then(res => res.json())
  .then(data => {

    data.features.forEach(f => {

      var coords = f.geometry.coordinates;
      var latlng = [coords[1], coords[0]];

      var type = f.properties.type;

      var marker = L.circleMarker(latlng, {
        radius: 6,
        fillColor: getColor(type),
        color: "#000",
        weight: 1,
        fillOpacity: 0.8
      });

      marker.bindPopup(
        `<b>${type}</b><br>${f.properties.date}<br>${f.properties.description}`
      );

      clusterLayer.addLayer(marker);
      crimePoints.push(latlng);

    });

    map.addLayer(clusterLayer);
    buildHeat();

  })
  .catch(err => console.error(err));
}

function toggleHeat() {
  if (map.hasLayer(heatLayer)) {
    map.removeLayer(heatLayer);
  } else {
    map.addLayer(heatLayer);
  }
}

// LOAD
loadData();