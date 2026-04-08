function main() {
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/widgets/LayerList",
        "esri/widgets/Print",
        "dojo/domReady!"
    ], function(Map, MapView, FeatureLayer, LayerList, Print) {

        var map = new Map({
            basemap: "streets"
        });
        
        var view = new MapView({
            container: "mapid",
            map: map,
            zoom: 16,
            center: [-96.345717, 30.612689]
        });

        // LayerList
        var layerList = new LayerList({
            view: view
        });
        view.ui.add(layerList, {
            position: "top-right"
        });

        // Popup template
        var constructionTemplate = {
            title: "Construction",
            content: "<b>Project Name:</b> {Name}<br><b>Start Date:</b> {StartDate}<br><b>End Date:</b> {EndDate}",
            fieldInfos: [{
                fieldName: "StartDate",
                format: { dateFormat: "long-date" }
            }, {
                fieldName: "EndDate",
                format: { dateFormat: "long-date" }
            }]
        };

        // Feature Layer
        const constructionLayer = new FeatureLayer({
            url: "https://gis.tamu.edu/arcgis/rest/services/FCOR/Construction_2018/MapServer/0",
            popupTemplate: constructionTemplate,
            title: "Construction",
            visible: true,
            opacity: 1
        });

        constructionLayer.when(function() {
            console.log("Layer loaded");
        }).catch(function(error) {
            console.error("Error loading layer:", error);
        });

        map.add(constructionLayer);

        // Print widget 
        var url = "https://gis.tamu.edu/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";

        var print = new Print({
            view: view,
            printServiceUrl: url
        });

        view.ui.add(print, {
            position: "top-left"
        });

    });
}

