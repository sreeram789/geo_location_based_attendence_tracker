/**
 * PerimeterBadge.tsx
 * 
 * Displays whether the user is inside or outside the geofence boundary.
 * Shows distance info with a warm, cottagecore aesthetic.
 */

'use client';

import React from 'react';
import { CheckCircle2, XCircle, Loader2, Shield, AlertTriangle, MapPin } from 'lucide-react';
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
                <span className="badge badge--inactive">
                    <Loader2 size={12} className="mr-1.5 animate-spin" /> 
                    <span style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '11px' }}>Locating...</span>
                </span>
            );
        }
        return (
            <div className="p-5 rounded-xl flex items-center gap-4"
                style={{ 
                    background: '#faf8f5', 
                    border: '1px solid #e8dfd2'
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ 
                        background: '#f5f0e8',
                        border: '1px solid #e8dfd2'
                    }}>
                    <Loader2 size={22} className="animate-spin text-[#6b8f71]" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-[#3d3229]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                        Acquiring Position
                    </p>
                    <p className="text-xs mt-1 text-[#9a8b7a]">
                        Waiting for GPS signal...
                    </p>
                </div>
            </div>
        );
    }

    const result = checkPerimeter(userLocation, geofence);

    // ── Compact variant ──────────────────────────────────────
    if (variant === 'compact') {
        return (
            <span className={result.inside ? 'badge badge--active' : 'badge badge--danger'}>
                {result.inside ? (
                    <><CheckCircle2 size={12} className="mr-1.5" /> <span style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '11px' }}>Inside</span></>
                ) : (
                    <><XCircle size={12} className="mr-1.5" /> <span style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '11px' }}>Outside {result.distance}m</span></>
                )}
            </span>
        );
    }

    // ── Full variant ─────────────────────────────────────────
    return (
        <div className="p-5 rounded-xl flex items-center gap-4 transition-all relative overflow-hidden"
            style={{
                background: result.inside ? '#eef5ee' : '#fcf2f2',
                border: `1px solid ${result.inside ? 'rgba(122, 159, 122, 0.3)' : 'rgba(201, 137, 137, 0.3)'}`,
            }}>
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-5"
                style={{
                    background: `radial-gradient(circle at 0% 50%, ${result.inside ? '#7a9f7a' : '#c98989'} 0%, transparent 50%)`
                }} />
            
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative"
                style={{
                    background: result.inside ? 'rgba(122, 159, 122, 0.1)' : 'rgba(201, 137, 137, 0.1)',
                    border: result.inside ? '1px solid rgba(122, 159, 122, 0.2)' : '1px solid rgba(201, 137, 137, 0.2)',
                }}>
                {result.inside ? (
                    <Shield size={24} className="text-[#7a9f7a]" />
                ) : (
                    <AlertTriangle size={24} className="text-[#c98989]" />
                )}
            </div>
            <div className="relative z-10">
                <p className="text-sm font-semibold"
                    style={{ 
                        color: result.inside ? '#5a7a5a' : '#8a5a5a',
                        fontFamily: 'Playfair Display, Georgia, serif',
                    }}>
                    {result.inside ? 'Within Garden Perimeter' : 'Outside Garden Boundary'}
                </p>
                <p className="text-xs font-medium mt-1"
                    style={{ color: result.inside ? '#7a9f7a' : '#c98989', opacity: 0.9 }}>
                    {result.inside
                        ? `${result.distance}m from center · ${geofence.radius}m safe zone`
                        : `${Math.abs(result.overshoot)}m outside boundary · Move closer to check in`
                    }
                </p>
            </div>
            
            {/* Status Indicator */}
            <div className="ml-auto flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${result.inside ? '' : 'animate-gentle-pulse'}`}
                    style={{
                        background: result.inside ? '#7a9f7a' : '#c98989',
                        boxShadow: result.inside ? '0 0 8px rgba(122, 159, 122, 0.5)' : '0 0 8px rgba(201, 137, 137, 0.5)'
                    }} />
            </div>
        </div>
    );
}
