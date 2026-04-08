function main() {
    require([
        "esri/Map",
        "esri/views/SceneView",
        "esri/layers/SceneLayer",
        "dojo/domReady!"
    ], function(Map, SceneView, SceneLayer) {

        // 1️⃣ Create the map
        var map = new Map({
            basemap: "dark-gray-vector",  // updated for 4.29
            ground: "world-elevation"
        });

        // 2️⃣ Create the SceneView
        var view = new SceneView({
            container: "mapid",
            map: map,
            camera: {
                position: [-74.0338, 40.6913, 707], // long, lat, elevation
                tilt: 81,
                heading: 50
            }
        });

        // 3️⃣ Create the SceneLayer
        var sceneLayer = new SceneLayer({
            portalItem: {
                id: "2e0761b9a4274b8db52c4bf34356911e"  // your building layer
            }
        });

        // 4️⃣ Define the symbol for coloring
        var symbol = {
            type: "mesh-3d",
            symbolLayers: [{
                type: "fill",
                material: {
                    color: "#500000"  // yellow
                },
                colorMixMode: "replace"   // forces override of textures
            }]
        };

        // 5️⃣ Apply the renderer after the layer loads
        sceneLayer.when(function() {
            sceneLayer.renderer = {
                type: "simple",
                symbol: symbol
            };
        });

        // 6️⃣ Add the SceneLayer to the map
        map.add(sceneLayer);

    });
}