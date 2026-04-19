'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const mapboxToken = 'pk.eyJ1IjoiY3Jhenl0YXJwZSIsImEiOiJjbW5wdDczZHQwMDc4MnJxeXN2OTMzYmFlIn0.V2B4cX82xIQntOorHu0XSA';

export default function MapBackground({ onMapLoad, onMapReady, initialCity }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Report de 4s de Mapbox pour libérer le thread principal au démarrage (TBT Optimization)
    const timer = setTimeout(() => {
      // Guard : si le composant a été démonté avant la fin du délai, on abandonne
      if (!mapContainerRef.current) return;

      mapboxgl.accessToken = mapboxToken;
      const m = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [2.2137, 46.2276],
        zoom: 5.0,
        projection: 'globe',
        interactive: false
      });

      m.on('style.load', () => { m.setFog({}); });

      m.on('load', () => {
        const layers = m.getStyle().layers;
        for (let layer of layers) {
          if (layer.layout && layer.layout['text-field']) {
            m.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name_fr'], ['get', 'name']]);
          }
        }
        mapRef.current = m;
        if (onMapLoad) onMapLoad(m);
        if (onMapReady) onMapReady();
      });
    }, 4000);

    return () => {
      clearTimeout(timer);
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (e) {
        // Cleanup silencieux : le composant peut avoir été démonté avant la fin de l'init
      }
    };
  }, [onMapLoad, onMapReady]);

  // Sync zoom quand la carte est prête et qu'une ville est ciblée
  useEffect(() => {
    if (!mapRef.current || !initialCity) return;
    const fetchAndZoom = async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(initialCity)}.json?access_token=${mapboxToken}&country=FR&types=place&language=fr&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features?.length > 0) {
          mapRef.current.flyTo({ center: data.features[0].center, zoom: 13, essential: true });
        }
      } catch (err) { console.error("Zoom error", err); }
    };
    fetchAndZoom();
  }, [initialCity]);

  return <div id="map" ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>;
}
