"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    assigned_geofence_id: number | null;
}

interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

interface AuthContextType {
    user: AuthResponse | null;
    login: (authData: AuthResponse) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchUser = useCallback(async (token: string) => {
        try {
            const response = await api.get('/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser({
                access_token: token,
                token_type: 'bearer',
                user: response.data
            });
            return response.data;
        } catch {
            localStorage.removeItem('token');
            setUser(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser(token);
        } else {
            setIsLoading(false);
        }
    }, [fetchUser]);

    const login = (authData: AuthResponse) => {
        localStorage.setItem('token', authData.access_token);
        setUser(authData);
        if (authData.user.role === 'admin') {
            router.push('/admin');
        } else {
            router.push('/dashboard');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
