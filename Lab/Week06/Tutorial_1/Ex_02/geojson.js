// ------------------ SINGLE FEATURE ------------------
var someGeojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "popupContent": "This is where the Rockies play!"
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.9941783324395, 39.75623964017022] // ✅ FIXED
    }
};

L.geoJSON(someGeojsonFeature, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    onEachFeature: onEachFeature
}).addTo(map);


// ------------------ FILTERED FEATURES ------------------
var features = [{
    "type": "Feature",
    "properties": {
        "name": "Coors Field",
        "show_on_map": true
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.9941783324395, 39.75623964017022] // ✅ FIXED
    }
}, {
    "type": "Feature",
    "properties": {
        "name": "Busch Field",
        "show_on_map": false
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.98404, 39.74621]
    }
}];

L.geoJSON(features, {
    filter: function(feature) {
        return feature.properties.show_on_map === true;
    },
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    onEachFeature: onEachFeature
}).addTo(map);