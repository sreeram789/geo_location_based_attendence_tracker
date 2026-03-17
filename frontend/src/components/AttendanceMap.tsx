"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Loader2, Navigation, MapPin } from 'lucide-react';

const icon = typeof window !== 'undefined' ? L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
}) : null;

const draftingIcon = typeof window !== 'undefined' ? L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [30, 46],
    iconAnchor: [15, 46],
    className: 'drafting-marker'
}) : null;

// Custom cottagecore user marker icon
const userIcon = typeof window !== 'undefined' ? L.divIcon({
    className: 'user-location-marker',
    html: `
        <div style="
            width: 20px;
            height: 20px;
            background: #6b8f71;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(107, 143, 113, 0.4);
            position: relative;
            border: 3px solid white;
        ">
            <div style="
                position: absolute;
                inset: -6px;
                border: 2px solid rgba(107, 143, 113, 0.3);
                border-radius: 50%;
                animation: gentle-pulse 2s ease-out infinite;
            "></div>
        </div>
        <style>
            @keyframes gentle-pulse {
                0% { transform: scale(1); opacity: 1; }
                100% { transform: scale(1.8); opacity: 0; }
            }
        </style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
}) : null;

interface AttendanceMapProps {
    userLocation: { lat: number; lng: number } | null;
    geofences: Array<{ id: number; latitude: number; longitude: number; radius: number; name: string }>;
    isAdmin?: boolean;
    onMapClick?: (lat: number, lng: number) => void;
    draftingGeofence?: { latitude: number; longitude: number; radius: number } | null;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0 || center[1] !== 0) {
            map.setView(center, zoom || map.getZoom());
            map.invalidateSize();
        }
    }, [center, map, zoom]);
    return null;
}

function MapEvents({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
    useMapEvents({ click(e) { onClick?.(e.latlng.lat, e.latlng.lng); } });
    return null;
}

// ── Search Component ──────────────────────────────────────────
function SearchControl({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const map = useMap();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                map.flyTo([lat, lng], 17);
                onLocationSelect(lat, lng);
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute top-4 left-4 z-[1000] w-full max-w-[320px]">
            <form onSubmit={handleSearch} className="relative group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search location..."
                    className="w-full py-3 pl-11 pr-4 text-sm rounded-xl focus:outline-none transition-all"
                    style={{
                        background: 'rgba(255, 252, 247, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid #e8dfd2',
                        color: '#3d3229',
                        fontFamily: 'Crimson Pro, Georgia, serif',
                        boxShadow: '0 4px 12px rgba(61, 50, 41, 0.08)'
                    }}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-[#6b8f71]">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </div>
            </form>
        </div>
    );
}

export default function AttendanceMap({ userLocation, geofences, isAdmin, onMapClick, draftingGeofence }: AttendanceMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [localDraftPos, setLocalDraftPos] = useState<{ lat: number, lng: number } | null>(null);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        if (draftingGeofence) {
            setLocalDraftPos({ lat: draftingGeofence.latitude, lng: draftingGeofence.longitude });
        } else {
            setLocalDraftPos(null);
        }
    }, [draftingGeofence?.latitude, draftingGeofence?.longitude]);

    const handleRecenter = () => {
        if (!mapInstance) return;
        
        // Priority: User location > First geofence > Default
        if (userLocation) {
            mapInstance.flyTo([userLocation.lat, userLocation.lng], 17, { duration: 1.5 });
        } else if (geofences && geofences.length > 0) {
            const valid = geofences.find(gf => gf.latitude !== 0 && gf.longitude !== 0);
            if (valid) {
                mapInstance.flyTo([valid.latitude, valid.longitude], 16, { duration: 1.5 });
            }
        }
    };

    if (!isMounted) return (
        <div className="h-[450px] rounded-2xl animate-pulse relative overflow-hidden"
            style={{ background: '#f8f5f0' }}>
            <div className="absolute inset-0 opacity-20"
                style={{
                    background: 'radial-gradient(circle at center, #6b8f71 0%, transparent 70%)'
                }} />
        </div>
    );

    const getCenter = (): [number, number] => {
        // Check user location first
        if (userLocation && userLocation.lat !== 0 && userLocation.lng !== 0) {
            return [userLocation.lat, userLocation.lng];
        }
        // Then check geofences for valid coordinates
        if (geofences && geofences.length > 0) {
            const valid = geofences.find(gf =>
                gf.latitude !== undefined &&
                gf.longitude !== undefined &&
                gf.latitude !== 0 &&
                gf.longitude !== 0 &&
                !isNaN(gf.latitude) &&
                !isNaN(gf.longitude)
            );
            if (valid) return [valid.latitude, valid.longitude];
        }
        // Default fallback
        return [11.4986, 77.2743];
    };

    const currentCenter = getCenter();

    return (
        <div className="h-[500px] w-full map-container overflow-hidden rounded-2xl relative"
            style={{ 
                background: '#f5f0e8',
                border: '1px solid #e8dfd2',
                boxShadow: '0 10px 20px -5px rgba(61, 50, 41, 0.08)'
            }}>
            <MapContainer
                center={currentCenter}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                zoomControl={false}
                ref={(map) => { if (map) setMapInstance(map); }}
            >
                {/* Light, warm map tiles - Stamen Terrain style */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <SearchControl onLocationSelect={(lat, lng) => isAdmin && onMapClick?.(lat, lng)} />

                <ChangeView center={currentCenter} />
                <MapEvents onClick={onMapClick} />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon || undefined}>
                        <Popup className="cottage-popup">
                            <div style={{ color: '#3d3229' }}>
                                <div className="font-semibold text-sm" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#6b8f71' }}>
                                    Your Position
                                </div>
                                <div className="text-xs opacity-70 mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                    {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Geofence Zones */}
                {geofences.map((gf) => (
                    <Circle
                        key={gf.id}
                        center={[gf.latitude, gf.longitude]}
                        radius={gf.radius}
                        pathOptions={{ 
                            color: '#6b8f71',
                            fillColor: '#6b8f71', 
                            fillOpacity: 0.12, 
                            weight: 2,
                            opacity: 0.6
                        }}
                    >
                        <Popup className="cottage-popup">
                            <div style={{ color: '#3d3229' }}>
                                <div className="font-semibold text-sm" style={{ fontFamily: 'Playfair Display, Georgia, serif', color: '#6b8f71' }}>
                                    {gf.name}
                                </div>
                                <div className="text-xs opacity-60 mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                    {gf.radius}m Perimeter Zone
                                </div>
                            </div>
                        </Popup>
                    </Circle>
                ))}

                {/* Drafting Geofence */}
                {draftingGeofence && localDraftPos &&
                 !isNaN(localDraftPos.lat) && !isNaN(localDraftPos.lng) && (
                    <>
                        <Circle
                            center={[localDraftPos.lat, localDraftPos.lng]}
                            radius={draftingGeofence.radius || 100}
                            pathOptions={{ 
                                color: '#c4a77d', 
                                fillColor: '#c4a77d', 
                                fillOpacity: 0.15, 
                                weight: 2, 
                                dashArray: '8, 8',
                                opacity: 0.8
                            }}
                            interactive={false}
                        />
                        <Marker
                            position={[localDraftPos.lat, localDraftPos.lng]}
                            icon={draftingIcon || undefined}
                            draggable={true}
                            autoPan={true}
                            zIndexOffset={1000}
                            eventHandlers={{
                                drag: (e) => {
                                    const pos = e.target.getLatLng();
                                    setLocalDraftPos({ lat: pos.lat, lng: pos.lng });
                                    onMapClick?.(pos.lat, pos.lng);
                                },
                                dragend: (e) => {
                                    const pos = e.target.getLatLng();
                                    setLocalDraftPos({ lat: pos.lat, lng: pos.lng });
                                    onMapClick?.(pos.lat, pos.lng);
                                }
                            }}
                        >
                            <Tooltip permanent direction="top" offset={[0, -40]} className="premium-tooltip">
                                Drag to position zone
                            </Tooltip>
                        </Marker>
                    </>
                )}
            </MapContainer>

            {/* Control Buttons */}
            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
                <button
                    onClick={handleRecenter}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, #6b8f71 0%, #5a7d61 100%)',
                        boxShadow: '0 4px 12px rgba(107, 143, 113, 0.25)'
                    }}
                    title="Recenter to your location"
                >
                    <Navigation size={20} fill="white" stroke="white" strokeWidth={2} />
                </button>
            </div>

            {/* Coordinates Display */}
            {userLocation && (
                <div className="absolute bottom-6 left-6 z-[1000] px-4 py-3 rounded-xl"
                    style={{
                        background: 'rgba(255, 252, 247, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid #e8dfd2',
                        boxShadow: '0 4px 12px rgba(61, 50, 41, 0.06)'
                    }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                        style={{ color: '#9a8b7a', fontFamily: 'Playfair Display, Georgia, serif' }}>
                        GPS Coordinates
                    </div>
                    <div className="text-xs font-mono font-medium"
                        style={{ color: '#6b8f71' }}>
                        {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                    </div>
                </div>
            )}
        </div>
    );
}
