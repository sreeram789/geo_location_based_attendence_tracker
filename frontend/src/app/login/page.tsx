"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Lock, Mail, ArrowRight, ShieldCheck, MapPin, BarChart3, Users } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/login/access-token', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await login(response.data.access_token);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans" style={{ background: 'var(--bg-page)' }}>
            {/* Left Panel – Brand / Info */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between"
                style={{
                    background: 'linear-gradient(145deg, #0f1117 0%, #1a1040 50%, #2d1b69 100%)',
                }}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #635bff 0%, transparent 70%)' }}></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-8"
                    style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}></div>

                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                <div className="relative z-10 p-12 flex-1 flex flex-col justify-center">
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'var(--primary)' }}>
                                <ShieldCheck className="text-white" size={22} />
                            </div>
                            <span className="text-white text-2xl font-bold tracking-tight">GeoTrack</span>
                        </div>
                        <p className="text-sm mt-3" style={{ color: 'var(--text-on-dark-muted)' }}>BIT Campus Attendance System</p>
                    </div>

                    <h1 className="text-4xl font-bold text-white leading-tight tracking-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
                        Smart attendance,<br />
                        <span style={{ color: '#a78bfa' }}>verified by location.</span>
                    </h1>

                    <p className="text-base leading-relaxed mb-12" style={{ color: 'var(--text-on-dark-muted)', maxWidth: '380px' }}>
                        Enterprise-grade geofencing technology ensures only verified check-ins from within designated campus boundaries.
                    </p>

                    {/* Feature pills */}
                    <div className="space-y-4">
                        {[
                            { icon: <MapPin size={16} />, text: 'GPS-verified check-ins' },
                            { icon: <BarChart3 size={16} />, text: 'Real-time analytics dashboard' },
                            { icon: <Users size={16} />, text: 'Multi-zone workforce management' },
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-on-dark)' }}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(99, 91, 255, 0.15)' }}>
                                    <span style={{ color: '#a78bfa' }}>{f.icon}</span>
                                </div>
                                <span className="font-medium">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 px-12 pb-8">
                    <p className="text-xs" style={{ color: 'var(--text-on-dark-muted)' }}>
                        © 2026 GeoTrack · Bannari Amman Institute of Technology
                    </p>
                </div>
            </div>

            {/* Right Panel – Login Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-[400px]">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-10 text-center">
                        <div className="inline-flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                                <ShieldCheck className="text-white" size={20} />
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>GeoTrack</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Sign in to access your attendance dashboard
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl text-sm font-medium animate-fade-in"
                            style={{ background: 'var(--danger-light)', color: '#dc2626', border: '1px solid #fecaca' }}>
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--danger)' }}></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="label">Email address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                                    style={{ color: 'var(--text-tertiary)' }} />
                                <input
                                    type="email"
                                    className="input-premium pl-10"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="label">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                                    style={{ color: 'var(--text-tertiary)' }} />
                                <input
                                    type="password"
                                    className="input-premium pl-10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>Sign in <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border-light)' }}>
                        <p className="text-center text-xs font-medium mb-3" style={{ color: 'var(--text-tertiary)' }}>Demo accounts</p>
                        <div className="flex justify-center gap-2 text-xs font-medium flex-wrap">
                            <span className="px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                                admin@example.com
                            </span>
                            <span className="px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-badge)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                                user@example.com
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
