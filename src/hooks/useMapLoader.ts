import { useJsApiLoader } from '@react-google-maps/api';
import { mapConfig } from '../utils/mapConfig';

export const useMapLoader = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: mapConfig.googleMapsApiKey,
    libraries: mapConfig.libraries,
  });

  return { isLoaded, loadError };
};
