var map = L.map('mapid').setView([30.61, -96.34], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var crimeLayer;
var crimeData;

// Load data
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    crimeData = data;
    drawData(data);
  });

function drawData(data) {
  if (crimeLayer) {
    crimeLayer.clearLayers();
  }

  crimeLayer = L.geoJSON(data, {

    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 6,
        fillColor: getColor(feature.properties.type),
        color: "#000",
        weight: 1,
        fillOpacity: 0.8
      });
    },

    onEachFeature: function (feature, layer) {
      layer.bindPopup(
        `<b>${feature.properties.type}</b><br>
         ${feature.properties.date}<br>
         ${feature.properties.description}`
      );
    }

  }).addTo(map);
}

function getColor(type) {
  switch(type) {
    case "Theft": return "orange";
    case "Assault": return "red";
    case "Burglary": return "purple";
    default: return "gray";
  }
}

// Filter
function filterCrime() {
  var selected = document.getElementById("crimeFilter").value;

  var filtered = crimeData.features.filter(f => {
    return selected === "all" || f.properties.type === selected;
  });

  drawData({
    type: "FeatureCollection",
    features: filtered
  });
}

// Search
function searchCrime() {
  var input = document.getElementById("searchInput").value.toLowerCase();

  crimeLayer.eachLayer(function (layer) {
    var props = layer.feature.properties;

    if (
      props.type.toLowerCase().includes(input) ||
      props.description.toLowerCase().includes(input)
    ) {
      map.fitBounds(layer.getBounds());
      layer.openPopup();
    }
  });
}