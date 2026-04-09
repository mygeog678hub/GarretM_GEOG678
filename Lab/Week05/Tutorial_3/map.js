//  Create map
var map = L.map('map');

// Add OpenStreetMap tiles
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Define reusable LeafIcon class
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
    redIcon   = new LeafIcon({iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-red.png'}),
    orangeIcon= new LeafIcon({iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-orange.png'});

// Add markers with popups
var markers = [
    L.marker([51.5, -0.09], {icon: greenIcon}).bindPopup("I am a green leaf."),
    L.marker([51.495, -0.083], {icon: redIcon}).bindPopup("I am a red leaf."),
    L.marker([51.49, -0.1], {icon: orangeIcon}).bindPopup("I am an orange leaf.")
];

// Add markers to map
markers.forEach(function(marker) {
    marker.addTo(map);
});

// Set map view to show all markers
var group = new L.featureGroup(markers);
map.fitBounds(group.getBounds());

