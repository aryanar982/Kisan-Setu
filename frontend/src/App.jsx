import React, { useState, useEffect } from 'react';
import {
  Wheat, User, LayoutGrid, BarChart3, Bell, Sparkles, Globe,
  LogOut, LogIn, CheckCircle2, ShieldCheck, Scale, Phone, Key,
  Radio, Clock, CheckCircle, ChevronDown, ChevronRight, Sun, Moon
} from 'lucide-react';
import { io } from 'socket.io-client';
import FarmerPortal from './components/FarmerPortal';
import OfficerDashboard from './components/OfficerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AiVoiceModal from './components/AiVoiceModal';
import NotificationDrawer from './components/NotificationDrawer';
import { api, setAuthToken, setCurrentUser } from './api';
import { translations } from './translations';

const FARMER_TOKEN_KEY = 'kisan_farmer_auth_token';
const OFFICER_TOKEN_KEY = 'kisan_officer_auth_token';
const ADMIN_TOKEN_KEY = 'kisan_admin_auth_token';
const FARMER_USER_KEY = 'kisan_farmer_user';
const OFFICER_USER_KEY = 'kisan_officer_user';
const ADMIN_USER_KEY = 'kisan_admin_user';
const ACTIVE_ROLE_KEY = 'kisan_active_role';

const DEMO_STAFF_EMAILS = {
  officer: 'officer.lucknow@kisansetu.gov.in',
  admin: 'admin.lucknow@kisansetu.gov.in',
  district_admin: 'district.lucknow@kisansetu.gov.in',
  state_admin: 'state.delhi@kisansetu.gov.in',
};

function getStaffTokenKey(targetRole) {
  if (targetRole === 'officer') return OFFICER_TOKEN_KEY;
  return ADMIN_TOKEN_KEY; // admin, district_admin, state_admin all use admin token
}

function getStaffUserKey(targetRole) {
  if (targetRole === 'officer') return OFFICER_USER_KEY;
  return ADMIN_USER_KEY; // admin, district_admin, state_admin all use admin user
}

function isUiRole(value) {
  return value === 'farmer' || value === 'officer' || value === 'admin' || value === 'district_admin' || value === 'state_admin';
}

