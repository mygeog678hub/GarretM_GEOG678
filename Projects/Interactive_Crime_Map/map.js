var map = L.map('mapid').setView([29.76, -95.37], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var crimeLayer;
var crimeData;

// 🔥 Replace with REAL ArcGIS crime layers
var cityServices = {
  houston: "https://services.arcgis.com/EXAMPLE/FeatureServer/0",
  austin: "https://services.arcgis.com/EXAMPLE2/FeatureServer/0"
};

function loadCityData() {
  var city = document.getElementById("citySelect").value;
  var url = cityServices[city];

  fetch(url + "/query?where=1=1&outFields=*&outSR=4326&f=geojson")
    .then(res => res.json())
    .then(data => {

      crimeData = data;

      populateFilter(data);
      drawData(data);

      map.setView(getCityCenter(city), 12);

    })
    .catch(err => console.error(err));
}

function drawData(data) {

  if (crimeLayer) crimeLayer.clearLayers();

  crimeLayer = L.geoJSON(data, {

    pointToLayer: function (feature, latlng) {

      var type = getType(feature);

      return L.circleMarker(latlng, {
        radius: 6,
        fillColor: getColor(type),
        color: "#000",
        weight: 1,
        fillOpacity: 0.8
      });
    },

    onEachFeature: function (feature, layer) {

      var type = getType(feature);
      var desc = getDescription(feature);

      layer.bindPopup(
        `<b>${type}</b><br>${desc}`
      );
    }

  }).addTo(map);
}

function getType(feature) {
  return feature.properties.type ||
         feature.properties.offense ||
         feature.properties.category ||
         "Other";
}

function getDescription(feature) {
  return feature.properties.description ||
         feature.properties.offense_desc ||
         "No description";
}

function getColor(type) {
  type = type.toLowerCase();

  if (type.includes("assault") || type.includes("robbery")) return "red";
  if (type.includes("theft") || type.includes("burglary")) return "orange";

  return "blue";
}

// 🔽 FILTER
function filterCrime() {
  var selected = document.getElementById("crimeFilter").value;

  var filtered = crimeData.features.filter(f => {
    return selected === "all" || getType(f) === selected;
  });

  drawData({
    type: "FeatureCollection",
    features: filtered
  });
}

// 🔽 SEARCH
function searchCrime() {
  var input = document.getElementById("searchInput").value.toLowerCase();

  crimeLayer.eachLayer(function (layer) {

    var props = layer.feature.properties;

    var text = JSON.stringify(props).toLowerCase();

    if (text.includes(input)) {
      map.fitBounds(layer.getBounds());
      layer.openPopup();
    }
  });
}

// 🔽 Populate filter dropdown dynamically
function populateFilter(data) {
  var types = new Set();

  data.features.forEach(f => {
    types.add(getType(f));
  });

  var select = document.getElementById("crimeFilter");

  select.innerHTML = '<option value="all">All Crimes</option>';

  types.forEach(t => {
    select.innerHTML += `<option value="${t}">${t}</option>`;
  });
}

function getCityCenter(city) {
  switch(city) {
    case "austin": return [30.27, -97.74];
    default: return [29.76, -95.37];
  }
}

// 🚀 Load default
loadCityData();