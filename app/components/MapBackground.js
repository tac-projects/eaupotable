'use client';

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const mapboxToken = 'pk.eyJ1IjoiY3Jhenl0YXJwZSIsImEiOiJjbW5wdDczZHQwMDc4MnJxeXN2OTMzYmFlIn0.V2B4cX82xIQntOorHu0XSA';

export default function MapBackground({ onMapLoad, initialCity }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Report de l'initialisation lourde de Mapbox pour libérer le thread principal au démarrage (TBT Optimization)
    const timer = setTimeout(() => {
        mapboxgl.accessToken = mapboxToken;
        const m = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [2.2137, 46.2276],
          zoom: 5.0,
          projection: 'globe',
          interactive: false
        });

        m.on('style.load', () => { 
          m.setFog({}); 
        });

        m.on('load', () => {
          const layers = m.getStyle().layers;
          for (let layer of layers) {
            if (layer.layout && layer.layout['text-field']) {
              m.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name_fr'], ['get', 'name']]);
            }
          }
          mapRef.current = m;
          setIsMapLoaded(true); // Retrait du placeholder
          if (onMapLoad) onMapLoad(m);
        });
    }, 4000);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [onMapLoad]);

  // Sync zoom for initialCity if map is already loaded
  useEffect(() => {
    if (!mapRef.current || !initialCity) return;
    
    const fetchAndZoom = async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(initialCity)}.json?access_token=${mapboxToken}&country=FR&types=place&language=fr&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features?.length > 0) {
          const feature = data.features[0];
          mapRef.current.flyTo({ center: feature.center, zoom: 13, essential: true });
        }
      } catch (err) { 
        console.error("Zoom error", err); 
      }
    };
    fetchAndZoom();
  }, [initialCity, isMapLoaded]);

  return (
    <>
      {!isMapLoaded && (
        <div className="map-skeleton">
          <div className="skeleton-content">
            <div className="skeleton-ripple"></div>
          </div>
        </div>
      )}
      <div id="map" ref={mapContainerRef} style={{ width: '100%', height: '100%', opacity: isMapLoaded ? 1 : 0, transition: 'opacity 1s ease' }}></div>
    </>
  );
}
