var map = L.map('mapid').setView([29.76, -95.37], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var clusterLayer = L.markerClusterGroup();
var heatLayer;
var crimePoints = [];

// ✅ REAL DATASETS
var cityServices = {
  houston: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Houston_Crime_Data/FeatureServer/0",
  austin: "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/Austin_Crime_Data/FeatureServer/0"
};

function loadCityData() {

  var city = document.getElementById("citySelect").value;
  var url = cityServices[city];

  clusterLayer.clearLayers();
  crimePoints = [];

  fetch(url + "/query?where=1=1&outFields=*&outSR=4326&f=geojson")
  .then(res => res.json())   // ✅ THIS WAS MISSING
  .then(data => {

    console.log("DATA:", data);

    if (!data.features || data.features.length === 0) {
      console.error("No features returned from service");
      return;
    }

    data.features.forEach(f => {

      if (!f.geometry) return;

      var latlng;

      // GeoJSON
      if (f.geometry.coordinates) {
        latlng = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
      }

      // ArcGIS
      else if (f.geometry.x && f.geometry.y) {
        latlng = [f.geometry.y, f.geometry.x];
      }

      else {
        return;
      }

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
  .catch(err => console.error("FETCH ERROR:", err));
}

function getType(f) {
  return f.properties.offense ||
         f.properties.offense_type ||
         f.properties.incident_type ||
         f.properties.ucr_description ||
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