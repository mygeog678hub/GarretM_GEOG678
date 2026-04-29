
      // TAMU coordinates: 30.6188, -96.3365
      var map = L.map('mapid').setView([30.6121, -96.3455], 15);
   
      
      // Using OpenStreetMap tiles instead of Mapbox (no token needed)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);


      // Create info control
      var info = L.control();
      
      info.onAdd = function(map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
      };
      
      info.update = function(props) {
        this._div.innerHTML = '<h4>TAMU Building Info</h4>' + 
          (props ? 
            '<b>' + props.BldgName + '</b><br />Abbreviation: ' + props.BldgAbbr :
            'Hover over a building');
      };
      
      info.addTo(map);
      
      // Style for buildings
      function style(feature) {
        return {
          weight: 2,
          opacity: 1,
          color: '#500000', // Maroon color
          dashArray: '3',
          fillOpacity: 0.7,
          fillColor: '#500000' // Maroon fill
        };
      }
      
      // Highlight function
      function highlightFeature(e) {
        var layer = e.target;
        
        layer.setStyle({
          weight: 3,
          color: '#FBF719', // Bright yellow border
          dashArray: '',
          fillOpacity: 0.9
        });
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
        }
        
        info.update(layer.feature.properties);
      }
      
      // Reset highlight
      function resetHighlight(e) {
        buildingsLayer.resetStyle(e.target);
        info.update();
      }
      
      // Zoom to feature
      function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
      }
      
      // Set listeners for each feature
      function onEachFeature(feature, layer) {
        layer.on({
          mouseover: highlightFeature,
          mouseout: resetHighlight,
          click: zoomToFeature
        });
      }
      
      // Add GeoJSON layer with the styling and interactions
      var buildingsLayer = L.geoJSON(tamu, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);
    // Invalidate size after a short delay to ensure proper rendering
    window.addEventListener("load", function () {
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
});