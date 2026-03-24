export const mapConfig = {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  defaultCenter: {
    lat: 40.7128,
    lng: -74.0060,
  },
  defaultZoom: 15,
  libraries: ['places', 'geometry'] as ("places" | "geometry" | "drawing" | "visualization")[],
  mapOptions: {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  },
};
