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

  fetch(dataUrl)
    .then(res => res.json())
    .then(data => {

      console.log("DATA:", data);

      data.features.forEach(f => {

        if (!f.geometry || !f.geometry.coordinates) return;

        // get a point from polygon
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

      heatLayer = L.heatLayer(crimePoints, {
        radius: 25,
        blur: 15
      });

    })
    .catch(err => console.error("FETCH ERROR:", err));
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