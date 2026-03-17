/**
 * LocationGate.tsx
 * 
 * Wraps page content and shows a blocking UI if GPS permission
 * is not yet granted. Admins can optionally bypass the gate.
 * Styled with a warm, cottagecore aesthetic.
 */

'use client';

import React from 'react';
import { MapPin, ShieldAlert, WifiOff, Clock, RefreshCw, ArrowRight, Satellite, AlertTriangle, Leaf } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center font-sans px-6 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #faf8f5 0%, #f5f0e8 100%)' }}>
            
            {/* Decorative botanical elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Top left decoration */}
                <div className="absolute -top-20 -left-20 w-80 h-80 opacity-15">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-[#6b8f71]">
                        <path fill="currentColor" d="M50,100 Q30,60 50,20 Q70,60 50,100" />
                        <path fill="currentColor" d="M50,100 Q20,80 10,50 Q40,70 50,100" opacity="0.7" />
                        <path fill="currentColor" d="M50,100 Q80,80 90,50 Q60,70 50,100" opacity="0.7" />
                    </svg>
                </div>
                
                {/* Bottom right decoration */}
                <div className="absolute -bottom-20 -right-20 w-72 h-72 opacity-10">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-[#c4a77d]">
                        <ellipse cx="100" cy="80" rx="40" ry="60" fill="currentColor" transform="rotate(30 100 100)" />
                        <ellipse cx="100" cy="80" rx="35" ry="50" fill="currentColor" opacity="0.5" transform="rotate(-20 100 100)" />
                    </svg>
                </div>
                
                {/* Floating leaves */}
                <div className="absolute top-1/4 left-10 animate-float opacity-20">
                    <Leaf className="w-6 h-6 text-[#6b8f71]" />
                </div>
                <div className="absolute top-1/3 right-16 animate-float" style={{ animationDelay: "1s", opacity: 0.15 }}>
                    <Leaf className="w-5 h-5 text-[#c4a77d]" />
                </div>
            </div>

            <div className="w-full max-w-md text-center animate-fade-in relative z-10">
                {/* Icon */}
                <div className="mx-auto mb-8 w-24 h-24 rounded-2xl flex items-center justify-center relative"
                    style={{ 
                        background: config.iconBg,
                        border: `1px solid ${config.iconBorder}`,
                        boxShadow: config.iconGlow
                    }}>
                    <config.Icon size={40} style={{ color: config.iconColor }} />
                    
                    {/* Gentle pulse animation for requesting state */}
                    {status === 'requesting' && (
                        <div className="absolute inset-0 rounded-2xl animate-gentle-pulse"
                            style={{ 
                                border: '2px solid #6b8f71',
                                opacity: 0.5
                            }} />
                    )}
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                    style={{ 
                        background: config.badgeBg,
                        border: `1px solid ${config.badgeBorder}`
                    }}>
                    <div className={`w-2 h-2 rounded-full ${status === 'requesting' ? 'animate-gentle-pulse' : ''}`}
                        style={{ 
                            background: config.badgeDot,
                            boxShadow: `0 0 8px ${config.badgeDot}`
                        }} />
                    <span className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: config.badgeColor, fontFamily: 'Crimson Pro, Georgia, serif' }}>
                        {config.badgeText}
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-semibold mb-3"
                    style={{ 
                        color: '#3d3229', 
                        fontFamily: 'Playfair Display, Georgia, serif',
                    }}>
                    {config.title}
                </h2>

                {/* Subtitle */}
                <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto text-[#6b5d4d]">
                    {config.subtitle}
                </p>

                {/* Loading spinner for 'requesting' */}
                {status === 'requesting' && (
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="w-12 h-12 border-[3px] rounded-full animate-spin"
                                style={{
                                    borderColor: '#e8dfd2',
                                    borderTopColor: '#6b8f71',
                                }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Leaf size={16} className="text-[#6b8f71]" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error detail */}
                {error && status !== 'requesting' && (
                    <div className="mb-6 p-4 rounded-xl text-xs font-medium text-left"
                        style={{
                            background: '#fcf2f2',
                            border: '1px solid rgba(201, 137, 137, 0.3)',
                            color: '#8a5a5a',
                        }}>
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                {status !== 'requesting' && (
                    <div className="space-y-4">
                        <button onClick={onRetry}
                            className="btn-primary w-full flex items-center justify-center gap-3">
                            <RefreshCw size={18} /> 
                            <span>Try Again</span>
                        </button>

                        {allowBypass && (
                            <button onClick={onBypass}
                                className="btn-ghost w-full flex items-center justify-center gap-2">
                                Continue without GPS <ArrowRight size={14} />
                            </button>
                        )}
                    </div>
                )}

                {/* Hint for denied */}
                {status === 'denied' && (
                    <div className="mt-8 p-5 rounded-xl text-xs leading-relaxed text-left"
                        style={{ 
                            background: '#f8f5f0', 
                            color: '#9a8b7a',
                            border: '1px solid #e8dfd2'
                        }}>
                        <strong className="text-[#6b8f71]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                            How to Enable:
                        </strong>
                        <p className="mt-2">
                            Click the lock icon in your browser's address bar → Site settings → Location → Allow
                        </p>
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
                Icon: Satellite,
                iconBg: '#e8f0e6',
                iconBorder: 'rgba(107, 143, 113, 0.2)',
                iconColor: '#6b8f71',
                iconGlow: '0 4px 20px rgba(107, 143, 113, 0.15)',
                title: 'Finding Your Location',
                subtitle: 'GeoTrack needs your GPS location to verify attendance within garden boundaries. Please allow access when prompted.',
                badgeBg: '#e8f0e6',
                badgeBorder: 'rgba(107, 143, 113, 0.2)',
                badgeColor: '#6b8f71',
                badgeDot: '#6b8f71',
                badgeText: 'Locating',
            };
        case 'denied':
            return {
                Icon: ShieldAlert,
                iconBg: '#fcf2f2',
                iconBorder: 'rgba(201, 137, 137, 0.2)',
                iconColor: '#c98989',
                iconGlow: '0 4px 20px rgba(201, 137, 137, 0.15)',
                title: 'Location Access Denied',
                subtitle: 'GPS access is required for attendance validation. Please enable location permissions to continue.',
                badgeBg: '#fcf2f2',
                badgeBorder: 'rgba(201, 137, 137, 0.2)',
                badgeColor: '#c98989',
                badgeDot: '#c98989',
                badgeText: 'Blocked',
            };
        case 'unavailable':
            return {
                Icon: WifiOff,
                iconBg: '#fdf5eb',
                iconBorder: 'rgba(212, 165, 116, 0.2)',
                iconColor: '#d4a574',
                iconGlow: '0 4px 20px rgba(212, 165, 116, 0.15)',
                title: 'Signal Unavailable',
                subtitle: error || 'Your device could not determine its position. Check that GPS is enabled on your device.',
                badgeBg: '#fdf5eb',
                badgeBorder: 'rgba(212, 165, 116, 0.2)',
                badgeColor: '#d4a574',
                badgeDot: '#d4a574',
                badgeText: 'Offline',
            };
        case 'timeout':
            return {
                Icon: Clock,
                iconBg: '#fdf5eb',
                iconBorder: 'rgba(212, 165, 116, 0.2)',
                iconColor: '#d4a574',
                iconGlow: '0 4px 20px rgba(212, 165, 116, 0.15)',
                title: 'Connection Timeout',
                subtitle: 'The GPS signal took too long to acquire. Move to an area with better reception and try again.',
                badgeBg: '#fdf5eb',
                badgeBorder: 'rgba(212, 165, 116, 0.2)',
                badgeColor: '#d4a574',
                badgeDot: '#d4a574',
                badgeText: 'Timeout',
            };
        default:
            return {
                Icon: MapPin,
                iconBg: '#f8f5f0',
                iconBorder: '#e8dfd2',
                iconColor: '#9a8b7a',
                iconGlow: 'none',
                title: 'Location Required',
                subtitle: 'Please enable GPS access to use GeoTrack.',
                badgeBg: '#f0ebe3',
                badgeBorder: '#e8dfd2',
                badgeColor: '#9a8b7a',
                badgeDot: '#9a8b7a',
                badgeText: 'Pending',
            };
    }
}
