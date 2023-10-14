/* eslint-disable */

export async function initMap() {
  // Request needed libraries.
  //@ts-ignore
  var map;

  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );

  const { Map } = await google.maps.importLibrary('maps');
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
  const bounds = new google.maps.LatLngBounds();

  // The map, centered at first element
  map = new Map(document.getElementById('map'), {
    zoom: 12,
    mapId: '6e97189f64439a21'
  });

  let marker, positions;
  locations.forEach(item => {
    positions = new google.maps.LatLng(
      item.coordinates[1],
      item.coordinates[0]
    );

    marker = new AdvancedMarkerElement({
      map: map,
      position: positions,
      title: item.description
    });

    bounds.extend(positions);

    google.maps.event.addListener(
      marker,
      'click',
      (function(marker, item) {
        return function() {
          var infoWindow = new google.maps.InfoWindow();
          infoWindow.setContent(item.description);
          infoWindow.open(map, marker);
        };
      })(marker, item)
    );
  });

  map.fitBounds(bounds, { top: 200, right: 100, left: 100 });
}
