"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  LogOut,
  Leaf,
  Trees,
  Flower2,
  Sunrise,
  Sunset,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Activity,
  Sprout,
} from "lucide-react";
import dynamic from "next/dynamic";

const AttendanceMap = dynamic(() => import("@/components/AttendanceMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] rounded-2xl flex items-center justify-center" style={{ background: "#f8f5f0" }}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#6b8f71]" />
        <p className="mt-3 text-[#6b5d4d]">Loading garden map...</p>
      </div>
    </div>
  ),
});

interface AttendanceRecord {
  id: number;
  user_id: number;
  timestamp: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  distance_meters: number | null;
  is_within_geofence: boolean | null;
}

interface GeofenceCenter {
  lat: number;
  lng: number;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [geofenceCenter, setGeofenceCenter] = useState<GeofenceCenter | null>(null);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(100);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    // Redirect admins to admin page
    if (user.user?.role === "admin") {
      router.push("/admin");
      return;
    }
    fetchTodayAttendance();
    fetchGeofence();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [user, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/attendance/me", {
        headers: { Authorization: `Bearer ${user?.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const today = new Date().toDateString();
        const todayRecords = data.filter((r: AttendanceRecord) => 
          new Date(r.timestamp).toDateString() === today
        );
        setTodayAttendance(todayRecords);
      }
    } catch {
      console.error("Failed to fetch attendance");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGeofence = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/geofences", {
        headers: { Authorization: `Bearer ${user?.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setGeofenceCenter({ lat: data[0].latitude, lng: data[0].longitude });
          setGeofenceRadius(data[0].radius || 100);
        }
      }
    } catch {
      console.error("Failed to fetch geofence");
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const res = await fetch("http://localhost:8000/api/v1/attendance/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Check-in successful! ${data.is_within_geofence ? "✓ Within garden perimeter" : "⚠ Outside garden perimeter"}`);
        fetchTodayAttendance();
      } else {
        setError(data.detail || "Check-in failed");
      }
    } catch (err) {
      setError("Unable to get your location. Please enable location services.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const res = await fetch("http://localhost:8000/api/v1/attendance/check-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Check-out successful! ${data.is_within_geofence ? "✓ Within garden perimeter" : "⚠ Outside garden perimeter"}`);
        fetchTodayAttendance();
      } else {
        setError(data.detail || "Check-out failed");
      }
    } catch {
      setError("Unable to get your location. Please enable location services.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLastCheckIn = () => {
    const checkIns = todayAttendance.filter((r) => r.status === "check_in");
    return checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;
  };

  const getLastCheckOut = () => {
    const checkOuts = todayAttendance.filter((r) => r.status === "check_out");
    return checkOuts.length > 0 ? checkOuts[checkOuts.length - 1] : null;
  };

  const isCheckedIn = () => {
    const lastCheckIn = getLastCheckIn();
    const lastCheckOut = getLastCheckOut();
    if (!lastCheckIn) return false;
    if (!lastCheckOut) return true;
    return new Date(lastCheckIn.timestamp) > new Date(lastCheckOut.timestamp);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #faf8f5 0%, #f5f0e8 100%)" }}>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full text-[#6b8f71]">
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.3" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.2" />
          </svg>
        </div>
        <div className="absolute top-1/4 -left-20 w-40 h-40 opacity-15">
          <Leaf className="w-full h-full text-[#c4a77d]" />
        </div>
        <div className="absolute bottom-1/4 -right-10 w-32 h-32 opacity-10">
          <Trees className="w-full h-full text-[#6b8f71]" />
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ 
        background: "rgba(255, 252, 247, 0.9)",
        borderColor: "#e8dfd2"
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: "linear-gradient(135deg, #6b8f71 0%, #5a7d61 100%)",
                  boxShadow: "0 2px 10px rgba(107, 143, 113, 0.2)"
                }}>
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-[#3d3229]">GeoTrack</h1>
                <p className="text-xs text-[#9a8b7a]">Garden Portal</p>
              </div>
            </div>

            {/* Time Display */}
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-[#9a8b7a] uppercase tracking-wider">Today</p>
                <p className="text-sm font-medium text-[#3d3229]">{formatDate(currentTime)}</p>
              </div>
              <div className="h-8 w-px bg-[#e8dfd2]" />
              <div className="text-center">
                <p className="text-xs text-[#9a8b7a] uppercase tracking-wider">Current Time</p>
                <p className="text-lg font-mono font-medium text-[#6b8f71]">{formatTime(currentTime)}</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl transition-all hover:bg-[#f5f0e8]"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #c9a9a6 0%, #b89996 100%)" }}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-[#3d3229]">{user.user?.full_name || user.user?.username}</p>
                  <p className="text-xs text-[#9a8b7a] capitalize">{user.user?.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#9a8b7a] transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border p-2 animate-fade-in"
                  style={{ background: "#fff", borderColor: "#e8dfd2" }}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#c98989] hover:bg-[#fcf2f2] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Welcome Banner */}
        <div className="mb-8">
          <div className="cottage-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #6b8f71 0%, #5a7d61 100%)" }}>
                  <Sprout className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[#3d3229]">
                    Good {currentTime.getHours() < 12 ? "Morning" : currentTime.getHours() < 18 ? "Afternoon" : "Evening"}, {user.user?.full_name?.split(" ")[0] || "Friend"}!
                  </h2>
                  <p className="text-[#6b5d4d] mt-1">
                    {isCheckedIn() ? "You're currently checked in" : "Ready to start your day in the garden?"}
                  </p>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isCheckedIn() 
                  ? "bg-[#eef5ee] text-[#5a7a5a] border border-[#7a9f7a]/30" 
                  : "bg-[#f5eaea] text-[#8a6a6a] border border-[#c9a9a6]/30"
              }`}>
                {isCheckedIn() ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Checked In</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Not Checked In</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 animate-slide-up"
            style={{ background: "#fcf2f2", border: "1px solid rgba(201, 137, 137, 0.3)" }}>
            <AlertCircle className="w-5 h-5 text-[#c98989] flex-shrink-0 mt-0.5" />
            <span className="text-[#8a5a5a]">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 animate-slide-up"
            style={{ background: "#eef5ee", border: "1px solid rgba(122, 159, 122, 0.3)" }}>
            <CheckCircle2 className="w-5 h-5 text-[#7a9f7a] flex-shrink-0 mt-0.5" />
            <span className="text-[#5a7a5a]">{success}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Check-in Time */}
          <div className="stat-card stat-card--emerald">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#9a8b7a] uppercase tracking-wider">Check-in Time</span>
              <Sunrise className="w-5 h-5 text-[#7a9f7a]" />
            </div>
            <p className="text-2xl font-display font-semibold text-[#3d3229]">
              {getLastCheckIn() 
                ? new Date(getLastCheckIn()!.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </p>
            {getLastCheckIn()?.is_within_geofence !== null && getLastCheckIn() && (
              <p className={`text-xs mt-2 ${getLastCheckIn()?.is_within_geofence ? "text-[#7a9f7a]" : "text-[#c98989]"}`}>
                {getLastCheckIn()?.is_within_geofence ? "✓ Within perimeter" : "⚠ Outside perimeter"}
              </p>
            )}
          </div>

          {/* Check-out Time */}
          <div className="stat-card stat-card--amber">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#9a8b7a] uppercase tracking-wider">Check-out Time</span>
              <Sunset className="w-5 h-5 text-[#d4a574]" />
            </div>
            <p className="text-2xl font-display font-semibold text-[#3d3229]">
              {getLastCheckOut() 
                ? new Date(getLastCheckOut()!.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </p>
            {getLastCheckOut()?.is_within_geofence !== null && getLastCheckOut() && (
              <p className={`text-xs mt-2 ${getLastCheckOut()?.is_within_geofence ? "text-[#7a9f7a]" : "text-[#c98989]"}`}>
                {getLastCheckOut()?.is_within_geofence ? "✓ Within perimeter" : "⚠ Outside perimeter"}
              </p>
            )}
          </div>

          {/* Today's Records */}
          <div className="stat-card stat-card--indigo">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#9a8b7a] uppercase tracking-wider">Today's Records</span>
              <Activity className="w-5 h-5 text-[#6b8f71]" />
            </div>
            <p className="text-2xl font-display font-semibold text-[#3d3229]">{todayAttendance.length}</p>
            <p className="text-xs text-[#9a8b7a] mt-2">
              {todayAttendance.filter(r => r.status === "check_in").length} check-ins, {" "}
              {todayAttendance.filter(r => r.status === "check_out").length} check-outs
            </p>
          </div>

          {/* Status */}
          <div className="stat-card stat-card--rose">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#9a8b7a] uppercase tracking-wider">Current Status</span>
              <div className={`w-3 h-3 rounded-full ${isCheckedIn() ? "bg-[#7a9f7a] animate-gentle-pulse" : "bg-[#c9a9a6]"}`} />
            </div>
            <p className="text-2xl font-display font-semibold text-[#3d3229]">
              {isCheckedIn() ? "Active" : "Inactive"}
            </p>
            <p className="text-xs text-[#9a8b7a] mt-2">
              {isCheckedIn() ? "Currently in the garden" : "Not checked in yet today"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleCheckIn}
            disabled={actionLoading || isCheckedIn()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {actionLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sunrise className="w-5 h-5" />
                <span>Check In</span>
              </div>
            )}
          </button>

          <button
            onClick={handleCheckOut}
            disabled={actionLoading || !isCheckedIn()}
            className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {actionLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sunset className="w-5 h-5" />
                <span>Check Out</span>
              </div>
            )}
          </button>
        </div>

        {/* Map Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c4a77d 0%, #b0956a 100%)" }}>
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-[#3d3229]">Garden Map</h3>
              <p className="text-sm text-[#9a8b7a]">Your location and garden perimeter</p>
            </div>
          </div>
          <div className="map-container">
            <AttendanceMap
              userLocation={null}
              geofences={geofenceCenter && geofenceCenter.lat !== undefined && geofenceCenter.lng !== undefined ? [{
                id: 1,
                latitude: geofenceCenter.lat || 0,
                longitude: geofenceCenter.lng || 0,
                radius: geofenceRadius,
                name: "Office Perimeter"
              }] : []}
            />
          </div>
        </div>

        {/* Today's Activity */}
        <div className="cottage-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c9a9a6 0%, #b89996 100%)" }}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-[#3d3229]">Today's Activity</h3>
              <p className="text-sm text-[#9a8b7a]">Your attendance records for today</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#6b8f71]" />
            </div>
          ) : todayAttendance.length === 0 ? (
            <div className="text-center py-12">
              <Flower2 className="w-12 h-12 mx-auto text-[#d4c4b0] mb-4" />
              <p className="text-[#9a8b7a]">No activity recorded today</p>
              <p className="text-sm text-[#b8a898] mt-1">Check in to start tracking your day</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Perimeter</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <span className={`badge ${record.status === "check_in" ? "badge--active" : "badge--primary"}`}>
                          {record.status === "check_in" ? "Check In" : "Check Out"}
                        </span>
                      </td>
                      <td className="font-mono text-sm">
                        {new Date(record.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="text-sm text-[#6b5d4d]">
                        {record.latitude && record.longitude
                          ? `${record.latitude.toFixed(6)}, ${record.longitude.toFixed(6)}`
                          : "N/A"}
                      </td>
                      <td>
                        {record.is_within_geofence !== null ? (
                          <span className={`badge ${record.is_within_geofence ? "badge--active" : "badge--danger"}`}>
                            {record.is_within_geofence ? "Within" : "Outside"}
                          </span>
                        ) : (
                          <span className="text-[#9a8b7a]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-8" style={{ borderColor: "#e8dfd2" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-[#9a8b7a]">
              <Leaf className="w-4 h-4" />
              <span>GeoTrack Garden Attendance System</span>
            </div>
            <p className="text-xs text-[#b8a898]">
              Cultivating attendance with care 🌿
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
