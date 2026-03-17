"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MapPin, Lock, User, Eye, EyeOff, Leaf, Trees, Flower2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Get the access token
      const loginRes = await fetch("http://localhost:8000/api/v1/login/access-token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
      });

      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => ({}));
        setError(data.detail || "Invalid credentials");
        setLoading(false);
        return;
      }

      const tokenData = await loginRes.json();
      const accessToken = tokenData.access_token;

      // Step 2: Fetch user data with the token
      const userRes = await fetch("http://localhost:8000/api/v1/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userRes.ok) {
        setError("Failed to fetch user data");
        setLoading(false);
        return;
      }

      const userData = await userRes.json();

      // Step 3: Login with combined data
      login({
        access_token: accessToken,
        token_type: "bearer",
        user: userData,
      });
    } catch {
      setError("Unable to connect to server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #faf8f5 0%, #f5f0e8 50%, #ebe5da 100%)" }}>
      
      {/* Decorative botanical elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Top left corner decoration */}
        <div className="absolute -top-20 -left-20 w-80 h-80 opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full text-[#6b8f71]">
            <path fill="currentColor" d="M50,100 Q30,60 50,20 Q70,60 50,100" />
            <path fill="currentColor" d="M50,100 Q20,80 10,50 Q40,70 50,100" opacity="0.7" />
            <path fill="currentColor" d="M50,100 Q80,80 90,50 Q60,70 50,100" opacity="0.7" />
            <circle cx="50" cy="15" r="8" fill="#c9a9a6" />
          </svg>
        </div>
        
        {/* Top right corner decoration */}
        <div className="absolute -top-10 -right-10 w-60 h-60 opacity-15">
          <svg viewBox="0 0 200 200" className="w-full h-full text-[#c4a77d]">
            <ellipse cx="100" cy="80" rx="40" ry="60" fill="currentColor" transform="rotate(30 100 100)" />
            <ellipse cx="100" cy="80" rx="35" ry="50" fill="currentColor" opacity="0.5" transform="rotate(-20 100 100)" />
          </svg>
        </div>
        
        {/* Bottom left decoration */}
        <div className="absolute -bottom-20 -left-10 w-72 h-72 opacity-15">
          <svg viewBox="0 0 200 200" className="w-full h-full text-[#6b8f71]">
            <path fill="currentColor" d="M100,180 Q60,140 80,80 Q100,140 100,180" />
            <path fill="currentColor" d="M100,180 Q140,140 120,80 Q100,140 100,180" opacity="0.8" />
            <circle cx="80" cy="75" r="6" fill="#c9a9a6" />
            <circle cx="120" cy="75" r="6" fill="#c9a9a6" />
          </svg>
        </div>
        
        {/* Bottom right decoration */}
        <div className="absolute bottom-10 -right-5 w-48 h-48 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#c9a9a6]">
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
        
        {/* Floating leaves */}
        <div className="absolute top-1/4 left-10 animate-float opacity-30">
          <Leaf className="w-6 h-6 text-[#6b8f71]" />
        </div>
        <div className="absolute top-1/3 right-20 animate-float" style={{ animationDelay: "1s", opacity: 0.25 }}>
          <Leaf className="w-5 h-5 text-[#c4a77d]" />
        </div>
        <div className="absolute bottom-1/3 left-1/4 animate-float" style={{ animationDelay: "2s", opacity: 0.2 }}>
          <Flower2 className="w-5 h-5 text-[#c9a9a6]" />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md relative">
        {/* Decorative top border */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#c4a77d] to-transparent" />
        
        <div className="cottage-card p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ 
                    background: "linear-gradient(135deg, #6b8f71 0%, #5a7d61 100%)",
                    boxShadow: "0 4px 20px rgba(107, 143, 113, 0.25)"
                  }}>
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#c9a9a6] flex items-center justify-center">
                  <Leaf className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="font-display text-3xl font-semibold text-[#3d3229] tracking-tight">
              GeoTrack
            </h1>
            <p className="text-[#6b5d4d] mt-2 text-base font-body">
              Garden Attendance Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="label">
                Username
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: "rgba(107, 143, 113, 0.1)",
                    border: "1px solid rgba(107, 143, 113, 0.2)"
                  }}>
                  <User className="w-5 h-5 text-[#6b8f71]" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-cottage flex-1"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: "rgba(107, 143, 113, 0.1)",
                    border: "1px solid rgba(107, 143, 113, 0.2)"
                  }}>
                  <Lock className="w-5 h-5 text-[#6b8f71]" />
                </div>
                <div className="relative flex-1">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-cottage w-full pr-12"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9a8b7a] hover:text-[#6b8f71] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl text-sm flex items-start gap-3"
                style={{ 
                  background: "rgba(201, 137, 137, 0.1)",
                  border: "1px solid rgba(201, 137, 137, 0.3)"
                }}>
                <div className="w-5 h-5 rounded-full bg-[#c98989] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">!</span>
                </div>
                <span className="text-[#8a5a5a]">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trees className="w-5 h-5" />
                  <span>Enter the Garden</span>
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#e8dfd2]">
            <p className="text-center text-sm text-[#9a8b7a]">
              Need assistance?{" "}
              <a href="#" className="text-[#6b8f71] hover:text-[#5a7d61] font-medium transition-colors">
                Contact your administrator
              </a>
            </p>
          </div>
        </div>
        
        {/* Bottom decorative text */}
        <p className="text-center text-xs text-[#9a8b7a] mt-6 opacity-70">
          Cultivating attendance with care 🌿
        </p>
      </div>
    </div>
  );
}
