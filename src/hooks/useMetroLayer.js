import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { getLineColor } from "../lib/metroColors";

export function useMetroLayer(mapInstance, showMetro) {
  const metroLayersRef = useRef([]);
  const metroDataRef = useRef(null);
  const [metroDataLoaded, setMetroDataLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/metro_paris.geojson");
        const text = await res.text();
        metroDataRef.current = text.trim().split("\n").map((line) => {
          try { return JSON.parse(line); } catch { return null; }
        }).filter(Boolean);
        setMetroDataLoaded(true);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !metroDataLoaded) return;

    const clearMetro = () => {
      metroLayersRef.current.forEach((layer) => layer.remove());
      metroLayersRef.current = [];
    };

    const renderMetro = () => {
      if (!metroDataRef.current) return;
      clearMetro();

      metroDataRef.current
        .filter((feature) => feature.geometry?.type === "LineString")
        .forEach((feature) => {
          try {
            const coords = feature.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
            if (coords.length < 2) return;
            const layer = L.polyline(coords, {
              color: getLineColor(feature),
              weight: 3.5,
              opacity: 0.85,
            }).addTo(mapInstance.current);
            metroLayersRef.current.push(layer);
          } catch (error) {
            console.error(error);
          }
        });
    };

    if (showMetro) renderMetro();
    else clearMetro();

    return () => clearMetro();
  }, [showMetro, metroDataLoaded, mapInstance]);
}
