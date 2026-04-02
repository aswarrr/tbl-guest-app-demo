import { useEffect, useState } from "react";

export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

type LocationState = {
  coords: DeviceLocation | null;
  loading: boolean;
  error: string;
};

let sharedState: LocationState = {
  coords: null,
  loading: false,
  error: "",
};

const listeners = new Set<(state: LocationState) => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener(sharedState);
  }
}

function resolveLocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access was denied.";
    case error.POSITION_UNAVAILABLE:
      return "Current location is unavailable.";
    case error.TIMEOUT:
      return "Timed out while getting current location.";
    default:
      return "Failed to get current location.";
  }
}

function requestCurrentLocation() {
  if (sharedState.loading || sharedState.coords || sharedState.error) {
    return;
  }

  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    sharedState = {
      coords: null,
      loading: false,
      error: "Location is not supported on this device.",
    };
    notifyListeners();
    return;
  }

  sharedState = {
    coords: null,
    loading: true,
    error: "",
  };
  notifyListeners();

  window.navigator.geolocation.getCurrentPosition(
    (position) => {
      sharedState = {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : null,
        },
        loading: false,
        error: "",
      };
      notifyListeners();
    },
    (error) => {
      sharedState = {
        coords: null,
        loading: false,
        error: resolveLocationErrorMessage(error),
      };
      notifyListeners();
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000,
    }
  );
}

export default function useCurrentLocation() {
  const [state, setState] = useState<LocationState>(sharedState);

  useEffect(() => {
    listeners.add(setState);
    requestCurrentLocation();

    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
