var map = L.map('map').fitWorld();

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);
// Try to locate the user
map.locate({setView: true, maxZoom: 16});
// When location found, add a marker and circle to show the accuracy
function onLocationFound(e) {
    var radius = e.accuracy;

    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(map);
}
map.on('locationfound', onLocationFound);
// If location not found, alert the user
function onLocationError(e) {
    alert(e.message);
}
map.on('locationerror', onLocationError);