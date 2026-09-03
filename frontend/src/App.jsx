import React, { useState, useEffect } from 'react';
import {
  Wheat, User, LayoutGrid, BarChart3, Bell, Sparkles, Globe,
  LogOut, LogIn, CheckCircle2, ShieldCheck, Scale, Phone, Key,
  Radio, Clock, CheckCircle, ChevronDown, ChevronRight
} from 'lucide-react';
import { io } from 'socket.io-client';
import FarmerPortal from './components/FarmerPortal';
import OfficerDashboard from './components/OfficerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AiVoiceModal from './components/AiVoiceModal';
import NotificationDrawer from './components/NotificationDrawer';
import { api, setAuthToken, setCurrentUser, getCurrentUser } from './api';
import { translations } from './translations';

export default function App() {
  const [role, setRole] = useState('farmer'); // 'farmer', 'officer', 'admin'
  const [language, setLanguage] = useState('hi'); // 'hi', 'en', 'te'
  const [farmer, setFarmer] = useState(null);
  const [staff, setStaff] = useState(null);
  const [activeFarmerTab, setActiveFarmerTab] = useState('dashboard');
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // Modals and Drawers
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('farmer_otp'); // 'farmer_otp', 'staff_login'

  // Auth Form State
  const [phoneInput, setPhoneInput] = useState('9876500001');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('123456');
  const [testOtpNotice, setTestOtpNotice] = useState('');
  const [staffEmail, setStaffEmail] = useState('officer.lucknow@kisansetu.gov.in');
  const [staffPassword, setStaffPassword] = useState('password123');
  const [authLoading, setAuthLoading] = useState(false);

  // Notifications & Socket
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  const t = translations[language] || translations.hi;

  useEffect(() => {
    const s = io(window.location.origin, { transports: ['websocket', 'polling'] });
    setSocket(s);

    const initFarmerAuth = async () => {
      try {
        const res = await api.login({ phone: '9876500001', password: 'password123' });
        if (res && res.success) {
          setAuthToken(res.data.accessToken);
          setCurrentUser({ ...res.data.farmer, role: 'farmer' });
          setFarmer(res.data.farmer);
        }
      } catch (e) {
        console.warn('Auto farmer login fallback:', e.message);
        setFarmer({
          _id: '6a989238b12c298f488371df',
          name: 'Ramesh Kumar',
          phone: '9876500001',
          village: 'Mohanlalganj',
          district: 'Lucknow',
          state: 'Uttar Pradesh',
        });
      }
      loadNotifications();
    };

    initFarmerAuth();

    return () => {
      s.disconnect();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) setNotifications(res.data);
    } catch (e) {
      console.warn('Notifications load fallback:', e.message);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneInput || phoneInput.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.sendOtp({ phone: phoneInput });
      if (res.success) {
        setOtpSent(true);
        setTestOtpNotice(`Demo SMS Code: ${res.data.testOtp || '123456'} (Auto-filled)`);
        setOtpInput(res.data.testOtp || '123456');
      }
    } catch (err) {
      alert(err.message || 'Failed to send OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await api.verifyOtp({ phone: phoneInput, otp: otpInput });
      if (res.success) {
        setAuthToken(res.data.accessToken);
        setCurrentUser({ ...res.data.farmer, role: 'farmer' });
        setFarmer(res.data.farmer);
        setIsLoggedOut(false);
        setIsAuthModalOpen(false);
        setRole('farmer');
        setOtpSent(false);
      }
    } catch (err) {
      alert(err.message || 'Invalid OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await api.staffLogin({ email: staffEmail, password: staffPassword });
      if (res.success) {
        setAuthToken(res.data.accessToken);
        setCurrentUser({ ...res.data.staff, role: res.data.role });
        setStaff(res.data.staff);
        setIsLoggedOut(false);
        setIsAuthModalOpen(false);
        if (res.data.role === 'centre_staff') setRole('officer');
        else setRole('admin');
      }
    } catch (err) {
      alert(err.message || 'Staff login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSwitchRole = async (targetRole) => {
    setRole(targetRole);
    if (!isLoggedOut) {
      if (targetRole === 'officer' && !staff) {
        try {
          const res = await api.staffLogin({
            email: 'officer.lucknow@kisansetu.gov.in',
            password: 'password123',
          });
          if (res.success) {
            setAuthToken(res.data.accessToken);
            setCurrentUser({ ...res.data.staff, role: res.data.role });
            setStaff(res.data.staff);
          }
        } catch (e) {
          console.warn('Auto staff auth notice:', e.message);
        }
      } else if (targetRole === 'admin' && !staff) {
        try {
          const res = await api.staffLogin({
            email: 'admin.lucknow@kisansetu.gov.in',
            password: 'password123',
          });
          if (res.success) {
            setAuthToken(res.data.accessToken);
            setCurrentUser({ ...res.data.staff, role: res.data.role });
            setStaff(res.data.staff);
          }
        } catch (e) {
          console.warn('Auto admin auth notice:', e.message);
        }
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedOut(true);
    setAuthToken(null);
    setCurrentUser(null);
    setFarmer(null);
    setStaff(null);
    localStorage.removeItem('kisan_auth_token');
    localStorage.removeItem('kisan_user_data');
    if (role === 'admin' || role === 'officer') {
      setAuthMode('staff_login');
    } else {
      setAuthMode('farmer_otp');
    }
    setIsAuthModalOpen(true);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F7F5EE] text-[#142217] flex flex-col selection:bg-[#C98A2E]/30">
      {/* Top National Ribbon */}
      <div className="bg-[#0F1A12] text-white/70 text-[11px] py-1.5 px-4 sm:px-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#38EF7D] animate-ping"></span>
          <span className="font-semibold text-white/90">
            उत्तर प्रदेश राज्य कृषि उत्पादन मण्डी परिषद (UP Mandi Parishad) · Live Mandi Network Synchronized
          </span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-white/60">Season: Rabi 2026 · MSP Guaranteed</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-white/60">Toll-Free Kisan Call: 1800-180-1551</span>
          <span className="text-[#EBB668] font-semibold">SIH Problem Statement 26032</span>
        </div>
      </div>

      {/* Main Luxury Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#142217] via-[#1B2F20] to-[#142217] text-white border-b border-[#C98A2E]/30 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#C98A2E] to-[#9E6819] flex items-center justify-center shadow-lg shadow-[#C98A2E]/30 border border-white/20">
                <Wheat className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-serif text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    {t.appTitle}
                    <span className="text-[10px] font-sans font-extrabold bg-[#C98A2E] text-black px-2.5 py-0.5 rounded-full shadow-sm">
                      PRO 2026
                    </span>
                  </h1>
                </div>
                <p className="text-xs text-[#8FA584] hidden sm:block font-medium">
                  Intelligent Capacity-Aware Agricultural Procurement Platform
                </p>
              </div>
            </div>

            {/* Middle Role Switcher Pills */}
            <nav className="hidden md:flex items-center gap-1.5 bg-[#0D170F]/80 p-1.5 rounded-2xl border border-white/10 shadow-inner">
              <button
                onClick={() => handleSwitchRole('farmer')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  role === 'farmer'
                    ? 'bg-gradient-to-r from-[#C98A2E] to-[#A56F20] text-white shadow-md shadow-[#C98A2E]/25'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4" /> {t.farmerRole}
              </button>
              <button
                onClick={() => handleSwitchRole('officer')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  role === 'officer'
                    ? 'bg-gradient-to-r from-[#C98A2E] to-[#A56F20] text-white shadow-md shadow-[#C98A2E]/25'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Scale className="w-4 h-4" /> {t.officerRole}
              </button>
              <button
                onClick={() => handleSwitchRole('admin')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  role === 'admin'
                    ? 'bg-gradient-to-r from-[#C98A2E] to-[#A56F20] text-white shadow-md shadow-[#C98A2E]/25'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> {t.adminRole}
              </button>
            </nav>

            {/* Right Tools (AI Voice, Language, Notifications, Auth) */}
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* AI Voice Assistant Trigger */}
              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className="bg-gradient-to-r from-[#C98A2E]/25 to-[#C98A2E]/10 hover:from-[#C98A2E]/35 hover:to-[#C98A2E]/20 text-[#EBB668] border border-[#C98A2E]/50 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:scale-105 active:scale-95"
                title="AI Voice Assistant"
              >
                <Sparkles className="w-4 h-4 text-[#EBB668] animate-pulse" />
                <span className="hidden sm:inline font-bold">AI Voice</span>
              </button>

              {/* Language Switcher */}
              <div className="relative flex items-center">
                <Globe className="w-3.5 h-3.5 text-[#8FA584] absolute left-2.5 pointer-events-none" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[#0D170F] border border-white/15 text-white text-xs rounded-xl pl-8 pr-3 py-2 outline-none cursor-pointer hover:border-[#C98A2E]/60 transition-colors font-medium"
                >
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="en">English</option>
                  <option value="te">తెలుగు (Telugu)</option>
                </select>
              </div>

              {/* Notifications Bell */}
              <button
                onClick={() => setIsNotifDrawerOpen(true)}
                className="relative p-2.5 rounded-xl bg-[#0D170F] hover:bg-white/10 border border-white/15 transition-colors"
                title="Mandi Alerts"
              >
                <Bell className="w-4 h-4 text-white/80" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#BA3D2C] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Account Badge or Sign In Button */}
              {(() => {
                const isAuthenticated = !isLoggedOut && Boolean((role === 'farmer' && farmer) || (role !== 'farmer' && staff));

                if (!isAuthenticated) {
                  return (
                    <button
                      onClick={() => {
                        if (role === 'admin' || role === 'officer') setAuthMode('staff_login');
                        else setAuthMode('farmer_otp');
                        setIsAuthModalOpen(true);
                      }}
                      className="btn-gold text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold shadow-md hover:scale-105 transition-all"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Sign In
                    </button>
                  );
                }

                const activeUserDisplay = (() => {
                  if (role === 'admin') {
                    return {
                      name: staff?.name || 'Dr. Sunita Deshmukh',
                      sub: 'District Collector / Admin (Lucknow)',
                      avatarColor: 'from-[#BA3D2C] to-[#8C291B]',
                    };
                  }
                  if (role === 'officer') {
                    return {
                      name: staff?.name || 'Virender Singh',
                      sub: 'Mandi Officer (Lucknow APMC)',
                      avatarColor: 'from-[#C98A2E] to-[#9E6819]',
                    };
                  }
                  return {
                    name: farmer?.name || 'Ramesh Kumar',
                    sub: `Verified Farmer (${farmer?.village || 'Mohanlalganj'}, ${farmer?.district || 'Lucknow'})`,
                    avatarColor: 'from-[#1B7A38] to-[#145C2B]',
                  };
                })();

                return (
                  <div className="flex items-center gap-2.5 bg-[#0D170F] px-3 py-1.5 rounded-xl border border-white/15 shadow-inner">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeUserDisplay.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-sm`}>
                      {activeUserDisplay.name.charAt(0)}
                    </div>
                    <div className="text-right hidden lg:block">
                      <p className="text-xs font-bold text-white truncate max-w-[150px]">
                        {activeUserDisplay.name}
                      </p>
                      <p className="text-[10px] text-[#8FA584] font-medium">
                        {activeUserDisplay.sub}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 rounded-lg hover:bg-[#BA3D2C]/20 text-white/70 hover:text-[#BA3D2C] transition-colors"
                      title="Logout of session"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Nav Role Switcher */}
        <div className="md:hidden flex border-t border-white/10 bg-[#0D170F] divide-x divide-white/10 text-xs">
          <button
            onClick={() => handleSwitchRole('farmer')}
            className={`flex-1 py-3 font-bold text-center flex items-center justify-center gap-1.5 ${
              role === 'farmer' ? 'text-[#EBB668] bg-[#142217]' : 'text-white/60'
            }`}
          >
            <User className="w-3.5 h-3.5" /> {t.farmerRole}
          </button>
          <button
            onClick={() => handleSwitchRole('officer')}
            className={`flex-1 py-3 font-bold text-center flex items-center justify-center gap-1.5 ${
              role === 'officer' ? 'text-[#EBB668] bg-[#142217]' : 'text-white/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> {t.officerRole}
          </button>
          <button
            onClick={() => handleSwitchRole('admin')}
            className={`flex-1 py-3 font-bold text-center flex items-center justify-center gap-1.5 ${
              role === 'admin' ? 'text-[#EBB668] bg-[#142217]' : 'text-white/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> {t.adminRole}
          </button>
        </div>
      </header>

      {/* Main View Portals */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {role === 'farmer' && (
          <FarmerPortal
            farmer={farmer}
            setFarmer={setFarmer}
            activeTab={activeFarmerTab}
            setActiveTab={setActiveFarmerTab}
            language={language}
            socket={socket}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          />
        )}

        {role === 'officer' && (
          <OfficerDashboard
            staff={staff}
            socket={socket}
          />
        )}

        {role === 'admin' && (
          <AdminDashboard socket={socket} />
        )}
      </main>

      {/* Modern Luxury Footer */}
      <footer className="bg-[#142217] text-white/70 text-xs py-8 border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C98A2E]/20 flex items-center justify-center border border-[#C98A2E]/40">
                <Wheat className="w-5 h-5 text-[#C98A2E]" />
              </div>
              <div>
                <span className="text-white font-bold text-sm block">Kisan Setu · SIH 26032</span>
                <span className="text-[11px] text-white/50">Intelligent Capacity-Aware Agricultural Procurement Platform</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-white/60">
              <span>Zero Mandi Overcrowding</span>
              <span>·</span>
              <span>Sub-Second Queue Sync</span>
              <span>·</span>
              <span>Instant DBT Disbursal</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 gap-2">
            <div>
              Built for Smart India Hackathon 2026 · Powered by Node.js, Express, MongoDB, Socket.IO, Vite, Tailwind CSS & AI Engine
            </div>
            <div>
              Version 2.6 Pro · Branch: <span className="font-mono text-white/60">aryan</span>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Multilingual Voice Assistant Modal */}
      <AiVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        language={language}
        onNavigateTab={(tab) => {
          setRole('farmer');
          setActiveFarmerTab(tab);
          setIsVoiceModalOpen(false);
        }}
      />

      {/* Real-time Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onRefresh={loadNotifications}
      />

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DDD8CB] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#142217] to-[#1F3424] text-white p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-[#C98A2E] text-black px-2.5 py-0.5 rounded-full">
                  Verified Portal
                </span>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Close Modal"
                >
                  ✕
                </button>
              </div>
              <h3 className="font-serif text-xl font-bold">
                {authMode === 'farmer_otp' ? 'Farmer OTP Authentication' : 'Mandi Officer & Admin Sign In'}
              </h3>
              <p className="text-xs text-white/70 mt-1">
                {authMode === 'farmer_otp' ? 'Login via 10-digit mobile number with direct SMS OTP.' : 'Restricted to authorized procurement officials.'}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {authMode === 'farmer_otp' ? (
                <div className="space-y-4 text-xs">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block font-semibold mb-1.5 text-[#142217]">
                          Mobile Number (10 digits)
                        </label>
                        <div className="flex gap-2">
                          <span className="bg-[#EDEAE1] border border-[#DDD8CB] px-3 py-2.5 rounded-xl text-xs font-bold text-[#142217] flex items-center">
                            +91
                          </span>
                          <input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="9876500001"
                            className="input-field text-base font-mono font-bold"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="btn-gold w-full justify-center py-3 text-sm font-bold shadow-lg"
                      >
                        {authLoading ? 'Sending SMS OTP...' : 'Send SMS OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      {testOtpNotice && (
                        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{testOtpNotice}</span>
                        </div>
                      )}
                      <div>
                        <label className="block font-semibold mb-1.5 text-[#142217]">
                          Enter 6-Digit OTP Sent via SMS
                        </label>
                        <input
                          type="text"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          className="input-field text-center font-mono text-2xl tracking-[0.3em] font-extrabold"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-lg"
                      >
                        {authLoading ? 'Verifying...' : 'Verify OTP & Enter Portal'}
                      </button>
                    </form>
                  )}

                  <div className="pt-3 border-t border-[#DDD8CB] text-center">
                    <button
                      type="button"
                      onClick={() => setAuthMode('staff_login')}
                      className="text-[#C98A2E] font-bold hover:underline"
                    >
                      Are you a Mandi Officer or Admin? Click here
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleStaffLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-[#142217]">Official Email Address</label>
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[#142217]">Password</label>
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-lg"
                  >
                    {authLoading ? 'Authenticating...' : 'Sign In as Officer / Admin'}
                  </button>

                  <div className="pt-3 border-t border-[#DDD8CB] text-center">
                    <button
                      type="button"
                      onClick={() => setAuthMode('farmer_otp')}
                      className="text-[#C98A2E] font-bold hover:underline"
                    >
                      Are you a farmer? Login via Mobile OTP
                    </button>
                  </div>
                </form>
              )}

              {/* 1-Click Quick Demo Access */}
              <div className="pt-3 border-t border-[#DDD8CB] space-y-2">
                <span className="text-[10px] text-[#142217]/60 font-extrabold uppercase tracking-wider block text-center">
                  Instant Demo 1-Click Sign In
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      setAuthLoading(true);
                      try {
                        const res = await api.login({ phone: '9876500001', password: 'password123' });
                        if (res.success) {
                          setAuthToken(res.data.accessToken);
                          setCurrentUser({ ...res.data.farmer, role: 'farmer' });
                          setFarmer(res.data.farmer);
                          setIsLoggedOut(false);
                          setIsAuthModalOpen(false);
                          setRole('farmer');
                        }
                      } finally {
                        setAuthLoading(false);
                      }
                    }}
                    className="w-full text-left p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>🚜 Farmer (Ramesh Kumar - Lucknow)</span>
                    <span className="text-[10px] text-emerald-700">1-Click Sign In ➔</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setAuthLoading(true);
                      try {
                        const res = await api.staffLogin({ email: 'officer.lucknow@kisansetu.gov.in', password: 'password123' });
                        if (res.success) {
                          setAuthToken(res.data.accessToken);
                          setCurrentUser({ ...res.data.staff, role: res.data.role });
                          setStaff(res.data.staff);
                          setIsLoggedOut(false);
                          setIsAuthModalOpen(false);
                          setRole('officer');
                        }
                      } finally {
                        setAuthLoading(false);
                      }
                    }}
                    className="w-full text-left p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>⚖️ Mandi Officer (Virender Singh - Lucknow APMC)</span>
                    <span className="text-[10px] text-amber-700">1-Click Sign In ➔</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setAuthLoading(true);
                      try {
                        const res = await api.staffLogin({ email: 'admin.lucknow@kisansetu.gov.in', password: 'password123' });
                        if (res.success) {
                          setAuthToken(res.data.accessToken);
                          setCurrentUser({ ...res.data.staff, role: res.data.role });
                          setStaff(res.data.staff);
                          setIsLoggedOut(false);
                          setIsAuthModalOpen(false);
                          setRole('admin');
                        }
                      } finally {
                        setAuthLoading(false);
                      }
                    }}
                    className="w-full text-left p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>🏛️ State / District Admin (Dr. Sunita Deshmukh - UP Mandi Parishad)</span>
                    <span className="text-[10px] text-red-700">1-Click Sign In ➔</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
