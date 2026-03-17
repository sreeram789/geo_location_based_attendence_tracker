"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  Settings,
  LogOut,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Leaf,
  Trees,
  Flower2,
  Sunrise,
  Sunset,
  Activity,
  User,
  Shield,
  Sprout,
} from "lucide-react";

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

interface UserItem {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  assigned_geofence_id: number | null;
}

interface Geofence {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface AttendanceRecord {
  id: number;
  user_id: number;
  timestamp: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  distance_meters: number | null;
  is_within_geofence: boolean | null;
  user?: { full_name: string; username: string };
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "geofence" | "attendance">("overview");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Form states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showGeofenceForm, setShowGeofenceForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [draftingGeofence, setDraftingGeofence] = useState<{ latitude: number; longitude: number; radius: number } | null>(null);

  // User form
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role: "employee",
    is_active: true,
  });

  // Geofence form
  const [geofenceForm, setGeofenceForm] = useState({
    name: "",
    center_latitude: 0,
    center_longitude: 0,
    radius_meters: 100,
  });

  useEffect(() => {
    if (!user || user.user?.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchData();
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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, geofencesRes, attendanceRes] = await Promise.all([
        fetch("http://localhost:8000/api/v1/users/", {
          headers: { Authorization: `Bearer ${user?.access_token}` },
        }),
        fetch("http://localhost:8000/api/v1/geofences/", {
          headers: { Authorization: `Bearer ${user?.access_token}` },
        }),
        fetch("http://localhost:8000/api/v1/attendance/admin/all", {
          headers: { Authorization: `Bearer ${user?.access_token}` },
        }),
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (geofencesRes.ok) setGeofences(await geofencesRes.json());
      if (attendanceRes.ok) setAttendance(await attendanceRes.json());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // User CRUD
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/api/v1/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(userForm),
      });
      if (res.ok) {
        setShowUserForm(false);
        setUserForm({ username: "", email: "", full_name: "", password: "", role: "employee", is_active: true });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(userForm),
      });
      if (res.ok) {
        setEditingUser(null);
        setUserForm({ username: "", email: "", full_name: "", password: "", role: "employee", is_active: true });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.access_token}` },
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  // Geofence CRUD
  const handleCreateGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Map frontend field names to backend expected names
      const payload = {
        name: geofenceForm.name,
        latitude: geofenceForm.center_latitude,
        longitude: geofenceForm.center_longitude,
        radius: geofenceForm.radius_meters,
      };
      const res = await fetch("http://localhost:8000/api/v1/geofences/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowGeofenceForm(false);
        setGeofenceForm({ name: "", center_latitude: 0, center_longitude: 0, radius_meters: 100 });
        setDraftingGeofence(null);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create geofence:", error);
    }
  };

  const handleUpdateGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGeofence) return;
    try {
      // Map frontend field names to backend expected names
      const payload = {
        name: geofenceForm.name,
        latitude: geofenceForm.center_latitude,
        longitude: geofenceForm.center_longitude,
        radius: geofenceForm.radius_meters,
      };
      const res = await fetch(`http://localhost:8000/api/v1/geofences/${editingGeofence.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditingGeofence(null);
        setGeofenceForm({ name: "", center_latitude: 0, center_longitude: 0, radius_meters: 100 });
        setDraftingGeofence(null);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update geofence:", error);
    }
  };

  const handleDeleteGeofence = async (geofenceId: number) => {
    if (!confirm("Are you sure you want to delete this geofence?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/geofences/${geofenceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.access_token}` },
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to delete geofence:", error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setGeofenceForm((prev) => ({ ...prev, center_latitude: lat, center_longitude: lng }));
    setDraftingGeofence((prev) => prev ? { ...prev, latitude: lat, longitude: lng } : null);
  };

  const startGeofenceDraft = () => {
    setDraftingGeofence({
      latitude: geofenceForm.center_latitude || 11.4986,
      longitude: geofenceForm.center_longitude || 77.2743,
      radius: geofenceForm.radius_meters || 100,
    });
  };

  if (!user) return null;

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.is_active).length,
    totalGeofences: geofences.length,
    todayAttendance: attendance.filter((a) => new Date(a.timestamp).toDateString() === new Date().toDateString()).length,
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "users", label: "Users", icon: Users },
    { id: "geofence", label: "Geofences", icon: MapPin },
    { id: "attendance", label: "Attendance", icon: Calendar },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#faf8f5" }}>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
        style={{
          background: "linear-gradient(180deg, #f5f0e8 0%, #ebe5da 100%)",
          borderRight: "1px solid #e8dfd2",
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: "#e8dfd2" }}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #6b8f71 0%, #5a7d61 100%)",
                  boxShadow: "0 2px 10px rgba(107, 143, 113, 0.2)",
                }}
              >
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold text-[#3d3229]">GeoTrack</h1>
                <p className="text-xs text-[#9a8b7a]">Admin Portal</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-[#ebe5da] transition-colors"
          >
            <ChevronDown
              className={`w-5 h-5 text-[#9a8b7a] transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? "bg-[#6b8f71] text-white shadow-lg"
                  : "text-[#6b5d4d] hover:bg-[#ebe5da]"
              }`}
              style={
                activeTab === item.id
                  ? { boxShadow: "0 4px 12px rgba(107, 143, 113, 0.25)" }
                  : {}
              }
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        {!sidebarCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div
              className="p-4 rounded-xl"
              style={{
                background: "rgba(196, 167, 125, 0.1)",
                border: "1px solid rgba(196, 167, 125, 0.2)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Leaf className="w-5 h-5 text-[#6b8f71]" />
                <span className="text-sm font-medium text-[#3d3229]">Garden Tips</span>
              </div>
              <p className="text-xs text-[#9a8b7a]">
                Remember to water the plants and check the perimeter daily.
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-30 backdrop-blur-xl border-b"
          style={{
            background: "rgba(255, 252, 247, 0.9)",
            borderColor: "#e8dfd2",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#3d3229] capitalize">
                {activeTab}
              </h2>
              <p className="text-xs text-[#9a8b7a]">Manage your garden attendance system</p>
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl transition-all hover:bg-[#f5f0e8]"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #c9a9a6 0%, #b89996 100%)" }}
                >
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-[#3d3229]">{user.user?.full_name}</p>
                  <p className="text-xs text-[#9a8b7a]">Administrator</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#9a8b7a] transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border p-2 animate-fade-in"
                  style={{ background: "#fff", borderColor: "#e8dfd2" }}
                >
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
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#6b8f71]" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-8 animate-fade-in">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="stat-card stat-card--emerald">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-[#9a8b7a] uppercase tracking-wider">Total Users</span>
                        <Users className="w-5 h-5 text-[#7a9f7a]" />
                      </div>
                      <p className="text-3xl font-display font-semibold text-[#3d3229]">{stats.totalUsers}</p>
                      <p className="text-xs text-[#9a8b7a] mt-2">{stats.activeUsers} active</p>
                    </div>

                    <div className="stat-card stat-card--indigo">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-[#9a8b7a] uppercase tracking-wider">Geofences</span>
                        <MapPin className="w-5 h-5 text-[#6b8f71]" />
                      </div>
                      <p className="text-3xl font-display font-semibold text-[#3d3229]">{stats.totalGeofences}</p>
                      <p className="text-xs text-[#9a8b7a] mt-2">Perimeter zones</p>
                    </div>

                    <div className="stat-card stat-card--amber">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-[#9a8b7a] uppercase tracking-wider">Today's Activity</span>
                        <Activity className="w-5 h-5 text-[#d4a574]" />
                      </div>
                      <p className="text-3xl font-display font-semibold text-[#3d3229]">{stats.todayAttendance}</p>
                      <p className="text-xs text-[#9a8b7a] mt-2">Check-ins/out</p>
                    </div>

                    <div className="stat-card stat-card--rose">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-[#9a8b7a] uppercase tracking-wider">System Status</span>
                        <Sprout className="w-5 h-5 text-[#c9a9a6]" />
                      </div>
                      <p className="text-3xl font-display font-semibold text-[#7a9f7a]">Healthy</p>
                      <p className="text-xs text-[#9a8b7a] mt-2">All systems operational</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="cottage-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #c9a9a6 0%, #b89996 100%)" }}
                      >
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-[#3d3229]">Recent Activity</h3>
                        <p className="text-sm text-[#9a8b7a]">Latest attendance records</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {attendance.slice(0, 5).map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-4 rounded-xl"
                          style={{ background: "#faf8f5" }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                record.status === "check_in" ? "bg-[#eef5ee]" : "bg-[#f5eaea]"
                              }`}
                            >
                              {record.status === "check_in" ? (
                                <Sunrise className="w-5 h-5 text-[#7a9f7a]" />
                              ) : (
                                <Sunset className="w-5 h-5 text-[#c9a9a6]" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-[#3d3229]">{record.user?.full_name || "Unknown"}</p>
                              <p className="text-xs text-[#9a8b7a]">
                                {new Date(record.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`badge ${
                              record.status === "check_in" ? "badge--active" : "badge--primary"
                            }`}
                          >
                            {record.status === "check_in" ? "Check In" : "Check Out"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === "users" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-[#3d3229]">User Management</h3>
                      <p className="text-sm text-[#9a8b7a]">Add, edit, and manage garden members</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserForm(true);
                        setEditingUser(null);
                        setUserForm({
                          username: "",
                          email: "",
                          full_name: "",
                          password: "",
                          role: "employee",
                          is_active: true,
                        });
                      }}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add User</span>
                    </button>
                  </div>

                  {/* User Form Modal */}
                  {(showUserForm || editingUser) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
                      <div
                        className="w-full max-w-md rounded-2xl p-6 animate-slide-up"
                        style={{ background: "#fff", border: "1px solid #e8dfd2" }}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-display text-lg font-semibold text-[#3d3229]">
                            {editingUser ? "Edit User" : "New User"}
                          </h4>
                          <button
                            onClick={() => {
                              setShowUserForm(false);
                              setEditingUser(null);
                            }}
                            className="p-2 rounded-lg hover:bg-[#f5f0e8] transition-colors"
                          >
                            <X className="w-5 h-5 text-[#9a8b7a]" />
                          </button>
                        </div>

                        <form
                          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
                          className="space-y-4"
                        >
                          <div>
                            <label className="label">Username</label>
                            <input
                              type="text"
                              value={userForm.username}
                              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                              className="input-cottage"
                              required
                            />
                          </div>
                          <div>
                            <label className="label">Full Name</label>
                            <input
                              type="text"
                              value={userForm.full_name}
                              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                              className="input-cottage"
                              required
                            />
                          </div>
                          <div>
                            <label className="label">Email</label>
                            <input
                              type="email"
                              value={userForm.email}
                              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                              className="input-cottage"
                              required
                            />
                          </div>
                          {!editingUser && (
                            <div>
                              <label className="label">Password</label>
                              <input
                                type="password"
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                className="input-cottage"
                                required
                              />
                            </div>
                          )}
                          <div>
                            <label className="label">Role</label>
                            <select
                              value={userForm.role}
                              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                              className="input-cottage"
                            >
                              <option value="employee">Employee</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <button type="submit" className="btn-primary w-full">
                            <Save className="w-4 h-4" />
                            <span>{editingUser ? "Update User" : "Create User"}</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Users Table */}
                  <div className="cottage-card overflow-hidden">
                    <table className="table-premium">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                                  style={{ background: "linear-gradient(135deg, #c9a9a6 0%, #b89996 100%)" }}
                                >
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium text-[#3d3229]">{u.full_name}</p>
                                  <p className="text-xs text-[#9a8b7a]">@{u.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="text-[#6b5d4d]">{u.email}</td>
                            <td>
                              <span className={`badge ${u.role === "admin" ? "badge--primary" : "badge--inactive"}`}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${u.is_active ? "badge--active" : "badge--danger"}`}>
                                {u.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingUser(u);
                                    setUserForm({
                                      username: u.username,
                                      email: u.email,
                                      full_name: u.full_name,
                                      password: "",
                                      role: u.role,
                                      is_active: u.is_active,
                                    });
                                  }}
                                  className="p-2 rounded-lg hover:bg-[#f5f0e8] transition-colors"
                                >
                                  <Edit3 className="w-4 h-4 text-[#6b8f71]" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-2 rounded-lg hover:bg-[#fcf2f2] transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-[#c98989]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Geofence Tab */}
              {activeTab === "geofence" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-[#3d3229]">Geofence Management</h3>
                      <p className="text-sm text-[#9a8b7a]">Define garden perimeter zones</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowGeofenceForm(true);
                        setEditingGeofence(null);
                        setGeofenceForm({
                          name: "",
                          center_latitude: 11.4986,
                          center_longitude: 77.2743,
                          radius_meters: 100,
                        });
                        startGeofenceDraft();
                      }}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Geofence</span>
                    </button>
                  </div>

                  {/* Geofence Form */}
                  {(showGeofenceForm || editingGeofence) && (
                    <div className="cottage-card p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-display text-lg font-semibold text-[#3d3229]">
                          {editingGeofence ? "Edit Geofence" : "New Geofence"}
                        </h4>
                        <button
                          onClick={() => {
                            setShowGeofenceForm(false);
                            setEditingGeofence(null);
                            setDraftingGeofence(null);
                          }}
                          className="p-2 rounded-lg hover:bg-[#f5f0e8] transition-colors"
                        >
                          <X className="w-5 h-5 text-[#9a8b7a]" />
                        </button>
                      </div>

                      <form
                        onSubmit={editingGeofence ? handleUpdateGeofence : handleCreateGeofence}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="label">Name</label>
                            <input
                              type="text"
                              value={geofenceForm.name}
                              onChange={(e) => setGeofenceForm({ ...geofenceForm, name: e.target.value })}
                              className="input-cottage"
                              placeholder="Office Perimeter"
                              required
                            />
                          </div>
                          <div>
                            <label className="label">Radius (meters)</label>
                            <input
                              type="number"
                              value={geofenceForm.radius_meters}
                              onChange={(e) => {
                                const radius = parseInt(e.target.value);
                                setGeofenceForm({ ...geofenceForm, radius_meters: radius });
                                setDraftingGeofence((prev) => (prev ? { ...prev, radius } : null));
                              }}
                              className="input-cottage"
                              min={10}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="label">Latitude</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={geofenceForm.center_latitude}
                              onChange={(e) => {
                                const lat = parseFloat(e.target.value);
                                setGeofenceForm({ ...geofenceForm, center_latitude: lat });
                                setDraftingGeofence((prev) => (prev ? { ...prev, latitude: lat } : null));
                              }}
                              className="input-cottage"
                              required
                            />
                          </div>
                          <div>
                            <label className="label">Longitude</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={geofenceForm.center_longitude}
                              onChange={(e) => {
                                const lng = parseFloat(e.target.value);
                                setGeofenceForm({ ...geofenceForm, center_longitude: lng });
                                setDraftingGeofence((prev) => (prev ? { ...prev, longitude: lng } : null));
                              }}
                              className="input-cottage"
                              required
                            />
                          </div>
                        </div>

                        <p className="text-sm text-[#9a8b7a]">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          Click on the map to set the geofence center, or drag the marker to reposition.
                        </p>

                        <div className="map-container">
                          <AttendanceMap
                            userLocation={null}
                            geofences={geofences
                              .filter((g) => g.latitude !== undefined && g.longitude !== undefined)
                              .map((g) => ({
                              id: g.id,
                              latitude: g.latitude || 0,
                              longitude: g.longitude || 0,
                              radius: g.radius || 100,
                              name: g.name,
                            }))}
                            isAdmin={true}
                            onMapClick={handleMapClick}
                            draftingGeofence={draftingGeofence}
                          />
                        </div>

                        <button type="submit" className="btn-primary">
                          <Save className="w-4 h-4" />
                          <span>{editingGeofence ? "Update Geofence" : "Create Geofence"}</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Geofences List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {geofences.map((gf) => (
                      <div key={gf.id} className="cottage-card p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ background: "linear-gradient(135deg, #6b8f71 0%, #5a7d61 100%)" }}
                            >
                              <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-[#3d3229]">{gf.name}</h4>
                              <p className="text-xs text-[#9a8b7a]">{gf.radius}m radius</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingGeofence(gf);
                                setGeofenceForm({
                                  name: gf.name,
                                  center_latitude: gf.latitude,
                                  center_longitude: gf.longitude,
                                  radius_meters: gf.radius,
                                });
                                startGeofenceDraft();
                              }}
                              className="p-2 rounded-lg hover:bg-[#f5f0e8] transition-colors"
                            >
                              <Edit3 className="w-4 h-4 text-[#6b8f71]" />
                            </button>
                            <button
                              onClick={() => handleDeleteGeofence(gf.id)}
                              className="p-2 rounded-lg hover:bg-[#fcf2f2] transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-[#c98989]" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-[#9a8b7a] font-mono">
                          {gf.latitude?.toFixed(6) ?? 'N/A'}, {gf.longitude?.toFixed(6) ?? 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === "attendance" && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-[#3d3229]">Attendance Records</h3>
                    <p className="text-sm text-[#9a8b7a]">View all check-in and check-out records</p>
                  </div>

                  <div className="cottage-card overflow-hidden">
                    <table className="table-premium">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Status</th>
                          <th>Time</th>
                          <th>Location</th>
                          <th>Perimeter</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((record) => (
                          <tr key={record.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                                  style={{ background: "linear-gradient(135deg, #c9a9a6 0%, #b89996 100%)" }}
                                >
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-medium text-[#3d3229]">
                                  {record.user?.full_name || "Unknown"}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  record.status === "check_in" ? "badge--active" : "badge--primary"
                                }`}
                              >
                                {record.status === "check_in" ? "Check In" : "Check Out"}
                              </span>
                            </td>
                            <td className="font-mono text-sm text-[#6b5d4d]">
                              {new Date(record.timestamp).toLocaleString()}
                            </td>
                            <td className="text-sm text-[#6b5d4d]">
                              {record.latitude != null && record.longitude != null
                                ? `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`
                                : "N/A"}
                            </td>
                            <td>
                              {record.is_within_geofence !== null ? (
                                <span
                                  className={`badge ${
                                    record.is_within_geofence ? "badge--active" : "badge--danger"
                                  }`}
                                >
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
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
