/**
 * useGeolocation.ts
 * 
 * React hook that wraps locationService for component consumption.
 * Handles the full lifecycle: permission request → watch → cleanup.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    requestPermission,
    watchLocation,
    type Coordinates,
    type LocationStatus,
} from '@/lib/locationService';

export interface GeolocationState {
    /** Current permission/connection status */
    status: LocationStatus;
    /** Latest coordinates (null until first fix) */
    location: Coordinates | null;
    /** GPS accuracy in meters */
    accuracy: number | null;
    /** Human-readable error message */
    error: string | null;
    /** Retry the permission request */
    retry: () => void;
}

export function useGeolocation(): GeolocationState {
    const [status, setStatus] = useState<LocationStatus>('idle');
    const [location, setLocation] = useState<Coordinates | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const startTracking = useCallback(async () => {
        // Phase 1: Request permission (triggers browser prompt)
        setStatus('requesting');
        setError(null);

        const result = await requestPermission();

        if (result.status !== 'granted') {
            setStatus(result.status);
            setError(result.error);
            return;
        }

        // Phase 2: Permission granted — set initial position
        setStatus('granted');
        setLocation(result.coords);
        setAccuracy(result.accuracy);

        // Phase 3: Start continuous watch
        const stopWatch = watchLocation(
            (coords, acc) => {
                setLocation(coords);
                setAccuracy(acc);
            },
            (errStatus, errMessage) => {
                setStatus(errStatus);
                setError(errMessage);
            }
        );

        cleanupRef.current = stopWatch;
    }, []);

    // Auto-start on mount
    useEffect(() => {
        startTracking();

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, [startTracking]);

    const retry = useCallback(() => {
        // Stop existing watch if any
        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
        startTracking();
    }, [startTracking]);

    return { status, location, accuracy, error, retry };
}
