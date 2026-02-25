"use client";

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Loader2, Navigation } from 'lucide-react';

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
                    placeholder="Search campus or landmark..."
                    className="w-full bg-[#1a1d2b]/90 backdrop-blur-md border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-white shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-gray-500"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-400 transition-colors">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </div>
            </form>
        </div>
    );
}

export default function AttendanceMap({ userLocation, geofences, isAdmin, onMapClick, draftingGeofence }: AttendanceMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [localDraftPos, setLocalDraftPos] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        if (draftingGeofence) {
            setLocalDraftPos({ lat: draftingGeofence.latitude, lng: draftingGeofence.longitude });
        } else {
            setLocalDraftPos(null);
        }
    }, [draftingGeofence?.latitude, draftingGeofence?.longitude]);

    if (!isMounted) return (
        <div className="h-[450px] rounded-xl animate-pulse" style={{ background: 'var(--bg-input)' }} />
    );

    const getCenter = (): [number, number] => {
        if (geofences && geofences.length > 0) {
            const valid = geofences.filter(gf => gf.latitude !== 0 && gf.longitude !== 0);
            if (valid.length > 0) return [valid[0].latitude, valid[0].longitude];
        }
        if (!userLocation) return [11.4986, 77.2743];
        return [userLocation.lat, userLocation.lng];
    };

    const currentCenter = getCenter();

    return (
        <div className="h-[500px] w-full map-container overflow-hidden rounded-xl border border-white/5 shadow-2xl relative"
            style={{ background: '#0b0c10' }}>
            <MapContainer
                center={currentCenter}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                zoomControl={false}
                className="high-density-map"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <SearchControl onLocationSelect={(lat, lng) => isAdmin && onMapClick?.(lat, lng)} />

                <ChangeView center={currentCenter} />
                <MapEvents onClick={onMapClick} />

                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={icon || undefined}>
                        <Popup className="dark-popup">Your current GPS location</Popup>
                    </Marker>
                )}

                {geofences.map((gf) => (
                    <Circle
                        key={gf.id}
                        center={[gf.latitude, gf.longitude]}
                        radius={gf.radius}
                        pathOptions={{ color: '#635bff', fillColor: '#635bff', fillOpacity: 0.12, weight: 2 }}
                    >
                        <Popup className="dark-popup">
                            <div className="text-white">
                                <div className="font-bold text-sm">{gf.name}</div>
                                <div className="text-[10px] opacity-60 mt-0.5">{gf.radius}m Safe Zone</div>
                            </div>
                        </Popup>
                    </Circle>
                ))}

                {draftingGeofence && localDraftPos && (
                    <>
                        <Circle
                            center={[localDraftPos.lat, localDraftPos.lng]}
                            radius={draftingGeofence.radius}
                            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2, weight: 2, dashArray: '6, 8' }}
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
                                Drag to position fence
                            </Tooltip>
                        </Marker>
                    </>
                )}
            </MapContainer>

            {/* Quick action buttons */}
            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
                <button
                    onClick={() => {
                        if (userLocation) {
                            // Find the map instance and fly to user
                            // This would require a ref to map, but ChangeView handles center updates
                            // For immediate effect:
                            onMapClick?.(userLocation.lat, userLocation.lng);
                        }
                    }}
                    className="w-12 h-12 rounded-2xl bg-[#635bff] text-white flex items-center justify-center shadow-lg hover:bg-[#5046e5] transition-all transform hover:scale-105 active:scale-95"
                >
                    <Navigation size={20} fill="white" />
                </button>
            </div>
        </div>
    );
}
