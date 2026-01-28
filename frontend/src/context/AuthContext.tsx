"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    assigned_geofence_id: number | null;
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchUser = useCallback(async () => {
        try {
            const response = await api.get('/users/me');
            setUser(response.data);
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
            fetchUser();
        } else {
            setIsLoading(false);
        }
    }, [fetchUser]);

    const login = async (token: string) => {
        localStorage.setItem('token', token);
        const userData = await fetchUser();
        if (userData) {
            if (userData.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
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
