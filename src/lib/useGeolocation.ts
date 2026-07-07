import { useCallback, useRef, useState } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export type GeoStatus = "idle" | "locating" | "tracking" | "error";

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("idle");
  }, []);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      setStatus("error");
      return;
    }
    setError(null);
    setStatus("locating");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("tracking");
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        setStatus("error");
        setError(err.message || "Unable to retrieve your location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      }
    );
  }, []);

  return { status, position, error, start, stop };
}
