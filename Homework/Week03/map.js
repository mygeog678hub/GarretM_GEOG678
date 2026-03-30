function main() {
    var mymap = L.map('mapid').setView([30.61313, -96.34467], 13);
L.tileLayer('https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=qA54rBVSxyelEXiVgNqW', {
        maxZoom: 18,
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
    }).addTo(mymap);
    var marker = L.marker([30.61699, -96.33629]).addTo(mymap);
    marker.bindPopup("<b>Hello world!</b><br>I am a popup.");
}

    