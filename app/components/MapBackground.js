'use client';

import { useEffect, useRef } from 'react';

const mapboxToken = 'pk.eyJ1IjoiY3Jhenl0YXJwZSIsImEiOiJjbW5wdDczZHQwMDc4MnJxeXN2OTMzYmFlIn0.V2B4cX82xIQntOorHu0XSA';

// Interactions utilisateur qui déclenchent le chargement de Mapbox
const INTERACTION_EVENTS = ['scroll', 'mousemove', 'touchstart', 'keydown', 'click'];

export default function MapBackground({ onMapLoad, onMapReady, initialCity }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const onMapLoadRef = useRef(onMapLoad);
  const onMapReadyRef = useRef(onMapReady);
  const initialCityRef = useRef(initialCity);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initMap = async () => {
      // Guard : une seule initialisation possible
      if (isInitialized.current || !mapContainerRef.current) return;
      isInitialized.current = true;

      // Retrait des listeners dès la première interaction
      INTERACTION_EVENTS.forEach(e => window.removeEventListener(e, initMap));

      // Import dynamique de mapbox-gl au moment de l'interaction (réel code-split)
      const mapboxgl = (await import('mapbox-gl')).default;
      await import('mapbox-gl/dist/mapbox-gl.css');

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

        // Zoom automatique si une ville est ciblée
        const city = initialCityRef.current;
        if (city) {
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${mapboxToken}&country=FR&types=place&language=fr&limit=1`)
            .then(r => r.json())
            .then(data => {
              if (data.features?.length > 0) {
                m.flyTo({ center: data.features[0].center, zoom: 13, essential: true });
              }
            })
            .catch(() => {});
        }

        if (onMapLoadRef.current) onMapLoadRef.current(m);
        if (onMapReadyRef.current) onMapReadyRef.current();
      });
    };

    // Écoute des interactions utilisateur (passive pour ne pas bloquer le scroll)
    INTERACTION_EVENTS.forEach(e => window.addEventListener(e, initMap, { once: true, passive: true }));

    return () => {
      INTERACTION_EVENTS.forEach(e => window.removeEventListener(e, initMap));
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (e) {
        // Cleanup silencieux
      }
    };
  }, []); // [] : une seule fois au montage

  // Mise à jour de la ville sans re-déclencher l'effet principal
  useEffect(() => {
    initialCityRef.current = initialCity;
    if (!mapRef.current || !initialCity) return;
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(initialCity)}.json?access_token=${mapboxToken}&country=FR&types=place&language=fr&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data.features?.length > 0 && mapRef.current) {
          mapRef.current.flyTo({ center: data.features[0].center, zoom: 13, essential: true });
        }
      })
      .catch(() => {});
  }, [initialCity]);

  return <div id="map" ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>;
}
