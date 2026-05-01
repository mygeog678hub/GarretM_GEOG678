// ==========================
// INITIAL MAP SETUP
// ==========================
var map = L.map('mapid').setView([29.6201, -95.5302], 13);

// ==========================
// BASEMAPS
// ==========================
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
});

var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenTopoMap contributors'
});

var satellite = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { attribution: 'Tiles &copy; Esri' }
);

// Default layer
osm.addTo(map);

// Layer control
var baseMaps = {
  "Street Map": osm,
  "Topographic": topo,
  "Satellite": satellite
};

L.control.layers(baseMaps, null, { collapsed: false }).addTo(map);

// ==========================
// GLOBAL VARIABLES
// ==========================
var points = [];
var markers = [];
var heatLayer;

// ==========================
// SAMPLE POINTS (optional)
// ==========================
var samplePoints = [
  [29.6201, -95.5302],
  [29.6152, -95.5401],
  [29.6223, -95.5250],
  [29.6105, -95.5455],
  [29.6189, -95.5502],
  [29.6250, -95.5350],
  [29.6130, -95.5280],
  [29.6195, -95.5200],
  [29.6170, -95.5600],
  [29.6235, -95.5485]
];

// Load sample points
samplePoints.forEach(p => addPoint(p));

// ==========================
// ADD POINT FUNCTION
// ==========================
function addPoint(latlng) {
  var marker = L.circleMarker(latlng, {
    radius: 6,
    color: "black",
    fillColor: "red",
    fillOpacity: 0.8
  }).addTo(map);

  markers.push(marker);
  points.push(latlng);
}

// Click to add new points
map.on('click', function(e) {
  addPoint([e.latlng.lat, e.latlng.lng]);
});

// ==========================
// SEARCH FUNCTION (NATIONWIDE)
// ==========================
function searchLocation() {
  var query = document.getElementById("searchBox").value;

  var url = "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=" 
            + encodeURIComponent(query);

  fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log("Search result:", data);

      if (data && data.length > 0) {
        var lat = parseFloat(data[0].lat);
        var lon = parseFloat(data[0].lon);

        map.setView([lat, lon], 14);
      } else {
        alert("Location not found. Try city + state (e.g., 'Missouri City, TX').");
      }
    })
    .catch(err => console.error("Geocode error:", err));
}

// ==========================
// ANALYSIS FUNCTION
// ==========================
function analyze() {

  if (points.length === 0) {
    alert("Add some crime points first.");
    return;
  }

  if (heatLayer) {
    map.removeLayer(heatLayer);
  }

  var heatData = [];
  var gridSize = 0.01;

  var bounds = map.getBounds();

  var south = bounds.getSouth();
  var north = bounds.getNorth();
  var west = bounds.getWest();
  var east = bounds.getEast();

  for (var lat = south; lat < north; lat += gridSize) {
    for (var lng = west; lng < east; lng += gridSize) {

      var score = 0;

      points.forEach(p => {

        var d = getDistance(lat, lng, p[0], p[1]);

        var buffer = 0.5; // buffer zone (km)
        var k = 1.2;      // decay factor

        if (d > buffer) {
          score += 1 / Math.pow(d, k);
        }

      });

      heatData.push([lat, lng, score * 100]);
    }
  }

  heatLayer = L.heatLayer(heatData, {
    radius: 25,
    blur: 20,
    gradient: {
      0.2: "blue",
      0.5: "orange",
      0.8: "red"
    }
  }).addTo(map);
}

// ==========================
// DISTANCE FUNCTION
// ==========================
function getDistance(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ==========================
// CLEAR FUNCTION
// ==========================
function clearPoints() {

  markers.forEach(m => map.removeLayer(m));
  markers = [];
  points = [];

  if (heatLayer) {
    map.removeLayer(heatLayer);
  }
}