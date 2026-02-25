"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import {
    MapPin, LogIn, LogOut, Clock, User, Calendar,
    CheckCircle2, History, Settings, AlertCircle, Radio,
    ChevronRight, Map as MapIcon, Navigation2, Loader2
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import LocationGate from '@/components/LocationGate';
import PerimeterBadge from '@/components/PerimeterBadge';
import { checkPerimeter } from '@/lib/locationService';

const AttendanceMap = dynamic(() => import('@/components/AttendanceMap'), {
    ssr: false,
    loading: () => (
        <div className="h-[450px] rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-input)' }}>
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                    style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading map...</span>
            </div>
        </div>
    )
});

export default function DashboardPage() {
    const { user, logout } = useAuth();

    // Core geolocation hook
    const geo = useGeolocation();

    const [geofences, setGeofences] = useState<any[]>([]);
    const [selectedGeofence, setSelectedGeofence] = useState<number | null>(null);
    const [attendance, setAttendance] = useState<any>(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedSession, setSelectedSession] = useState('Morning');

    const fetchGeofences = useCallback(async () => {
        try {
            const res = await api.get('/geofences/');
            setGeofences(res.data);
            if (user?.assigned_geofence_id) {
                setSelectedGeofence(user.assigned_geofence_id);
            } else if (res.data.length > 0) {
                setSelectedGeofence(res.data[0].id);
            }
        } catch (err) { console.error(err); }
    }, [user?.assigned_geofence_id]);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await api.get('/attendance/history');
            setHistory(res.data);
            const active = res.data.find((r: any) => !r.check_out_time);
            if (active) setAttendance(active);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        fetchGeofences();
        fetchHistory();
    }, [fetchGeofences, fetchHistory]);

    // Calculate geofence status
    const targetGeofence = geofences.find(g => g.id === selectedGeofence);
    const perimeterStatus = (geo.location && targetGeofence)
        ? checkPerimeter(geo.location, targetGeofence)
        : { inside: false, distance: 0, threshold: 0, overshoot: 0 };

    const handleCheckIn = async () => {
        if (!geo.location || !selectedGeofence) return;

        // Double check status client side
        if (!perimeterStatus.inside) {
            setMessage({ type: 'error', text: 'You must be inside the geofence perimeter to check-in.' });
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/attendance/check-in', {
                geofence_id: selectedGeofence,
                latitude: geo.location.lat,
                longitude: geo.location.lng,
                accuracy: geo.accuracy,
                session_name: selectedSession
            });
            setAttendance(res.data);
            fetchHistory();
            setMessage({ type: 'success', text: 'Check-in recorded!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Check-in failed' });
        } finally { setLoading(false); }
    };

    const handleCheckOut = async () => {
        if (!geo.location) return;
        setLoading(true);
        try {
            await api.post('/attendance/check-out', {
                latitude: geo.location.lat,
                longitude: geo.location.lng
            });
            setAttendance(null);
            fetchHistory();
            setMessage({ type: 'success', text: 'Check-out recorded!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Check-out failed' });
        } finally { setLoading(false); }
    };

    return (
        <LocationGate
            status={geo.status}
            error={geo.error}
            onRetry={geo.retry}
        >
            <div className="min-h-screen font-sans" style={{ background: 'var(--bg-page)' }}>
                {/* ── Nav ──────────────────────────────────────── */}
                <nav className="sticky top-0 z-30 px-6 py-4 glass border-b border-[var(--border-default)]">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110"
                                style={{ background: 'linear-gradient(135deg, var(--primary), #818cf8)' }}>
                                <CheckCircle2 className="text-white" size={22} />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                GeoTrack
                            </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <button className="p-2.5 rounded-xl transition-all hover:bg-white hover:shadow-sm" style={{ color: 'var(--text-secondary)' }}>
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

                        {/* ── LEFT COL ──────────────────────────────── */}
                        <div className="lg:col-span-8 space-y-10 animate-fade-in">
                            {/* Greeting */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-4xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                                        Hi, {user?.full_name?.split(' ')[0] || 'Member'}!
                                    </h1>
                                    <p className="text-base font-medium mt-2" style={{ color: 'var(--text-secondary)' }}>
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="px-5 py-2.5 rounded-2xl bg-white shadow-premium flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }}></div>
                                    <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-secondary)' }}>System Active</span>
                                </div>
                            </div>

                            {/* Attendance Controls */}
                            <div className="office-card group">
                                <div className="p-1">
                                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: 'var(--border-light)' }}>
                                        {/* Status Info */}
                                        <div className="p-10 flex-1">
                                            <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-[0.15em] mb-6"
                                                style={{ color: 'var(--primary)' }}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                Live Network Identification
                                            </div>

                                            <PerimeterBadge
                                                userLocation={geo.location}
                                                geofence={targetGeofence}
                                                variant="full"
                                            />

                                            <div className="mt-10 space-y-6">
                                                <div className="space-y-2">
                                                    <label className="label">Designated Perimeter</label>
                                                    <div className="relative group/select">
                                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within/select:text-[var(--primary)]" size={18}
                                                            style={{ color: 'var(--text-tertiary)' }} />
                                                        <select
                                                            className="input-premium pl-12 h-14 cursor-pointer appearance-none shadow-sm"
                                                            value={selectedGeofence || ''}
                                                            onChange={(e) => setSelectedGeofence(Number(e.target.value))}
                                                            disabled={!!user?.assigned_geofence_id}
                                                        >
                                                            {geofences.map((gf: any) => (
                                                                <option key={gf.id} value={gf.id}>{gf.name}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90 opacity-20"
                                                            size={16} />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="label">Active Shift</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {['Morning', 'Afternoon'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => setSelectedSession(s)}
                                                                disabled={!!attendance}
                                                                className={`py-3.5 px-6 rounded-2xl text-[13px] font-bold border transition-all ${selectedSession === s
                                                                        ? 'bg-white shadow-xl border-[var(--primary)] text-[var(--primary)] scale-[1.02]'
                                                                        : 'bg-[var(--bg-input)] border-transparent text-[var(--text-secondary)] hover:bg-white hover:border-[var(--border-default)]'
                                                                    }`}
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="p-10 lg:w-[360px] flex flex-col items-center justify-center text-center bg-slate-50/50">
                                            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 scale-110 ${attendance ? 'bg-[var(--danger)] animate-none' : (perimeterStatus.inside ? 'bg-[var(--primary)] animate-pulse' : 'bg-slate-300')
                                                }`}>
                                                {attendance ? <LogOut size={40} color="white" /> : <LogIn size={40} color="white" />}
                                            </div>

                                            <h3 className="text-2xl font-black mb-3">
                                                {attendance ? 'Check Out' : 'Check In'}
                                            </h3>
                                            <p className="text-[13px] font-medium mb-10 max-w-[200px]" style={{ color: 'var(--text-tertiary)' }}>
                                                {!geo.location ? 'Acquiring high-accuracy GPS signal...' :
                                                    (!perimeterStatus.inside ? 'Access restricted: Outside perimeter' : 'Identification verified. Ready to start.')}
                                            </p>

                                            <button
                                                onClick={attendance ? handleCheckOut : handleCheckIn}
                                                disabled={(!attendance && !perimeterStatus.inside) || loading || !geo.location}
                                                className={`w-full py-5 rounded-3xl font-black text-base transition-all transform active:scale-95 ${attendance
                                                        ? 'btn-danger shadow-2xl shadow-red-200'
                                                        : (perimeterStatus.inside ? 'btn-primary shadow-2xl shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                                                    }`}
                                            >
                                                {loading ? (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <Loader2 className="animate-spin" size={20} />
                                                        Processing...
                                                    </div>
                                                ) : (
                                                    attendance ? `Exit ${selectedSession}` : `Start ${selectedSession}`
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Map Card */}
                            <div className="office-card overflow-hidden">
                                <div className="px-8 py-7 flex items-center justify-between glass border-b border-[var(--border-default)]">
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 text-[var(--primary)]">
                                                <Navigation2 size={18} fill="currentColor" />
                                            </div>
                                            Spatial Verification
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                        <Radio size={12} className="animate-pulse" /> Live Tracking
                                    </div>
                                </div>
                                <div className="p-0">
                                    <AttendanceMap
                                        userLocation={geo.location}
                                        geofences={geofences}
                                        isAdmin={false}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT COL ─────────────────────────────── */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Profile Card */}
                            <div className="office-card p-8 bg-gradient-to-br from-white to-slate-50">
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black shadow-inner"
                                        style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '2px solid white' }}>
                                        {user?.full_name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-lg font-black leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</p>
                                        <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Staff ID · {user?.id || '---'}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    {[
                                        { label: 'Network Integrity', value: 'Encrypted', color: 'emerald' },
                                        { label: 'GPS Precision', value: '0.8m Root', color: 'indigo' },
                                        { label: 'Security Level', value: 'Level 4', color: 'indigo' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-xl px-2">
                                            <span className="text-[13px] font-bold text-slate-500">{item.label}</span>
                                            <span className={`text-[13px] font-black text-${item.color}-600`}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[var(--primary)] shadow-sm">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-black" style={{ color: 'var(--text-primary)' }}>Calendar Sync</p>
                                        <p className="text-[11px] font-bold" style={{ color: 'var(--text-tertiary)' }}>No upcoming blackout days</p>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Feed */}
                            <div className="office-card flex flex-col h-[580px]">
                                <div className="px-8 py-7 glass border-b border-[var(--border-default)]">
                                    <h3 className="text-lg font-bold flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-50 text-[var(--primary)]">
                                            <History size={18} />
                                        </div>
                                        Recent Activity
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {history.map((record: any, i: number) => (
                                        <div key={record.id} className="p-7 border-b border-slate-100 hover:bg-slate-50 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white shadow-premium flex items-center justify-center text-slate-400 group-hover:text-[var(--primary)] transition-colors">
                                                        <Clock size={18} />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-black block" style={{ color: 'var(--text-primary)' }}>
                                                            {new Date(record.check_in_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                                                            Verified Session
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${record.check_out_time ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-600 animate-pulse'
                                                    }`}>
                                                    {record.check_out_time ? 'Terminal' : 'Active'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 py-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Entry</span>
                                                    <span className="text-sm font-black text-slate-700">
                                                        {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {record.check_out_time && (
                                                    <>
                                                        <div className="w-8 h-px bg-slate-200" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Exit</span>
                                                            <span className="text-sm font-black text-slate-700">
                                                                {new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {history.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                                                <History size={32} className="text-slate-200" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400">No telemetry data recorded for this user yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            {/* Premium Notifications */}
            {message.text && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 p-6 glass-dark rounded-3xl shadow-2xl flex items-center gap-4 animate-slide-up min-w-[360px]">
                    <div className={`w-3 h-3 rounded-full ${message.type === 'error' ? 'bg-red-500 shadow-[0_0_12px_rgba(239, 68, 68, 0.5)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'}`} />
                    <span className="text-sm font-bold text-white tracking-tight">{message.text}</span>
                    <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto p-2 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </LocationGate>
    );
}
