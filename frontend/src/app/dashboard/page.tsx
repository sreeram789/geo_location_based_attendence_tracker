"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { MapPin, LogIn, LogOut, Clock, User, LogOut as LogoutIcon, Calendar, CheckCircle2, History, Settings } from 'lucide-react';

const AttendanceMap = dynamic(() => import('@/components/AttendanceMap'), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-slate-900 rounded-xl animate-pulse flex items-center justify-center text-slate-500">Initializing Map...</div>
});

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [geofences, setGeofences] = useState([]);
    const [selectedGeofence, setSelectedGeofence] = useState<number | null>(null);
    const [attendance, setAttendance] = useState<any>(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedSession, setSelectedSession] = useState('Morning');
    const [isInPlace, setIsInPlace] = useState(false);

    const SESSIONS = [
        { name: 'Morning', time: '09:00 AM - 01:00 PM' },
        { name: 'Afternoon', time: '01:00 PM - 05:00 PM' },
        { name: 'Evening', time: '05:00 PM - 09:00 PM' },
        { name: 'Night', time: '09:00 PM - 01:00 AM' }
    ];

    const fetchGeofences = useCallback(async () => {
        try {
            const res = await api.get('/geofences/');
            setGeofences(res.data);

            // If user has an assigned geofence, lock onto it
            if (user?.assigned_geofence_id) {
                setSelectedGeofence(user.assigned_geofence_id);
            } else if (res.data.length > 0) {
                setSelectedGeofence(res.data[0].id);
            }
        } catch (err) {
            console.error(err);
        }
    }, [user?.assigned_geofence_id]);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await api.get('/attendance/history');
            setHistory(res.data);
            // Check for active session in history
            const active = res.data.find((r: any) => !r.check_out_time);
            if (active) setAttendance(active);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const haversine_distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000; // Earth radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const requestLocation = useCallback(() => {
        if (!("geolocation" in navigator)) {
            setMessage({ type: 'error', text: 'Geolocation is not supported' });
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                setLocation({ lat: userLat, lng: userLng });
                setAccuracy(position.coords.accuracy);

                // Check distance if geofence is selected
                if (selectedGeofence && geofences.length > 0) {
                    const gf = geofences.find((g: any) => g.id === selectedGeofence) as any;
                    if (gf) {
                        const distance = haversine_distance(userLat, userLng, gf.latitude, gf.longitude);
                        setIsInPlace(distance <= gf.radius);
                    }
                }
            },
            () => {
                setMessage({ type: 'error', text: 'Location access denied. Please enable GPS in your browser.' });
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [selectedGeofence, geofences]);

    useEffect(() => {
        fetchGeofences();
        fetchHistory();
    }, [fetchGeofences, fetchHistory]);

    useEffect(() => {
        const cleanup = requestLocation();
        return () => {
            if (cleanup) cleanup();
        };
    }, [requestLocation]);

    const handleCheckIn = async () => {
        if (!location || !selectedGeofence) return;
        setLoading(true);
        try {
            const res = await api.post('/attendance/check-in', {
                geofence_id: selectedGeofence,
                latitude: location.lat,
                longitude: location.lng,
                accuracy: accuracy,
                session_name: selectedSession
            });
            setAttendance(res.data);
            fetchHistory();
            setMessage({ type: 'success', text: 'Check-in recorded successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Check-in failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!location) return;
        setLoading(true);
        try {
            const res = await api.post('/attendance/check-out', {
                latitude: location.lat,
                longitude: location.lng
            });
            setAttendance(null);
            fetchHistory();
            setMessage({ type: 'success', text: 'Check-out recorded successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Check-out failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200">
            {/* Top Navigation */}
            <nav className="glass-card sticky top-0 z-30 border-b border-white/5 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <CheckCircle2 className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">GeoTrack</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-400">
                            <User size={16} /> {user?.full_name}
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
                        >
                            <LogoutIcon size={16} /> Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
                {/* Hero / Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-white">Employee Dashboard</h2>
                        <p className="text-slate-400">Welcome back, {user?.full_name}. Here is your current status.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Map & History */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <MapPin className="text-blue-500" size={20} /> Current Location
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${location ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                        {location ? 'Signal Active' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-1 bg-slate-900/40">
                                <AttendanceMap userLocation={location} geofences={geofences} />
                            </div>
                        </div>

                        {/* Personal History */}
                        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex items-center gap-2">
                                <History className="text-indigo-400" size={20} />
                                <h3 className="font-bold text-lg text-white">Your Attendance History</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Check-in</th>
                                            <th className="px-6 py-4">Check-out</th>
                                            <th className="px-6 py-4">Duration</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {history.map((record: any) => (
                                            <tr key={record.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-slate-300">
                                                    {new Date(record.check_in_time).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                                                    {new Date(record.check_in_time).toLocaleTimeString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                                                    {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '--:--'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-blue-400">
                                                    {record.total_duration ? `${record.total_duration}m` : 'In Session'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${record.check_out_time ? 'bg-slate-500/10 text-slate-400' : 'bg-green-500/10 text-green-400 animate-pulse'}`}>
                                                        {record.check_out_time ? 'COMPLETED' : 'ACTIVE'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {history.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic text-sm">
                                                    No attendance records found. Start by checking in above!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Actions & Session Stats */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-card p-6 rounded-2xl border border-white/10 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Clock size={80} className="text-blue-500" />
                            </div>

                            <h3 className="text-slate-400 font-semibold mb-6 uppercase tracking-wider text-sm">Active Session</h3>
                            <div className="mb-6">
                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border ${attendance ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                                    {attendance ? 'LIVE NOW' : 'OFF DUTY'}
                                </span>
                            </div>
                            <div className="text-4xl font-black text-white mb-2">
                                {attendance ? 'Present' : 'Offline'}
                            </div>
                            <p className="text-slate-500 text-sm mb-6">
                                {attendance ? `Started at ${new Date(attendance.check_in_time).toLocaleTimeString()}` : 'Check-in to start your work day'}
                            </p>
                        </div>

                        {/* Actions Card */}
                        <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-xl">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
                                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                Operations
                            </h3>

                            {message.text && (
                                <div className={`mb-6 p-4 rounded-xl border text-sm flex items-start gap-3 ${message.type === 'error'
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                    : 'bg-green-500/10 border-green-500/20 text-green-400'
                                    }`}>
                                    <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    {message.text}
                                </div>
                            )}

                            {!attendance ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-1.5">
                                            Choose Location
                                            {user?.assigned_geofence_id && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">ASSIGNED</span>}
                                        </label>
                                        <div className="relative">
                                            <select
                                                disabled={!!user?.assigned_geofence_id}
                                                className={`w-full bg-slate-800/50 border border-slate-700 text-white p-3.5 rounded-xl accent-blue-600 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer ${user?.assigned_geofence_id ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                value={selectedGeofence || ''}
                                                onChange={(e) => setSelectedGeofence(Number(e.target.value))}
                                            >
                                                {geofences.map((gf: any) => (
                                                    <option key={gf.id} value={gf.id} className="bg-slate-900">{gf.name}</option>
                                                ))}
                                            </select>
                                            {user?.assigned_geofence_id && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400">
                                                    <Settings size={16} className="animate-pulse" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Select Session</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {SESSIONS.map((session) => (
                                                <button
                                                    key={session.name}
                                                    onClick={() => setSelectedSession(session.name)}
                                                    className={`p-3 rounded-xl border text-left transition-all ${selectedSession === session.name
                                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                                        : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:border-slate-600'
                                                        }`}
                                                >
                                                    <div className="text-sm font-bold">{session.name}</div>
                                                    <div className="text-[10px] opacity-60">{session.time}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`relative ${!isInPlace ? 'group' : ''}`}>
                                        <div className={`${!isInPlace ? 'blur-[4px] pointer-events-none opacity-50 transition-all duration-500' : ''}`}>
                                            <button
                                                disabled={loading || !location || !isInPlace}
                                                onClick={handleCheckIn}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <LogIn size={20} /> Register Check-in
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        {!isInPlace && location && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="bg-slate-900/80 px-4 py-2 rounded-lg border border-white/10 text-xs font-bold text-slate-400 backdrop-blur-sm">
                                                    NOT IN RANGE
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    disabled={loading || !location}
                                    onClick={handleCheckOut}
                                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <LogOut size={20} /> Register Check-out
                                        </>
                                    )}
                                </button>
                            )}

                            {!location && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-orange-400/80 italic text-[11px] font-medium animate-pulse">
                                    <MapPin size={12} /> Syncing GPS satellite data...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
