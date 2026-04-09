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
        .bindPopup("You are within " + radius.toFixed(2) + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(map);
}
map.on('locationfound', onLocationFound);
// If location not found, alert the user
function onLocationError(e) {
    alert(e.message);
}
map.on('locationerror', onLocationError);
// Add a circle to the map at a specific location with a given radius and styling
var circle = L.circle([30.60982, -96.34033], {
    color: 'blue',
    fillColor: '#500000',
    fillOpacity: 0.5,
    radius: 200
}).addTo(map);
circle.bindPopup("Kyle Field; Home of the Texas A&M Aggies Football Team.");

var LeafIcon = L.Icon.extend({
    options: {
        shadowUrl: 'https://leafletjs.com/examples/custom-icons/leaf-shadow.png',
        iconSize:     [38, 95],
        shadowSize:   [50, 64],
        iconAnchor:   [22, 94],
        shadowAnchor: [4, 62],
        popupAnchor:  [-3, -76]
    }
});

// Create all leaf icons from the LeafIcon class
var greenIcon = new LeafIcon({iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-green.png'}),
    redIcon   = new LeafIcon({iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-red.png'})
    

// Add markers with popups
var markers = [
    L.marker([30.61575, -96.34072], {icon: greenIcon}).bindPopup("Academic Building; Home of the Texas A&M University College of Engineering."),
    L.marker([30.61768, -96.33672], {icon: redIcon}).bindPopup("Eller Oceanography & Meteorology Building; Home of the Texas A&M University Department of Atmospheric Sciences."),
];
// Add markers to map
markers.forEach(function(marker) {
    marker.addTo(map);
});
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