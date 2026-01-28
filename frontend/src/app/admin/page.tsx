"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    Users,
    Map as MapIcon,
    Settings,
    Activity,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    Trash2,
    Search
} from 'lucide-react';
import dynamic from 'next/dynamic';

const AttendanceMap = dynamic(() => import('@/components/AttendanceMap'), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-slate-900 rounded-xl animate-pulse flex items-center justify-center text-slate-500">Initializing Map...</div>
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
        const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleMapClick = (lat: number, lng: number) => {
        setDraftingGeofence(prev => ({
            latitude: lat,
            longitude: lng,
            radius: prev?.radius || 100,
            name: prev?.name || ''
        }));
    };

    const handleCreateGeofence = async () => {
        if (!draftingGeofence || !draftingGeofence.name) return;
        try {
            await api.post('/geofences/', draftingGeofence);
            setDraftingGeofence(null);
            fetchData();
        } catch (err) {
            console.error('Error creating geofence:', err);
        }
    };

    const handleDeleteGeofence = async (id: number) => {
        if (!confirm('Are you sure you want to delete this geofence?')) return;
        try {
            await api.delete(`/geofences/${id}`);
            fetchData();
        } catch (err) {
            console.error('Error deleting geofence:', err);
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

    // ... filtered attendance and users logic ...
    const filteredAttendance = attendance.filter((record: any) =>
        record.user_id.toString().includes(searchQuery) ||
        record.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter((u: any) =>
        u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200">
            {/* Nav */}
            <nav className="glass-card sticky top-0 z-30 border-b border-white/5 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Settings className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">GeoTrack <span className="text-indigo-400 text-sm font-medium ml-1">Admin</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-400 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            {user?.full_name}
                        </span>
                        <button onClick={logout} className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">Logout</button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Present Now</p>
                            <p className="text-3xl font-black text-white">{stats.present}</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Absent / Late</p>
                            <p className="text-3xl font-black text-white">{stats.absent}</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Headcount</p>
                            <p className="text-3xl font-black text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Map & Geofences */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <MapIcon className="text-indigo-500" size={20} /> Geofence Management
                                    </h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Click on map to place a new zone</p>
                                </div>
                                {draftingGeofence && (
                                    <button
                                        onClick={() => setDraftingGeofence(null)}
                                        className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Cancel Drafting
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <AttendanceMap
                                    userLocation={null}
                                    geofences={geofences}
                                    isAdmin={true}
                                    onMapClick={handleMapClick}
                                    draftingGeofence={draftingGeofence}
                                />

                                {draftingGeofence && (
                                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xl shadow-2xl z-[1000] flex flex-col md:flex-row gap-4 items-end animate-in slide-in-from-bottom-4">
                                        <div className="flex-1 space-y-4 w-full">
                                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                Drafting New Zone
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Zone Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Main Lobby"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                                                        value={draftingGeofence.name}
                                                        onChange={(e) => setDraftingGeofence({ ...draftingGeofence, name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Radius (meters): {draftingGeofence.radius}m</label>
                                                    <input
                                                        type="range"
                                                        min="10"
                                                        max="1000"
                                                        step="10"
                                                        className="w-full accent-emerald-500"
                                                        value={draftingGeofence.radius}
                                                        onChange={(e) => setDraftingGeofence({ ...draftingGeofence, radius: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCreateGeofence}
                                            disabled={!draftingGeofence.name}
                                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
                                        >
                                            Save Zone
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attendance Table */}
                        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Activity className="text-blue-500" size={20} /> Live Attendance Log
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search User ID..."
                                        className="bg-slate-900/50 border border-slate-700 text-white pl-9 pr-4 py-1.5 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-full md:w-64"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Check-in</th>
                                            <th className="px-6 py-4">Duration</th>
                                            <th className="px-6 py-4">Location</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredAttendance.map((record: any) => (
                                            <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white">User #{record.user_id}</span>
                                                        <span className="text-[10px] text-slate-500 font-mono italic">{record.id.slice(0, 8)}...</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock size={14} className="text-slate-500" />
                                                        {new Date(record.check_in_time).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-mono text-slate-300">
                                                        {record.total_duration ? `${record.total_duration}m` : 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-[10px] text-blue-400 font-mono">
                                                        {record.check_in_lat.toFixed(4)}, {record.check_in_long.toFixed(4)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${record.check_out_time ? 'bg-slate-500/10 text-slate-400' : 'bg-green-500/10 text-green-400'}`}>
                                                        {record.check_out_time ? 'COMPLETED' : 'ON-SITE'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Geofence List & User Assignment */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* User Assignment */}
                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Users className="text-purple-400" size={20} />
                                Employee Assignment
                            </h3>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    className="bg-slate-900/50 border border-slate-700 text-white pl-9 pr-4 py-2 rounded-xl text-xs focus:ring-1 focus:ring-purple-500 outline-none w-full"
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredUsers.filter((u: any) => u.role !== 'admin').map((u: any) => (
                                    <div key={u.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs font-bold text-white">{u.full_name}</p>
                                                <p className="text-[10px] text-slate-500">{u.email}</p>
                                            </div>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20 font-bold uppercase">
                                                ID: {u.id}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Required Location</label>
                                            <select
                                                className="w-full bg-slate-800 border border-slate-700 text-white text-[10px] p-2 rounded-lg outline-none focus:ring-1 focus:ring-purple-500"
                                                value={u.assigned_geofence_id || ''}
                                                onChange={(e) => handleAssignGeofence(u.id, e.target.value ? Number(e.target.value) : null)}
                                            >
                                                <option value="">Anywhere (No Restriction)</option>
                                                {geofences.map((gf: any) => (
                                                    <option key={gf.id} value={gf.id}>{gf.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                Managed Zones
                            </h3>
                            <div className="space-y-4">
                                {geofences.map((gf: any) => (
                                    <div key={gf.id} className="p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all flex justify-between items-center group">
                                        <div>
                                            <p className="text-sm font-bold text-white">{gf.name}</p>
                                            <p className="text-[10px] text-slate-500">{gf.radius}m radius</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteGeofence(gf.id)}
                                            className="p-2 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {geofences.length === 0 && (
                                    <p className="text-center text-xs text-slate-500 italic py-4">No zones created yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
