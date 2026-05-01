var map = L.map('mapid').setView([29.76, -95.37], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var clusterLayer = L.markerClusterGroup();
var heatLayer;
var crimePoints = [];

// ✅ REAL DATASETS
var cityServices = {
  houston: "https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Houston_Crime/FeatureServer/0",
  austin: "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/Crime_Reports/FeatureServer/0"
};

function loadCityData() {

  var city = document.getElementById("citySelect").value;
  var url = cityServices[city];

  clusterLayer.clearLayers();
  crimePoints = [];

  fetch(url + "/query?where=1=1&outFields=*&outSR=4326&f=geojson")
    .then(res => res.json())
    .then(data => {

      data.features.forEach(f => {

        var coords = f.geometry.coordinates;
        var latlng = [coords[1], coords[0]];

        var type = getType(f);

        var marker = L.circleMarker(latlng, {
          radius: 5,
          fillColor: getColor(type),
          color: "#000",
          weight: 1,
          fillOpacity: 0.8
        });

        marker.bindPopup(`<b>${type}</b><br>${getDescription(f)}`);

        clusterLayer.addLayer(marker);

        crimePoints.push(latlng);

      });

      map.addLayer(clusterLayer);

      map.setView(getCityCenter(city), 12);

      buildHeat();

    })
    .catch(err => console.error(err));
}

function getType(f) {
  return f.properties.offense ||
         f.properties.crime_type ||
         f.properties.category ||
         "Other";
}

function getDescription(f) {
  return f.properties.offense_desc ||
         f.properties.description ||
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