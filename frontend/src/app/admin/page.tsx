"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    Users,
    Map as MapIcon,
    Activity,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    Trash2,
    Search,
    Shield,
    LayoutDashboard,
    Radio,
    LogOut,
    Loader2,
    ChevronRight,
    Settings
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useGeolocation } from '@/hooks/useGeolocation';
import LocationGate from '@/components/LocationGate';

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

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });
    const [attendance, setAttendance] = useState([]);
    const [geofences, setGeofences] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [draftingGeofence, setDraftingGeofence] = useState<{ latitude: number, longitude: number, radius: number, name: string } | null>(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Core geolocation hook
    const geo = useGeolocation();
    const [bypassGate, setBypassGate] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [statsRes, attendanceRes, geofencesRes, usersRes] = await Promise.all([
                api.get('/admin/attendance/stats'),
                api.get('/admin/attendance/all'),
                api.get('/geofences/'),
                api.get('/users/')
            ]);
            setStats(statsRes.data);
            setAttendance(attendanceRes.data);
            setGeofences(geofencesRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleMapClick = (lat: number, lng: number) => {
        setMessage({ type: '', text: '' });
        setDraftingGeofence(prev => ({
            latitude: lat, longitude: lng,
            radius: prev?.radius || 100,
            name: prev?.name || ''
        }));
    };

    const handleCreateGeofence = async () => {
        if (!draftingGeofence || !draftingGeofence.name) return;
        setIsSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await api.post('/geofences/', draftingGeofence);
            setDraftingGeofence(null);
            await fetchData();
            setMessage({ type: 'success', text: `Zone "${draftingGeofence.name}" created successfully.` });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to create zone.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteGeofence = async (id: number, name: string) => {
        if (!confirm(`Delete "${name}" zone?`)) return;
        try {
            await api.delete(`/geofences/${id}`);
            await fetchData();
            setMessage({ type: 'success', text: `Zone "${name}" deleted.` });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to delete zone.' });
        }
    };

    const handleAssignGeofence = async (userId: number, geofenceId: number | null) => {
        try {
            await api.patch(`/users/${userId}`, { assigned_geofence_id: geofenceId });
            fetchData();
        } catch (err) {
            console.error('Error assigning geofence:', err);
        }
    };

    const filteredAttendance = attendance.filter((record: any) =>
        record.user_id.toString().includes(searchQuery) ||
        record.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter((u: any) =>
        u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    return (
        <LocationGate
            status={bypassGate ? 'granted' : geo.status}
            error={geo.error}
            onRetry={geo.retry}
            allowBypass={true}
            onBypass={() => setBypassGate(true)}
        >
            <div className="min-h-screen flex font-sans" style={{ background: 'var(--bg-page)' }}>
                {/* ══════════════════════════════════════════════════
                    SIDEBAR NAVIGATION
                   ══════════════════════════════════════════════════ */}
                <aside className="w-[280px] fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col shadow-2xl"
                    style={{ background: 'var(--bg-sidebar)' }}>

                    {/* Brand */}
                    <div className="px-8 py-10 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                            style={{ background: 'linear-gradient(135deg, var(--primary), #818cf8)' }}>
                            <Shield className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white tracking-widest uppercase">GeoTrack</h1>
                            <p className="text-[10px] font-black tracking-widest uppercase opacity-40 text-white">Security Command</p>
                        </div>
                    </div>

                    {/* Nav items */}
                    <nav className="flex-1 px-4 space-y-1">
                        <p className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Infrastructure</p>

                        {[
                            { icon: LayoutDashboard, label: 'Control Center', active: true },
                            { icon: Activity, label: 'Telemetry log' },
                            { icon: MapIcon, label: 'Spatial Zones' },
                            { icon: Users, label: 'Fleet Access' },
                        ].map((item, i) => (
                            <a key={i} href="#" className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${item.active
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}>
                                <item.icon size={20} className={item.active ? 'text-[var(--primary)]' : 'group-hover:text-white'} />
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    {/* Footer Profile */}
                    <div className="p-6">
                        <div className="p-5 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-inner"
                                    style={{ background: 'var(--primary)', color: 'white' }}>
                                    {user?.full_name?.[0] || 'A'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{user?.full_name || 'Administrator'}</p>
                                    <p className="text-[10px] font-bold truncate opacity-40 text-white">{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-white/10 active:scale-95 text-slate-300"
                                style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <LogOut size={14} /> Termination
                            </button>
                        </div>
                    </div>
                </aside>

                {/* ══════════════════════════════════════════════════
                    MAIN CONTENT
                   ══════════════════════════════════════════════════ */}
                <main className="flex-1 lg:ml-[280px]">
                    {/* Header bar */}
                    <header className="sticky top-0 z-30 px-8 py-5 flex items-center justify-between glass border-b border-[var(--border-default)]">
                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                                <div className={`w-2 h-2 rounded-full ${geo.status !== 'granted' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                    {geo.status !== 'granted' ? 'GPS BYPASS ACTIVE' : 'NETWORK SECURE'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-2 rounded-2xl bg-indigo-50 text-[var(--primary)] text-[11px] font-black uppercase tracking-widest">
                                Instance v4.2 PRO
                            </div>
                            <button className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-400">
                                <Settings size={20} />
                            </button>
                        </div>
                    </header>

                    <div className="px-8 py-10 md:px-12 md:py-12 max-w-[1400px] mx-auto space-y-10">
                        {/* Page Summary */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                    System Command
                                </h2>
                                <p className="text-base font-medium mt-2 text-slate-400">
                                    Monitoring <span className="text-slate-900 font-bold">{users.length}</span> active fleet members across <span className="text-slate-900 font-bold">{geofences.length}</span> security zones.
                                </p>
                            </div>
                            <button onClick={fetchData} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white shadow-premium border border-slate-100 text-sm font-black transition-all hover:-translate-y-0.5 active:translate-y-0">
                                <Activity size={18} className="text-[var(--primary)]" /> Resynchronize
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: 'Personnel Present', value: stats.present, color: 'emerald', icon: CheckCircle2 },
                                { label: 'Terminal Inactivity', value: stats.absent, color: 'amber', icon: AlertCircle },
                                { label: 'Total Fleet', value: stats.total, color: 'indigo', icon: Users },
                            ].map((stat, i) => (
                                <div key={i} className={`stat-card stat-card--${stat.color} group`}>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg`}
                                            style={{ background: `var(--${stat.color}-light)` }}>
                                            <stat.icon size={28} style={{ color: `var(--${stat.color})` }} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">{stat.label}</p>
                                            <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                            {/* ── LEFT COL ──────────────────────── */}
                            <div className="xl:col-span-8 space-y-10">
                                {/* Infrastructure Map */}
                                <div className="office-card group overflow-hidden">
                                    <div className="px-8 py-6 flex justify-between items-center glass border-b border-[var(--border-default)]">
                                        <div>
                                            <h3 className="text-lg font-black flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-indigo-50 text-[var(--primary)]">
                                                    <Radio size={20} className="animate-pulse" />
                                                </div>
                                                Geospatial Command
                                            </h3>
                                        </div>
                                        {draftingGeofence && (
                                            <button
                                                onClick={() => setDraftingGeofence(null)}
                                                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-red-50 text-red-600 border border-red-100 hover:bg-red-100">
                                                Abort Deployment
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative border-b border-slate-100">
                                        <AttendanceMap
                                            userLocation={geo.location}
                                            geofences={geofences}
                                            isAdmin={true}
                                            onMapClick={handleMapClick}
                                            draftingGeofence={draftingGeofence}
                                        />

                                        {/* Geofence Editor Overlay */}
                                        {draftingGeofence && (
                                            <div className="absolute inset-x-6 bottom-6 z-[1000] p-8 glass rounded-[32px] shadow-2xl border-2 border-[var(--success)] animate-slide-up">
                                                <div className="flex flex-col lg:flex-row gap-8 items-end">
                                                    <div className="flex-1 space-y-6 w-full">
                                                        <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--success)]">
                                                            <div className="w-2 h-2 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                                                            Tactical Zone Deployment
                                                        </div>
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                            <div className="space-y-2">
                                                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Designation</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. ALPHA_TERMINAL_1"
                                                                    className="input-premium h-14 text-sm font-bold uppercase tracking-widest"
                                                                    value={draftingGeofence.name}
                                                                    onChange={(e) => setDraftingGeofence(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                                                                    Effective Radius
                                                                    <span className="text-slate-900 font-black">{draftingGeofence.radius}m</span>
                                                                </label>
                                                                <div className="pt-4">
                                                                    <input
                                                                        type="range" min="10" max="1000" step="10"
                                                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-slate-200"
                                                                        value={draftingGeofence.radius}
                                                                        onChange={(e) => setDraftingGeofence(prev => prev ? { ...prev, radius: Number(e.target.value) } : null)}
                                                                    />
                                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter opacity-30 mt-3">
                                                                        <span>MIN_10M</span><span>MED_500M</span><span>MAX_1KM</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={handleCreateGeofence}
                                                        disabled={!draftingGeofence.name || isSaving}
                                                        className="w-full lg:w-48 h-14 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-600 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50">
                                                        {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Deploy'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Map Toast */}
                                    {message.text && (
                                        <div className="p-6 bg-slate-50 flex items-center gap-4 animate-fade-in border-t border-slate-100">
                                            <div className={`w-3 h-3 rounded-full ${message.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                            <span className="text-sm font-bold text-slate-700">{message.text}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Fleet Telemetry Table */}
                                <div className="office-card overflow-hidden">
                                    <div className="px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-6 glass border-b border-[var(--border-default)]">
                                        <div>
                                            <h3 className="text-lg font-black flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-indigo-50 text-[var(--primary)]">
                                                    <Activity size={20} />
                                                </div>
                                                Operational Telemetry
                                            </h3>
                                        </div>
                                        <div className="relative group/search">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within/search:text-[var(--primary)] text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Sifting log data..."
                                                className="input-premium pl-12 w-full md:w-80 h-12 shadow-sm"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Tactical ID</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Runtime</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Spatial Coords</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Verification</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredAttendance.map((record: any) => (
                                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-8 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-white shadow-premium flex items-center justify-center text-sm font-black text-slate-500">
                                                                    #{record.user_id}
                                                                </div>
                                                                <span className="text-[12px] font-mono text-slate-400 group-hover:text-slate-900 transition-colors">{record.id.slice(0, 16).toUpperCase()}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-4">
                                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                                <Clock size={16} className="text-[var(--primary)]" />
                                                                {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-4">
                                                            <span className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                                {record.total_duration ? `${record.total_duration}m SEC` : 'STREAMING'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-4">
                                                            <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                                                {record.check_in_lat.toFixed(6)}, {record.check_in_long.toFixed(6)}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-4 text-right">
                                                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${record.check_out_time ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                                }`}>
                                                                {record.check_out_time ? 'Terminal' : 'Active'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* ── RIGHT COL ─────────────────────── */}
                            <div className="xl:col-span-4 space-y-8">
                                {/* Fleet Management */}
                                <div className="office-card p-8 bg-gradient-to-br from-white to-slate-50">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-black flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 text-[var(--primary)]">
                                                <Users size={20} />
                                            </div>
                                            Fleet Integrity
                                        </h3>
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[var(--primary)] font-black text-xs">
                                            {filteredUsers.length}
                                        </div>
                                    </div>

                                    <div className="relative mb-6 group/search">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-[var(--primary)] transition-colors" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Audit names/emails..."
                                            className="input-premium pl-12 h-12 text-sm bg-white"
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                        {filteredUsers.filter((u: any) => u.role !== 'admin').map((u: any) => (
                                            <div key={u.id} className="p-6 rounded-[24px] bg-white shadow-premium border border-slate-100 group hover:border-[var(--primary)] transition-all">
                                                <div className="flex justify-between items-start mb-5">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 leading-tight">{u.full_name}</p>
                                                        <p className="text-[11px] font-bold text-slate-400 mt-1">{u.email}</p>
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] px-2 py-1 rounded-lg bg-indigo-50">
                                                        ID_{u.id}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Spatial Restriction</label>
                                                    <div className="relative">
                                                        <select
                                                            className="input-premium h-11 text-xs font-bold cursor-pointer appearance-none bg-slate-50"
                                                            value={u.assigned_geofence_id || ''}
                                                            onChange={(e) => handleAssignGeofence(u.id, e.target.value ? Number(e.target.value) : null)}
                                                        >
                                                            <option value="">Full Range Access</option>
                                                            {geofences.map((gf: any) => (
                                                                <option key={gf.id} value={gf.id}>{gf.name}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 opacity-20 pointer-events-none" size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Active Zones Feed */}
                                <div className="office-card p-8">
                                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                                        <h3 className="text-lg font-black flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 text-[var(--primary)]">
                                                <MapIcon size={20} />
                                            </div>
                                            Spatial Clusters
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        {geofences.map((gf: any) => (
                                            <div key={gf.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-300 shadow-sm border border-slate-100 group-hover:text-[var(--primary)] transition-colors">
                                                        <MapIcon size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{gf.name}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 mt-0.5">
                                                            {gf.radius}m Radius · Perimeter {Math.round(2 * Math.PI * gf.radius)}m
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteGeofence(gf.id, gf.name)}
                                                    className="p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all bg-red-50 text-red-500 hover:bg-red-500 hover:text-white">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {geofences.length === 0 && (
                                            <div className="text-center py-12">
                                                <MapIcon size={40} className="mx-auto mb-4 opacity-10" />
                                                <p className="text-sm font-bold text-slate-300">No active clusters detected</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </LocationGate>
    );
}
