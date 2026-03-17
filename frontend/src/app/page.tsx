"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Leaf } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.user?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #faf8f5 0%, #f5f0e8 100%)' }}>
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ 
              background: 'linear-gradient(135deg, #6b8f71 0%, #5a7d61 100%)',
              boxShadow: '0 4px 20px rgba(107, 143, 113, 0.25)'
            }}>
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#c9a9a6] flex items-center justify-center ml-8 mt-12">
            <Leaf className="w-3 h-3 text-white" />
          </div>
        </div>
        <h1 className="font-display text-2xl font-semibold text-[#3d3229] mb-2">GeoTrack</h1>
        <p className="text-sm text-[#9a8b7a] mb-6">Garden Attendance System</p>
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-[#e8dfd2]"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#6b8f71] animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
