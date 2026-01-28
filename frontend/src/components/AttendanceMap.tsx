"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons in Next.js
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
    useMapEvents({
        click(e) {
            onClick?.(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function AttendanceMap({ userLocation, geofences, isAdmin, onMapClick, draftingGeofence }: AttendanceMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [localDraftPos, setLocalDraftPos] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sync local draft position with prop
    useEffect(() => {
        if (draftingGeofence) {
            setLocalDraftPos({ lat: draftingGeofence.latitude, lng: draftingGeofence.longitude });
        } else {
            setLocalDraftPos(null);
        }
    }, [draftingGeofence?.latitude, draftingGeofence?.longitude]);

    if (!isMounted) return <div className="h-[400px] bg-slate-900 animate-pulse rounded-xl border border-white/10" />;

    const getCenter = (): [number, number] => {
        if (userLocation) return [userLocation.lat, userLocation.lng];
        if (geofences && geofences.length > 0) {
            const valid = geofences.filter(gf => gf.latitude !== 0 && gf.longitude !== 0);
            if (valid.length > 0) return [valid[0].latitude, valid[0].longitude];
        }
        return [20.5937, 78.9629];
    };

    const currentCenter = getCenter();

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-white/10">
            <MapContainer
                center={currentCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ChangeView center={currentCenter} />
                <MapEvents onClick={onMapClick} />

                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={icon || undefined}>
                        <Popup>Your current GPS location</Popup>
                    </Marker>
                )}

                {geofences.map((gf) => (
                    <Circle
                        key={gf.id}
                        center={[gf.latitude, gf.longitude]}
                        radius={gf.radius}
                        pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.15, weight: 2 }}
                    >
                        <Popup>
                            <div className="text-slate-900 font-bold">{gf.name}</div>
                            <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">{gf.radius}m Radius</div>
                        </Popup>
                    </Circle>
                ))}

                {draftingGeofence && localDraftPos && (
                    <>
                        <Circle
                            center={[localDraftPos.lat, localDraftPos.lng]}
                            radius={draftingGeofence.radius}
                            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.3, weight: 2, dashArray: '5, 5' }}
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
                                    const marker = e.target;
                                    const position = marker.getLatLng();
                                    setLocalDraftPos({ lat: position.lat, lng: position.lng });
                                    onMapClick?.(position.lat, position.lng);
                                },
                                dragend: (e) => {
                                    const marker = e.target;
                                    const position = marker.getLatLng();
                                    setLocalDraftPos({ lat: position.lat, lng: position.lng });
                                    onMapClick?.(position.lat, position.lng);
                                }
                            }}
                        >
                            <Tooltip permanent direction="top" offset={[0, -40]}>
                                Drag me to move the zone
                            </Tooltip>
                        </Marker>
                    </>
                )}
            </MapContainer>
        </div>
    );
}
