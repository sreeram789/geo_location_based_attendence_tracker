/**
 * locationService.ts
 * 
 * Pure utility module for browser Geolocation API.
 * No React dependencies — consumed by the useGeolocation hook and any non-React code.
 */

// ── Types ────────────────────────────────────────────────────

export type LocationStatus =
    | 'idle'
    | 'requesting'
    | 'granted'
    | 'denied'
    | 'unavailable'
    | 'timeout';

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface LocationResult {
    status: LocationStatus;
    coords: Coordinates | null;
    accuracy: number | null;
    error: string | null;
}

export interface PerimeterResult {
    inside: boolean;
    distance: number;   // meters from geofence center
    radius: number;     // geofence radius
    overshoot: number;  // how far outside (negative if inside)
}

export interface GeofenceTarget {
    latitude: number;
    longitude: number;
    radius: number;
}

// ── Constants ────────────────────────────────────────────────

const GEO_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 30000,      // Increased to 30s to allow for slower GPS locks
    maximumAge: 5000,    // Allow up to 5s old cached location for faster response
};

// ── Permission Request ───────────────────────────────────────

/**
 * Explicitly request location permission by calling getCurrentPosition.
 * This triggers the browser's permission dialog.
 * Returns a one-shot result — use watchLocation() for continuous tracking.
 */
export function requestPermission(): Promise<LocationResult> {
    return new Promise((resolve) => {
        if (!('geolocation' in navigator)) {
            resolve({
                status: 'unavailable',
                coords: null,
                accuracy: null,
                error: 'Geolocation API is not supported by this browser.',
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    status: 'granted',
                    coords: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    },
                    accuracy: position.coords.accuracy,
                    error: null,
                });
            },
            (error) => {
                resolve({
                    status: mapGeolocationError(error.code),
                    coords: null,
                    accuracy: null,
                    error: getErrorMessage(error.code),
                });
            },
            GEO_OPTIONS
        );
    });
}

// ── Continuous Watch ─────────────────────────────────────────

export type LocationUpdateCallback = (coords: Coordinates, accuracy: number) => void;
export type LocationErrorCallback = (status: LocationStatus, message: string) => void;

/**
 * Start watching the user's position continuously.
 * Returns a cleanup function to stop watching.
 */
export function watchLocation(
    onUpdate: LocationUpdateCallback,
    onError: LocationErrorCallback
): () => void {
    if (!('geolocation' in navigator)) {
        onError('unavailable', 'Geolocation API is not supported.');
        return () => { };
    }

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            onUpdate(
                { lat: position.coords.latitude, lng: position.coords.longitude },
                position.coords.accuracy
            );
        },
        (error) => {
            onError(mapGeolocationError(error.code), getErrorMessage(error.code));
        },
        GEO_OPTIONS
    );

    return () => navigator.geolocation.clearWatch(watchId);
}

// ── Haversine Distance ───────────────────────────────────────

/**
 * Calculate the great-circle distance between two points in meters.
 */
export function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6_371_000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ── Perimeter Check ──────────────────────────────────────────

/**
 * Check if user coordinates are inside a geofence perimeter.
 */
export function checkPerimeter(
    userCoords: Coordinates,
    geofence: GeofenceTarget
): PerimeterResult {
    const distance = haversineDistance(
        userCoords.lat, userCoords.lng,
        geofence.latitude, geofence.longitude
    );

    return {
        inside: distance <= geofence.radius,
        distance: Math.round(distance),
        radius: geofence.radius,
        overshoot: Math.round(distance - geofence.radius),
    };
}

// ── Internal Helpers ─────────────────────────────────────────

function mapGeolocationError(code: number): LocationStatus {
    switch (code) {
        case 1: return 'denied';       // PERMISSION_DENIED
        case 2: return 'unavailable';  // POSITION_UNAVAILABLE
        case 3: return 'timeout';      // TIMEOUT
        default: return 'unavailable';
    }
}

function getErrorMessage(code: number): string {
    switch (code) {
        case 1: return 'Location permission was denied. Please enable GPS access in your browser settings.';
        case 2: return 'Location information is currently unavailable. Please check your GPS hardware.';
        case 3: return 'Location request timed out. Please try again in a moment.';
        default: return 'An unknown location error occurred.';
    }
}
