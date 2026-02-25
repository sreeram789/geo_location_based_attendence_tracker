/**
 * PerimeterBadge.tsx
 * 
 * Displays whether the user is inside or outside the geofence boundary.
 * Shows distance info for operational awareness.
 */

'use client';

import React from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { Coordinates, GeofenceTarget } from '@/lib/locationService';
import { checkPerimeter } from '@/lib/locationService';

interface PerimeterBadgeProps {
    userLocation: Coordinates | null;
    geofence: GeofenceTarget | null;
    /** compact = inline badge, full = card with distance detail */
    variant?: 'compact' | 'full';
}

export default function PerimeterBadge({ userLocation, geofence, variant = 'full' }: PerimeterBadgeProps) {
    // Not enough data
    if (!userLocation || !geofence) {
        if (variant === 'compact') {
            return (
                <span className="badge" style={{ background: 'var(--bg-badge)', color: 'var(--text-tertiary)' }}>
                    <Loader2 size={12} className="mr-1.5 animate-spin" /> Locating…
                </span>
            );
        }
        return (
            <div className="p-4 rounded-xl flex items-center gap-3 animate-pulse-subtle"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Acquiring position…</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Waiting for GPS signal</p>
                </div>
            </div>
        );
    }

    const result = checkPerimeter(userLocation, geofence);

    // ── Compact variant ──────────────────────────────────────
    if (variant === 'compact') {
        return (
            <span className={`badge ${result.inside ? 'badge--active' : ''}`}
                style={!result.inside ? { background: 'var(--danger-light)', color: '#dc2626' } : {}}>
                {result.inside ? (
                    <><CheckCircle2 size={12} className="mr-1.5" /> Inside Perimeter</>
                ) : (
                    <><XCircle size={12} className="mr-1.5" /> Outside ({result.distance}m)</>
                )}
            </span>
        );
    }

    // ── Full variant ─────────────────────────────────────────
    return (
        <div className="p-4 rounded-xl flex items-center gap-4 transition-all"
            style={{
                background: result.inside ? 'var(--success-light)' : 'var(--danger-light)',
                border: `1px solid ${result.inside ? '#a7f3d0' : '#fecaca'}`,
            }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                    background: result.inside ? 'var(--success-glow)' : 'rgba(239,68,68,0.12)',
                }}>
                {result.inside ? (
                    <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
                ) : (
                    <XCircle size={22} style={{ color: 'var(--danger)' }} />
                )}
            </div>
            <div>
                <p className="text-sm font-semibold"
                    style={{ color: result.inside ? '#15803d' : '#dc2626' }}>
                    {result.inside ? 'Inside Campus Boundary' : 'Outside Perimeter'}
                </p>
                <p className="text-[11px] font-medium mt-0.5"
                    style={{ color: result.inside ? '#16a34a' : '#ef4444', opacity: 0.7 }}>
                    {result.inside
                        ? `${result.distance}m from center · ${geofence.radius}m radius`
                        : `${Math.abs(result.overshoot)}m outside boundary · Move closer to check in`
                    }
                </p>
            </div>
        </div>
    );
}
