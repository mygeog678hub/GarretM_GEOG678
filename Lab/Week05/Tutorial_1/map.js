// Javascript file to create a map using Leaflet
// Create a map object and set the view to a specific location and zoom level
var map = L.map('map').setView([51.505, -0.09], 13);
// Add a tile layer to the map (using OpenStreetMap tiles)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// Add a marker to the map at a specific location
var marker = L.marker([51.5, -0.09]).addTo(map);
// Add a circle to the map at a specific location with a given radius and styling
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);
// Add a polygon to the map with specified vertices and stylingvar polygon = L.polygon([
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);
// Bind a popup to the marker with some textmarker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");
// Add a popup layer to the map that opens when the map is clicked
var popup = L.popup()
    .setLatLng([51.513, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);
// Add an event listener to the map that triggers a function when the map is clicked
function onMapClick(e) {
    alert("You clicked the map at " + e.latlng);
}

map.on('click', onMapClick);

var popup = L.popup();

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}
// Add an event listener to the map that triggers a function when the map is clicked
map.on('click', onMapClick);