function readStoredUser(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(key, user) {
  if (user) localStorage.setItem(key, JSON.stringify(user));
  else localStorage.removeItem(key);
}

function LoginRequired({ role, onOpenLogin }) {
  const roleLabel = role === 'officer' ? 'Procurement Officer' : 'Administrator';
  return (
    <div className="max-w-xl mx-auto py-12 sm:py-20">
      <div className="kisan-card p-8 sm:p-10 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-[#C98A2E]/15 flex items-center justify-center mx-auto text-[#C98A2E]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-[#142217]">{roleLabel} sign-in required</h2>
          <p className="text-sm text-[#142217]/60">
            Sign in with your authorized official account to continue to the {roleLabel} dashboard.
          </p>
        </div>
        <button
          onClick={onOpenLogin}
          className="btn-gold w-full justify-center py-3.5 text-sm font-extrabold shadow-lg"
        >
          <LogIn className="w-4 h-4" /> Sign in as {roleLabel}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState('farmer'); // 'farmer', 'officer', 'admin'
  const [language, setLanguage] = useState(() => localStorage.getItem('kisan_language') || 'en'); // 'hi', 'en', 'te'
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('kisan_dark_mode') === 'true');
  const [farmer, setFarmer] = useState(null);
  const [officer, setOfficer] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [activeFarmerTab, setActiveFarmerTab] = useState('dashboard');
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // Modals and Drawers
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('farmer_otp'); // 'farmer_otp', 'staff_login'
  const [selectedLoginRole, setSelectedLoginRole] = useState('farmer');

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
    document.documentElement.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('kisan_dark_mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const s = io(window.location.origin, { transports: ['websocket', 'polling'] });
    setSocket(s);

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

  const applyRoleSession = (targetRole, sessions = {}) => {
    const nextFarmer = sessions.farmer !== undefined ? sessions.farmer : farmer;
    const nextOfficer = sessions.officer !== undefined ? sessions.officer : officer;
    const nextAdmin = sessions.adminUser !== undefined ? sessions.adminUser : adminUser;

    setRole(targetRole);
    setSelectedLoginRole(targetRole);
    setAuthMode(targetRole === 'farmer' ? 'farmer_otp' : 'staff_login');
    if (targetRole !== 'farmer') {
      // Use officer email for officer role, admin email for all admin roles
      const emailKey = targetRole === 'officer' ? 'officer' : 'admin';
      setStaffEmail(DEMO_STAFF_EMAILS[emailKey]);
    }
    localStorage.setItem(ACTIVE_ROLE_KEY, targetRole);
    window.history.pushState({}, '', `/login?role=${targetRole}`);

    if (targetRole === 'farmer' && nextFarmer) {
      const token = localStorage.getItem(FARMER_TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        setCurrentUser({ ...nextFarmer, role: 'farmer' });
        setIsLoggedOut(false);
        return true;
      }
    }

    if (targetRole === 'officer' && nextOfficer) {
      const token = localStorage.getItem(OFFICER_TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        setCurrentUser({ ...nextOfficer, role: nextOfficer.role || 'centre_staff' });
        setIsLoggedOut(false);
        return true;
      }
    }

    if (targetRole === 'admin' && nextAdmin) {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        setCurrentUser({ ...nextAdmin, role: nextAdmin.role });
        setIsLoggedOut(false);
        return true;
      }
    }

    setAuthToken(null);
    setCurrentUser(null);
    setIsLoggedOut(true);
    setNotifications([]);
    return false;
  };

  useEffect(() => {
    const handleAuthExpired = () => handleLogout();
    window.addEventListener('kisan-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('kisan-auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    const storedFarmer = localStorage.getItem(FARMER_TOKEN_KEY) ? readStoredUser(FARMER_USER_KEY) : null;
    const storedOfficer = localStorage.getItem(OFFICER_TOKEN_KEY) ? readStoredUser(OFFICER_USER_KEY) : null;
    const storedAdmin = localStorage.getItem(ADMIN_TOKEN_KEY) ? readStoredUser(ADMIN_USER_KEY) : null;
    if (!storedFarmer) localStorage.removeItem(FARMER_USER_KEY);
    if (!storedOfficer) localStorage.removeItem(OFFICER_USER_KEY);
    if (!storedAdmin) localStorage.removeItem(ADMIN_USER_KEY);
    setFarmer(storedFarmer);
    setOfficer(storedOfficer);
    setAdminUser(storedAdmin);

    const roleParam = new URLSearchParams(window.location.search).get('role');
    const savedRole = localStorage.getItem(ACTIVE_ROLE_KEY);
    const initialRole = isUiRole(roleParam) ? roleParam : (isUiRole(savedRole) ? savedRole : 'farmer');

    const restored = applyRoleSession(initialRole, {
      farmer: storedFarmer,
      officer: storedOfficer,
      adminUser: storedAdmin,
    });

    if (restored) {
      loadNotifications();
      return;
    }

    if (window.location.pathname === '/login' && isUiRole(roleParam)) {
      setIsAuthModalOpen(true);
    }
  }, []);

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
      const res = await api.verifyOtp({ phone: phoneInput, otp: otpInput, role: selectedLoginRole });
      if (res.success) {
        localStorage.setItem(FARMER_TOKEN_KEY, res.data.accessToken);
        writeStoredUser(FARMER_USER_KEY, res.data.farmer);
        setFarmer(res.data.farmer);
        applyRoleSession('farmer', { farmer: res.data.farmer });
        setIsAuthModalOpen(false);
        setOtpSent(false);
        loadNotifications();
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
      const res = await api.staffLogin({ email: staffEmail, password: staffPassword, role: selectedLoginRole });
      if (res.success) {
        // Map backend roles to UI roles
        const roleMapping = {
          'centre_staff': 'officer',
          'admin': 'admin',
          'district_admin': 'admin',
          'state_admin': 'admin'
        };
        const uiRole = roleMapping[res.data.role] || 'admin';
        localStorage.setItem(getStaffTokenKey(uiRole), res.data.accessToken);
        writeStoredUser(getStaffUserKey(uiRole), res.data.staff);
        if (uiRole === 'officer') setOfficer(res.data.staff);
        else setAdminUser(res.data.staff);
        applyRoleSession(uiRole, uiRole === 'officer' ? { officer: res.data.staff } : { adminUser: res.data.staff });
        setIsAuthModalOpen(false);
        loadNotifications();
      }
    } catch (err) {
      alert(err.message || 'Staff login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSwitchRole = (targetRole) => {
    const restored = applyRoleSession(targetRole);
    if (restored) loadNotifications();
  };

  const selectProtectedRole = (targetRole) => {
    applyRoleSession(targetRole);
  };

  const openLoginForRole = (targetRole) => {
    applyRoleSession(targetRole);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    setIsLoggedOut(true);
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem(FARMER_TOKEN_KEY);
    localStorage.removeItem(OFFICER_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(FARMER_USER_KEY);
    localStorage.removeItem(OFFICER_USER_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    setFarmer(null);
    setOfficer(null);
    setAdminUser(null);
    setNotifications([]);
    setRole('farmer');
    setSelectedLoginRole('farmer');
    setAuthMode('farmer_otp');
    setStaffEmail(DEMO_STAFF_EMAILS.officer);
    setIsAuthModalOpen(false);
    window.history.pushState({}, '', '/login?role=farmer');
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
                onClick={() => farmer ? handleSwitchRole('farmer') : selectProtectedRole('farmer')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  role === 'farmer'
                    ? 'bg-gradient-to-r from-[#C98A2E] to-[#A56F20] text-white shadow-md shadow-[#C98A2E]/25'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4" /> {t.farmerRole}
              </button>
              <button
                onClick={() => officer ? handleSwitchRole('officer') : selectProtectedRole('officer')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  role === 'officer'
                    ? 'bg-gradient-to-r from-[#C98A2E] to-[#A56F20] text-white shadow-md shadow-[#C98A2E]/25'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Scale className="w-4 h-4" /> {t.officerRole}
              </button>
              <button
                onClick={() => adminUser ? handleSwitchRole('admin') : selectProtectedRole('admin')}
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
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    localStorage.setItem('kisan_language', e.target.value);
                  }}
                  className="bg-[#0D170F] border border-white/15 text-white text-xs rounded-xl pl-8 pr-3 py-2 outline-none cursor-pointer hover:border-[#C98A2E]/60 transition-colors font-medium"
                >
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="en">English</option>
                  <option value="te">తెలుగు (Telugu)</option>
                </select>
              </div>

              <button
                onClick={() => setDarkMode((enabled) => !enabled)}
                className="p-2.5 rounded-xl bg-[#0D170F] hover:bg-white/10 border border-white/15 transition-colors"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-[#EBB668]" /> : <Moon className="w-4 h-4 text-white/80" />}
              </button>

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
                const isAuthenticated = !isLoggedOut && Boolean(
                  (role === 'farmer' && farmer)
                  || (role === 'officer' && officer)
                  || (role === 'admin' && adminUser)
                );

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
                      name: adminUser?.name || 'Dr. Sunita Deshmukh',
                      sub: 'District Collector / Admin (Lucknow)',
                      avatarColor: 'from-[#BA3D2C] to-[#8C291B]',
                    };
                  }
                  if (role === 'officer') {
                    return {
                      name: officer?.name || 'Virender Singh',
                      sub: `Mandi Officer (${officer?.district || 'Lucknow'} APMC)`,
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
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-[#BA3D2C]/20 text-white/80 hover:text-[#BA3D2C] transition-colors text-[10px] font-bold"
                      title="Sign out"
                      aria-label="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign out</span>
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
            onClick={() => farmer ? handleSwitchRole('farmer') : selectProtectedRole('farmer')}
            className={`flex-1 py-3 font-bold text-center flex items-center justify-center gap-1.5 ${
              role === 'farmer' ? 'text-[#EBB668] bg-[#142217]' : 'text-white/60'
            }`}
          >
            <User className="w-3.5 h-3.5" /> {t.farmerRole}
          </button>
          <button
            onClick={() => officer ? handleSwitchRole('officer') : selectProtectedRole('officer')}
            className={`flex-1 py-3 font-bold text-center flex items-center justify-center gap-1.5 ${
              role === 'officer' ? 'text-[#EBB668] bg-[#142217]' : 'text-white/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> {t.officerRole}
          </button>
          <button
            onClick={() => adminUser ? handleSwitchRole('admin') : selectProtectedRole('admin')}
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
            onOpenAuthModal={() => {
              setAuthMode('farmer_otp');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {role === 'officer' && (officer ? (
          <OfficerDashboard staff={officer} socket={socket} />
        ) : (
          <LoginRequired role="officer" onOpenLogin={() => openLoginForRole('officer')} />
        ))}

        {role === 'admin' && (adminUser ? (
          <AdminDashboard socket={socket} />
        ) : (
          <LoginRequired role="admin" onOpenLogin={() => openLoginForRole('admin')} />
        ))}
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
                <span className="text-white font-bold text-sm block">Kisan Setu · Uttar Pradesh Mandi Network</span>
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
              Secure digital procurement coordination for farmers, mandi officers, and administrators.
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
          applyRoleSession('farmer');
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
                {selectedLoginRole === 'farmer' ? 'Farmer Login' : selectedLoginRole === 'officer' ? 'Procurement Officer Login' : 'Administrator Login'}
              </h3>
              <p className="text-xs text-white/70 mt-1">
                {selectedLoginRole === 'farmer' ? 'Login with your registered mobile number and OTP.' : 'Restricted to authorized procurement officials.'}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-bold text-[#142217]">Select your role:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'farmer', label: '👨‍🌾 Farmer' },
                    { id: 'officer', label: '👮 Procurement Officer' },
                    { id: 'admin', label: '🛡 Administrator' },
                  ].map((loginRole) => {
                    const selected = loginRole.id === selectedLoginRole;
                    return (
                      <button
                        key={loginRole.id}
                        type="button"
                        onClick={() => openLoginForRole(loginRole.id)}
                        className={`p-2 rounded-xl border text-[11px] font-bold leading-tight transition-colors ${
                          selected
                            ? 'bg-[#142217] text-white border-[#142217]'
                            : 'bg-[#F7F5EE] text-[#142217]/70 border-[#DDD8CB] hover:border-[#C98A2E]'
                        }`}
                      >
                        {loginRole.label}
                      </button>
                    );
                  })}
                </div>
              </div>

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
                      onClick={() => openLoginForRole('officer')}
                      className="text-[#C98A2E] font-bold hover:underline"
                    >
                      Are you a Procurement Officer or Administrator? Sign in here
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
                    {authLoading
                      ? 'Authenticating...'
                      : `Sign In as ${selectedLoginRole === 'admin' ? 'Administrator' : 'Procurement Officer'}`}
                  </button>

                  <div className="pt-3 border-t border-[#DDD8CB] text-center">
                    <button
                      type="button"
                      onClick={() => openLoginForRole('farmer')}
                      className="text-[#C98A2E] font-bold hover:underline"
                    >
                      Are you a farmer? Login via Mobile OTP
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
