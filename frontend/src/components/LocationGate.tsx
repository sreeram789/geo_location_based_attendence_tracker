/**
 * LocationGate.tsx
 * 
 * Wraps page content and shows a blocking UI if GPS permission
 * is not yet granted. Admins can optionally bypass the gate.
 */

'use client';

import React from 'react';
import { MapPin, ShieldAlert, WifiOff, Clock, RefreshCw, ArrowRight } from 'lucide-react';
import type { LocationStatus } from '@/lib/locationService';

interface LocationGateProps {
    status: LocationStatus;
    error: string | null;
    onRetry: () => void;
    /** If true, show a "Continue without GPS" option (admin only) */
    allowBypass?: boolean;
    onBypass?: () => void;
    children: React.ReactNode;
}

export default function LocationGate({
    status,
    error,
    onRetry,
    allowBypass = false,
    onBypass,
    children,
}: LocationGateProps) {
    // Granted — render children normally
    if (status === 'granted') {
        return <>{children}</>;
    }

    // Build the gate screen content based on status
    const config = getGateConfig(status, error);

    return (
        <div className="min-h-screen flex items-center justify-center font-sans px-6"
            style={{ background: 'var(--bg-page)' }}>
            <div className="w-full max-w-md text-center animate-fade-in">
                {/* Icon */}
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ background: config.iconBg }}>
                    <config.Icon size={36} style={{ color: config.iconColor }} />
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-2"
                    style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {config.title}
                </h2>

                {/* Subtitle */}
                <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto"
                    style={{ color: 'var(--text-secondary)' }}>
                    {config.subtitle}
                </p>

                {/* Loading spinner for 'requesting' */}
                {status === 'requesting' && (
                    <div className="flex justify-center mb-8">
                        <div className="w-8 h-8 border-[3px] rounded-full animate-spin"
                            style={{
                                borderColor: 'var(--border-default)',
                                borderTopColor: 'var(--primary)',
                            }}></div>
                    </div>
                )}

                {/* Error detail */}
                {error && status !== 'requesting' && (
                    <div className="mb-6 p-4 rounded-xl text-xs font-medium text-left"
                        style={{
                            background: 'var(--danger-light)',
                            border: '1px solid #fecaca',
                            color: '#b91c1c',
                        }}>
                        {error}
                    </div>
                )}

                {/* Action buttons */}
                {status !== 'requesting' && (
                    <div className="space-y-3">
                        <button onClick={onRetry}
                            className="btn-primary w-full flex items-center justify-center gap-2">
                            <RefreshCw size={16} /> Try Again
                        </button>

                        {allowBypass && (
                            <button onClick={onBypass}
                                className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                                style={{
                                    color: 'var(--text-secondary)',
                                    background: 'var(--bg-input)',
                                    border: '1px solid var(--border-default)',
                                }}>
                                Continue without GPS <ArrowRight size={14} />
                            </button>
                        )}
                    </div>
                )}

                {/* Hint for denied */}
                {status === 'denied' && (
                    <div className="mt-8 p-4 rounded-xl text-xs leading-relaxed"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-tertiary)' }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>How to enable:</strong>{' '}
                        Click the lock icon in your browser's address bar → Site settings → Location → Allow
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Gate screen configurations ───────────────────────────────

function getGateConfig(status: LocationStatus, error: string | null) {
    switch (status) {
        case 'idle':
        case 'requesting':
            return {
                Icon: MapPin,
                iconBg: 'var(--primary-light)',
                iconColor: 'var(--primary)',
                title: 'Requesting Location Access',
                subtitle: 'GeoTrack needs your GPS location to verify attendance within campus boundaries. Please allow access when prompted.',
            };
        case 'denied':
            return {
                Icon: ShieldAlert,
                iconBg: 'var(--danger-light)',
                iconColor: 'var(--danger)',
                title: 'Location Access Denied',
                subtitle: 'GPS access is required for attendance validation. Please enable location permissions to continue.',
            };
        case 'unavailable':
            return {
                Icon: WifiOff,
                iconBg: 'var(--warning-light)',
                iconColor: 'var(--warning)',
                title: 'Location Unavailable',
                subtitle: error || 'Your device could not determine its position. Check that GPS is enabled on your device.',
            };
        case 'timeout':
            return {
                Icon: Clock,
                iconBg: 'var(--warning-light)',
                iconColor: 'var(--warning)',
                title: 'Location Request Timed Out',
                subtitle: 'The GPS signal took too long to acquire. Move to an area with better reception and try again.',
            };
        default:
            return {
                Icon: MapPin,
                iconBg: 'var(--bg-input)',
                iconColor: 'var(--text-tertiary)',
                title: 'Location Required',
                subtitle: 'Please enable GPS access to use GeoTrack.',
            };
    }
}
