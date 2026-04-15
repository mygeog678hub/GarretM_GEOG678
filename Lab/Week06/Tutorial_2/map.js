// Create a map centered on the United States
var map = L.map('map').setView([37.8, -96], 4);
// Add OpenStreetMap tile layer
var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// Add GeoJSON layer to the map
L.geoJson(statesData).addTo(map);
// Function to get color based on population density
function getColor(d) {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
}
// Set the style of the GeoJSON layer
function style(feature) {
    return {
        fillColor: getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}
L.geoJson(statesData, {style: style}).addTo(map);
// Add interactivity
function highlightFeature(e) {
    var layer = e.target;
    info.update(layer.feature.properties);
// Set the style for the highlighted feature
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
// Bring the highlighted layer to the front
    layer.bringToFront();
}
// Reset highlight on mouseout
function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}
var geojson;
// ... our listeners
geojson = L.geoJson(statesData);
// Zoom to feature on click
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
geojson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);
// Add info control to the map
var info = L.control();
// Create the info control
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};
// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>US Population Density</h4>' +  (props ?
        '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>'
        : 'Hover over a state');
};
info.addTo(map);
// Add legend to the map
var legend = L.control({position: 'bottomright'});
// Create the legend
legend.onAdd = function (map) {
// Create a div element for the legend
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [];
    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
};
// Add the legend to the map
legend.addTo(map);

