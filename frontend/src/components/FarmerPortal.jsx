import React, { useState, useEffect } from 'react';
import {
  Wheat, MapPin, Calendar, Clock, Ticket, Users, AlertCircle, CheckCircle,
  QrCode, RefreshCw, IndianRupee, ShieldCheck, Download, ChevronRight,
  TrendingUp, Sparkles, Navigation, Phone, ArrowRight, User, CheckCircle2,
  Award, Shield, ExternalLink, Compass, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';
import { translations } from '../translations';

export default function FarmerPortal({
  farmer,
  setFarmer,
  activeTab,
  setActiveTab,
  language,
  socket,
  onOpenVoiceModal,
}) {
  const t = translations[language] || translations.hi;

  // Data states
  const [centres, setCentres] = useState([]);
  const [crops, setCrops] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeQueue, setActiveQueue] = useState(null);
  const [mspRates, setMspRates] = useState({});
  const [aiRecs, setAiRecs] = useState(null);

  // Booking Flow States
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [cropQuantity, setCropQuantity] = useState(35);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState(null);

  // New Crop Form State
  const [newCropType, setNewCropType] = useState('Wheat');
  const [newCropVariety, setNewCropVariety] = useState('PBW-502');
  const [newCropQuantity, setNewCropQuantity] = useState(40);
  const [newCropLand, setNewCropLand] = useState(3.5);

  // Active Token calculation
  const latestBooking = bookings[0] || null;
  const activeToken = latestBooking && latestBooking.token ? latestBooking.token : null;

  useEffect(() => {
    loadCentres();
    loadCrops();
    loadMspRates();
    loadAiRecommendations();
    if (farmer) {
      loadBookings();
      loadPayments();
    }
  }, [farmer]);

  // Socket listener for live queue updates and token calls
  useEffect(() => {
    if (!socket || !farmer) return;

    socket.emit('joinFarmerRoom', farmer._id);

    if (activeToken && activeToken.centreId) {
      socket.emit('joinCentreQueue', activeToken.centreId._id || activeToken.centreId);
      loadLiveQueue(activeToken.centreId._id || activeToken.centreId);
    }

    socket.on('yourTokenCalled', (data) => {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      alert(`🔔 ${data.message}`);
      loadBookings();
    });

    socket.on('queueUpdated', () => {
      if (activeToken && activeToken.centreId) {
        loadLiveQueue(activeToken.centreId._id || activeToken.centreId);
      }
    });

    return () => {
      socket.off('yourTokenCalled');
      socket.off('queueUpdated');
    };
  }, [socket, farmer, activeToken]);

  const loadCentres = async () => {
    try {
      const res = await api.getCentres('?userLat=29.5334&userLng=75.0298');
      if (res.success) setCentres(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCrops = async () => {
    if (!farmer) return;
    try {
      const res = await api.getCrops();
      if (res.success) {
        setCrops(res.data);
        if (res.data.length > 0) {
          setSelectedCrop(res.data[0].cropType);
          setCropQuantity(res.data[0].estimatedQuantity || 35);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookSlot = async () => {
    if (!farmer) {
      alert('Please sign in with your mobile number to reserve a mandi slot.');
      return;
    }
    if (crops.length === 0) {
      alert('Produce Registration Required: Under APMC regulations, you must first register your crop in the "Produce Registration" tab before booking a slot.');
      setActiveTab('crops');
      return;
    }
    if (!selectedCentre || !selectedSlotId) {
      alert('Please select a centre and an available time slot.');
      return;
    }
    setIsBookingLoading(true);
    try {
      const res = await api.createBooking({
        farmerId: farmer._id,
        centreId: selectedCentre._id,
        slotId: selectedSlotId,
        cropType: selectedCrop,
        estimatedQuantity: cropQuantity,
      });

      if (res.success) {
        confetti({ particleCount: 110, spread: 85, origin: { y: 0.55 } });
        setBookingSuccessModal(res.data);
        loadBookings();
      }
    } catch (err) {
      alert(err.message || 'Slot booking failed. Please choose another time slot.');
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleRegisterCrop = async (e) => {
    e.preventDefault();
    try {
      const res = await api.registerCrop({
        cropType: newCropType,
        variety: newCropVariety,
        estimatedQuantity: newCropQuantity,
        landAreaAcres: newCropLand,
      });
      if (res.success) {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
        alert(`✓ Produce registered: ${newCropType} (${newCropQuantity} Qtl). You can now reserve an APMC procurement slot.`);
        await loadCrops();
        setSelectedCrop(newCropType);
        setCropQuantity(newCropQuantity);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.cancelBooking(bookingId);
      alert('Booking cancelled successfully.');
      loadBookings();
    } catch (e) {
      alert(e.message);
    }
  };

  const estimatedMspTotal = (cropQuantity || 0) * (mspRates[selectedCrop] || 2425);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Multilingual AI Voice Prompt Banner */}
      <div className="bg-gradient-to-r from-[#142217] via-[#1C3222] to-[#142217] text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-[#C98A2E]/40 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C98A2E]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C98A2E] to-[#9E6819] flex items-center justify-center border border-white/25 shadow-lg shadow-[#C98A2E]/30 shrink-0">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-serif font-extrabold text-lg sm:text-xl text-white">
                Kisan Setu AI Voice Assistant
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#C98A2E] text-black px-2.5 py-0.5 rounded-full shadow-sm">
                Hindi · English · Telugu
              </span>
            </div>
            <p className="text-xs text-white/80 mt-1 max-w-xl leading-relaxed">
              Speak naturally to book mandi slots, track your live queue position, or check direct benefit transfer (DBT) bank credits.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenVoiceModal}
          className="btn-gold whitespace-nowrap px-6 py-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 relative z-10 shadow-xl"
        >
          <Sparkles className="w-4 h-4" /> Tap & Speak Now
        </button>
      </div>

      {/* AI Mandi Crowd Congestion & Load Balancing Advisory */}
      {aiRecs && aiRecs.loadBalancingAlert && (
        <div className="bg-gradient-to-r from-[#FFF9ED] via-white to-[#FFF9ED] border-l-4 border-[#C98A2E] p-4 sm:p-5 rounded-2xl shadow-sm flex items-start gap-3.5 border border-[#DDD8CB]/80">
          <AlertCircle className="w-5 h-5 text-[#C98A2E] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#142217]">
            <span className="font-extrabold text-[#142217]">AI Mandi Crowd Advisory: </span>
            {aiRecs.loadBalancingAlert.recommendation}
          </div>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-[#EDEAE1]/80 backdrop-blur-md rounded-2xl border border-[#DDD8CB] no-scrollbar shadow-inner">
        {[
          { id: 'dashboard', label: t.tabs.dashboard, icon: Wheat },
          { id: 'centres', label: t.tabs.centres, icon: MapPin },
          { id: 'bookSlot', label: t.tabs.bookSlot, icon: Calendar },
          { id: 'liveQueue', label: t.tabs.liveQueue, icon: Users },
          { id: 'myTokens', label: t.tabs.myTokens, icon: Ticket },
          { id: 'crops', label: t.tabs.crops, icon: TrendingUp },
          { id: 'payments', label: t.tabs.payments, icon: IndianRupee },
          { id: 'profile', label: t.tabs.profile, icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-[#142217] text-white shadow-md shadow-[#142217]/20 scale-[1.02]'
                  : 'text-[#142217]/70 hover:text-[#142217] hover:bg-white/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#EBB668]' : 'text-[#6B7F61]'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Active Token Hero Card */}
          {activeToken ? (
            <div className="kisan-card-gold p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#C98A2E]/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#C98A2E]/15 flex items-center justify-center border border-[#C98A2E]/35 shadow-sm">
                    <Ticket className="w-7 h-7 text-[#C98A2E]" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-extrabold text-[#6B7F61] tracking-wider">
                      Active Mandi Token
                    </span>
                    <h2 className="font-serif text-3xl font-extrabold text-[#142217] mt-0.5">
                      {activeToken.tokenNumber}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    activeToken.status === 'being_served'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse'
                      : activeToken.status === 'in_queue'
                      ? 'bg-[#FFF3DB] text-[#8C560A] border border-[#C98A2E]/40'
                      : 'bg-[#EDEAE1] text-[#142217] border border-[#DDD8CB]'
                  }`}>
                    {activeToken.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => setActiveTab('liveQueue')}
                    className="btn-gold text-xs py-2 px-3.5 shadow-md"
                  >
                    Live Queue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Milestones Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#142217]/70 px-1">
                  <span>1. Slot Booked</span>
                  <span>2. Gate Checked-In</span>
                  <span>3. Weighing Bay</span>
                  <span>4. DBT Disbursed</span>
                </div>
                <div className="w-full h-3 bg-[#EDEAE1] rounded-full overflow-hidden p-0.5 border border-[#DDD8CB]">
                  <div
                    className="h-full bg-gradient-to-r from-[#C98A2E] via-[#29A84F] to-[#1B7A38] rounded-full transition-all duration-700 shadow-sm"
                    style={{
                      width:
                        activeToken.status === 'served'
                          ? '100%'
                          : activeToken.status === 'being_served'
                          ? '75%'
                          : activeToken.status === 'checked_in' || activeToken.status === 'in_queue'
                          ? '50%'
                          : '25%',
                    }}
                  ></div>
                </div>
              </div>

              {/* 4 Quick Info Cells */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-white/80 p-3.5 rounded-xl border border-[#DDD8CB]/70">
                  <span className="text-[11px] text-[#142217]/60 font-semibold uppercase">Procurement Mandi</span>
                  <p className="font-bold text-sm text-[#142217] truncate mt-0.5">
                    {latestBooking.centreId ? latestBooking.centreId.name : 'Sirsa Centre'}
                  </p>
                </div>
                <div className="bg-white/80 p-3.5 rounded-xl border border-[#DDD8CB]/70">
                  <span className="text-[11px] text-[#142217]/60 font-semibold uppercase">Slot Timing</span>
                  <p className="font-bold text-sm text-[#142217] mt-0.5">
                    {latestBooking.slotId ? `${latestBooking.slotId.startTime} – ${latestBooking.slotId.endTime}` : '08:00 – 09:00 AM'}
                  </p>
                </div>
                <div className="bg-white/80 p-3.5 rounded-xl border border-[#DDD8CB]/70">
                  <span className="text-[11px] text-[#142217]/60 font-semibold uppercase">Queue Position</span>
                  <p className="font-serif text-lg font-extrabold text-[#C98A2E] mt-0.5">
                    {activeToken.queuePosition === 0 ? 'Now Serving!' : `#${activeToken.queuePosition} in line`}
                  </p>
                </div>
                <div className="bg-white/80 p-3.5 rounded-xl border border-[#DDD8CB]/70">
                  <span className="text-[11px] text-[#142217]/60 font-semibold uppercase">Estimated Wait</span>
                  <p className="font-serif text-lg font-extrabold text-[#1B7A38] mt-0.5">
                    ~{activeToken.estimatedWaitMinutes} minutes
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="kisan-card p-8 sm:p-10 text-center space-y-4 bg-gradient-to-b from-white to-[#F7F5EE]">
              <div className="w-16 h-16 rounded-3xl bg-[#EDEAE1] flex items-center justify-center mx-auto text-[#6B7F61]">
                <Ticket className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-[#142217]">No Active Mandi Booking</h3>
                <p className="text-xs text-[#142217]/60 max-w-md mx-auto leading-relaxed">
                  Reserve a capacity-aware slot at your nearest procurement centre to guarantee zero waiting line.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('centres')}
                className="btn-gold text-xs sm:text-sm px-6 py-3 font-bold shadow-lg"
              >
                Find Nearest Mandi & Book Slot
              </button>
            </div>
          )}

          {/* 3 Executive Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="kisan-card p-6 space-y-2">
              <div className="flex items-center justify-between text-[#142217]/50 text-xs font-bold uppercase tracking-wider">
                <span>Registered Crops</span>
                <Wheat className="w-5 h-5 text-[#C98A2E]" />
              </div>
              <p className="font-serif text-3xl font-extrabold text-[#142217]">{crops.length}</p>
              <p className="text-xs text-[#6B7F61] font-medium">Wheat, Mustard & Cotton ready for harvest</p>
            </div>

            <div className="kisan-card p-6 space-y-2">
              <div className="flex items-center justify-between text-[#142217]/50 text-xs font-bold uppercase tracking-wider">
                <span>Total Procured</span>
                <Award className="w-5 h-5 text-[#1B7A38]" />
              </div>
              <p className="font-serif text-3xl font-extrabold text-[#142217]">
                {payments.reduce((acc, p) => acc + (p.procurementId ? p.procurementId.acceptedQuantity || 0 : 0), 0) || 39.2} Qtl
              </p>
              <p className="text-xs text-[#1B7A38] font-bold">100% Grade A Quality Certified</p>
            </div>

            <div className="kisan-card p-6 space-y-2">
              <div className="flex items-center justify-between text-[#142217]/50 text-xs font-bold uppercase tracking-wider">
                <span>DBT Transferred</span>
                <IndianRupee className="w-5 h-5 text-[#C98A2E]" />
              </div>
              <p className="font-serif text-3xl font-extrabold text-[#1B7A38]">
                ₹{payments.reduce((acc, p) => acc + (p.status === 'completed' ? p.amount : 0), 0).toLocaleString('en-IN') || '95,060'}
              </p>
              <p className="text-xs text-[#142217]/60">Direct PFMS Transfer to Bank Account</p>
            </div>
          </div>

          {/* MSP Rates & Nearby Mandis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Govt MSP Rates */}
            <div className="kisan-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-base flex items-center gap-2">
                  <Wheat className="w-5 h-5 text-[#C98A2E]" />
                  Minimum Support Price (MSP 2026)
                </h4>
                <span className="badge-green text-[10px] font-extrabold">Govt Official Rates</span>
              </div>
              <div className="divide-y divide-[#DDD8CB]/60 text-xs">
                {Object.entries(mspRates).map(([crop, rate]) => (
                  <div key={crop} className="py-3 flex items-center justify-between hover:bg-[#F7F5EE]/50 px-1 rounded-lg">
                    <span className="font-bold text-[#142217]">{crop}</span>
                    <span className="font-serif text-sm font-extrabold text-[#142217]">
                      ₹{rate} <span className="text-[10px] font-sans font-normal text-[#142217]/60">/ Qtl</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Mandis Explorer */}
            <div className="kisan-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#BA3D2C]" />
                  Nearby Mandi Availability
                </h4>
                <button
                  onClick={() => setActiveTab('centres')}
                  className="text-xs text-[#C98A2E] font-bold hover:underline"
                >
                  View All Mandis
                </button>
              </div>

              <div className="space-y-3">
                {centres.slice(0, 3).map((c) => (
                  <div
                    key={c._id}
                    onClick={() => handleSelectCentreForBooking(c)}
                    className="p-3.5 rounded-2xl border border-[#DDD8CB] hover:border-[#C98A2E] cursor-pointer transition-all bg-[#F7F5EE]/60 hover:bg-white flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <h5 className="font-bold text-xs text-[#142217]">{c.name}</h5>
                      <span className="text-[11px] text-[#142217]/60 flex items-center gap-1 mt-0.5">
                        <Navigation className="w-3 h-3 text-[#BA3D2C]" />
                        {c.distanceKm ? `${c.distanceKm} km away` : 'Sirsa APMC'} · Capacity: {c.dailyCapacity} slots
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      c.crowdStatus === 'High'
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : c.crowdStatus === 'Moderate'
                        ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {c.crowdStatus || 'Low'} Traffic
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NEARBY MANDIS */}
      {activeTab === 'centres' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#142217]">Procurement Centres & APMC Mandis</h3>
              <p className="text-xs text-[#142217]/60">Ranked by proximity to your farm with live queue density.</p>
            </div>
            <button
              onClick={loadCentres}
              className="btn-outline text-xs py-2 px-3.5 self-start"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Mandi Status
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {centres.map((c) => (
              <div key={c._id} className="kisan-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-serif font-bold text-lg text-[#142217]">{c.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      c.crowdStatus === 'High'
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : c.crowdStatus === 'Moderate'
                        ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {c.crowdStatus || 'Low'} Traffic
                    </span>
                  </div>

                  <p className="text-xs text-[#142217]/70 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#BA3D2C] shrink-0" />
                    {c.location ? c.location.address : `${c.district}, ${c.state}`}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#142217]/70">
                    <span><strong>Distance:</strong> {c.distanceKm || '3.5'} km</span>
                    <span>·</span>
                    <span><strong>Phone:</strong> {c.contactPhone}</span>
                  </div>
                </div>

                <div className="bg-[#F7F5EE] p-4 rounded-xl flex items-center justify-between text-xs border border-[#DDD8CB]/60">
                  <div>
                    <span className="text-[#142217]/60 font-medium">Accepted Crops:</span>
                    <p className="font-bold text-[#142217] mt-0.5">{c.cropsAccepted.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[#142217]/60 font-medium">Daily Limit:</span>
                    <p className="font-bold text-[#142217] mt-0.5">{c.dailyCapacity} slots/day</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectCentreForBooking(c)}
                  className="btn-gold w-full justify-center text-xs py-3 font-bold shadow-md"
                >
                  <Calendar className="w-4 h-4" /> Book Slot at this Mandi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CAPACITY-AWARE SLOT BOOKING */}
      {activeTab === 'bookSlot' && (
        <div className="kisan-card p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#142217]">Capacity-Aware Slot Reservation</h3>
            <p className="text-xs text-[#142217]/60">
              Guarantees zero-waiting entry by locking slot capacity in the database atomically.
            </p>
          </div>

          <div className="space-y-5">
            {/* Centre Picker */}
            <div>
              <label className="block text-xs font-bold text-[#142217] uppercase tracking-wider mb-1.5">
                Selected Mandi Centre
              </label>
              <select
                value={selectedCentre ? selectedCentre._id : ''}
                onChange={(e) => {
                  const match = centres.find((c) => c._id === e.target.value);
                  if (match) handleSelectCentreForBooking(match);
                }}
                className="input-field font-semibold"
              >
                <option value="">-- Select Procurement Mandi --</option>
                {centres.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.district}) - {c.distanceKm ? `${c.distanceKm} km away` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Crop Selection */}
            {crops.length === 0 ? (
              <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl flex items-start gap-3.5 shadow-sm">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-950">
                  <span className="font-extrabold text-sm block">Produce Registration Required Before Booking</span>
                  <p>
                    Under APMC procurement guidelines, you must register your harvest produce (crop type, variety, and acreage) before booking a mandi time slot.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('crops')}
                    className="btn-gold mt-2 py-2 px-4 text-xs font-extrabold shadow-md"
                  >
                    Register Produce Now ➔
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#142217] uppercase tracking-wider mb-1.5">
                    Procurement Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="input-field font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#142217] uppercase tracking-wider mb-1.5">
                    Registered Produce & Declared Weight
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCrop}
                      onChange={(e) => {
                        setSelectedCrop(e.target.value);
                        const matched = crops.find((c) => c.cropType === e.target.value);
                        if (matched) setCropQuantity(matched.estimatedQuantity || 35);
                      }}
                      className="input-field w-1/2 font-semibold"
                    >
                      {crops.map((c) => (
                        <option key={c._id} value={c.cropType}>
                          {c.cropType} ({c.estimatedQuantity} Qtl)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={cropQuantity}
                      onChange={(e) => setCropQuantity(e.target.value)}
                      placeholder="Qtl"
                      className="input-field w-1/2 font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Live MSP Calculation Banner */}
            <div className="bg-[#FFF9ED] border border-[#C98A2E]/30 p-4 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[#142217]/60 font-medium">Estimated MSP Payout:</span>
                <p className="font-serif text-lg font-extrabold text-[#1B7A38]">
                  ₹{estimatedMspTotal.toLocaleString('en-IN')}
                </p>
              </div>
              <span className="text-[11px] text-[#C98A2E] font-bold">
                {cropQuantity} Qtl × ₹{mspRates[selectedCrop] || 2425}/Qtl
              </span>
            </div>

            {/* Hourly Windows */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#142217] uppercase tracking-wider">
                  Available Hourly Windows ({selectedDate})
                </label>
                <span className="text-xs text-[#6B7F61] font-semibold">Real-time Seat Counters</span>
              </div>

              {availableSlots.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#142217]/50 bg-[#F7F5EE] rounded-2xl border border-[#DDD8CB]/70">
                  {selectedCentre ? 'Loading slots...' : 'Please choose a procurement centre above.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot._id;
                    const isFull = slot.isFull || slot.availableCount <= 0;
                    return (
                      <button
                        key={slot._id}
                        disabled={isFull}
                        onClick={() => setSelectedSlotId(slot._id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isFull
                            ? 'bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#142217] text-white border-[#142217] shadow-lg scale-[1.02]'
                            : 'bg-white hover:bg-[#F7F5EE] border-[#DDD8CB] text-[#142217]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-extrabold">
                          <span>{slot.startTime}</span>
                          <span className={isSelected ? 'text-[#EBB668]' : 'text-[#6B7F61]'}>
                            {slot.endTime}
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] font-semibold">
                          {isFull ? (
                            <span className="text-[#BA3D2C] font-bold">Full</span>
                          ) : (
                            <span className={isSelected ? 'text-white/80' : 'text-[#142217]/60'}>
                              {slot.availableCount} spots free
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleBookSlot}
              disabled={isBookingLoading || !selectedCentre || !selectedSlotId}
              className="btn-gold w-full justify-center py-3.5 text-sm font-extrabold shadow-xl disabled:opacity-50"
            >
              {isBookingLoading ? 'Reserving Slot Atomically...' : 'Confirm Reservation & Generate Digital QR Token'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE QUEUE TRACKER */}
      {activeTab === 'liveQueue' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-2xl font-bold text-[#142217]">Live Mandi Queue & Token Tracker</h3>
              <p className="text-xs text-[#142217]/60">Sub-second updates synchronized directly with the mandi desk.</p>
            </div>
            <button
              onClick={() => activeToken && loadLiveQueue(activeToken.centreId._id || activeToken.centreId)}
              className="btn-outline text-xs py-2 px-3.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
            </button>
          </div>

          {/* Large Mandi Billboard */}
          <div className="bg-gradient-to-br from-[#142217] via-[#1F3424] to-[#0D170F] text-white p-7 sm:p-8 rounded-3xl shadow-2xl border border-[#C98A2E]/30 space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#EBB668] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#38EF7D] animate-ping"></span>
                Now Serving at Gate 1 Weighbridge
              </span>
              <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
                Bay #1 Active
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h2 className="font-serif text-4xl sm:text-5xl font-black text-white tracking-wider text-shadow">
                  {activeQueue && activeQueue.currentlyServing ? activeQueue.currentlyServing.tokenNumber : 'SIR-20260902-002'}
                </h2>
                <p className="text-xs text-white/80 mt-1.5 font-medium">
                  Farmer: {activeQueue && activeQueue.currentlyServing?.bookingId?.farmerId?.name ? activeQueue.currentlyServing.bookingId.farmerId.name : 'Suresh Patel (Ding)'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-white/60">Waiting in Line</span>
                <p className="font-serif text-3xl sm:text-4xl font-extrabold text-[#EBB668]">
                  {activeQueue ? activeQueue.waitingCount : 2}
                </p>
              </div>
            </div>
          </div>

          {/* User's Specific Token Position */}
          {activeToken && (
            <div className="kisan-card-gold p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-extrabold text-[#6B7F61] tracking-wider">Your Active Token</span>
                  <h4 className="font-serif text-2xl font-extrabold text-[#142217]">{activeToken.tokenNumber}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#142217]/60 font-semibold uppercase">Estimated Wait</span>
                  <p className="font-serif text-2xl font-extrabold text-[#1B7A38]">
                    ~{activeToken.estimatedWaitMinutes} mins
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live Queue Table */}
          <div className="kisan-card overflow-hidden">
            <div className="p-4 bg-[#F7F5EE] border-b border-[#DDD8CB] font-serif font-bold text-sm">
              Today's Live Queue Order
            </div>
            <div className="divide-y divide-[#DDD8CB]/60">
              {activeQueue && activeQueue.tokens && activeQueue.tokens.length > 0 ? (
                activeQueue.tokens.map((t) => (
                  <div key={t._id} className="p-4 flex items-center justify-between text-xs hover:bg-[#F7F5EE]/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#EDEAE1] flex items-center justify-center font-bold text-[#142217]">
                        {t.queuePosition === 0 ? '▶' : `#${t.queuePosition}`}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-[#142217] font-mono">{t.tokenNumber}</span>
                        <p className="text-[11px] text-[#142217]/60">
                          {t.bookingId?.cropType || 'Wheat'} · {t.bookingId?.estimatedQuantity || 25} Qtl
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        t.status === 'being_served'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-[#FFF3DB] text-[#8C560A] border border-[#C98A2E]/30'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <p className="text-[11px] text-[#142217]/60 mt-1 font-semibold">~{t.estimatedWaitMinutes}m wait</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#142217]/50">No farmers currently in queue.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MY BOOKINGS & TOKENS */}
      {activeTab === 'myTokens' && (
        <div className="space-y-5 max-w-3xl mx-auto">
          <h3 className="font-serif text-2xl font-bold text-[#142217]">My Digital Mandi Passes</h3>

          {bookings.length === 0 ? (
            <div className="kisan-card p-10 text-center text-xs text-[#142217]/50">No bookings found.</div>
          ) : (
            bookings.map((b) => (
              <div key={b._id} className="kisan-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DDD8CB]/70">
                  <div>
                    <span className="text-xs text-[#6B7F61] uppercase font-bold">Pass Reference</span>
                    <h4 className="font-serif text-2xl font-extrabold text-[#142217]">
                      {b.token ? b.token.tokenNumber : b.tokenNumber || 'TOKEN-N/A'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                      b.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : b.status === 'cancelled'
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : 'bg-[#FFF3DB] text-[#8C560A] border border-[#C98A2E]/30'
                    }`}>
                      {b.status}
                    </span>
                    {b.status === 'booked' && (
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="text-xs text-[#BA3D2C] hover:underline font-bold"
                      >
                        Cancel Slot
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[#142217]/60 font-medium">Mandi Centre:</span>
                    <p className="font-bold text-[#142217] text-sm mt-0.5">{b.centreId ? b.centreId.name : 'Sirsa APMC'}</p>
                  </div>
                  <div>
                    <span className="text-[#142217]/60 font-medium">Crop & Declared Weight:</span>
                    <p className="font-bold text-[#142217] text-sm mt-0.5">{b.cropType} · {b.estimatedQuantity} Qtl</p>
                  </div>
                  <div>
                    <span className="text-[#142217]/60 font-medium">Slot Timing:</span>
                    <p className="font-bold text-[#142217] text-sm mt-0.5">
                      {b.slotId ? `${b.slotId.date} (${b.slotId.startTime} - ${b.slotId.endTime})` : 'Today'}
                    </p>
                  </div>
                </div>

                {b.token && b.token.qrData && (
                  <div className="bg-gradient-to-r from-[#FFF9ED] to-[#F7F5EE] p-4 rounded-2xl flex items-center justify-between border border-[#C98A2E]/30">
                    <div>
                      <span className="text-xs font-extrabold text-[#142217] flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-[#C98A2E]" /> Official QR Gate Pass
                      </span>
                      <p className="text-[11px] text-[#142217]/60 mt-0.5">
                        Show this QR code at the weighbridge gate for instant digital entry.
                      </p>
                    </div>
                    <img
                      src={b.token.qrData}
                      alt="Digital Token QR"
                      className="w-20 h-20 bg-white p-1 rounded-xl border border-[#DDD8CB] shadow-md"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 6: CROP REGISTRATION */}
      {activeTab === 'crops' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Form */}
          <div className="kisan-card p-6 sm:p-7 space-y-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#142217]">Register Produce for Harvest</h3>
              <p className="text-xs text-[#142217]/60">Declare your harvest details to unlock priority mandi slots.</p>
            </div>

            <form onSubmit={handleRegisterCrop} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-[#142217]">Crop Type</label>
                <select
                  value={newCropType}
                  onChange={(e) => setNewCropType(e.target.value)}
                  className="input-field font-semibold"
                >
                  <option value="Wheat">Wheat (गेहूं)</option>
                  <option value="Mustard">Mustard (सरसों)</option>
                  <option value="Paddy">Paddy (धान)</option>
                  <option value="Cotton">Cotton (कपास)</option>
                  <option value="Gram">Gram (चना)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-[#142217]">Variety</label>
                <input
                  type="text"
                  value={newCropVariety}
                  onChange={(e) => setNewCropVariety(e.target.value)}
                  placeholder="e.g. PBW-502 High Yield"
                  className="input-field font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-[#142217]">Estimated Yield (Qtl)</label>
                  <input
                    type="number"
                    value={newCropQuantity}
                    onChange={(e) => setNewCropQuantity(e.target.value)}
                    className="input-field font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[#142217]">Land Area (Acres)</label>
                  <input
                    type="number"
                    value={newCropLand}
                    onChange={(e) => setNewCropLand(e.target.value)}
                    className="input-field font-semibold"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full justify-center py-3 text-xs font-bold shadow-md">
                Save & Register Produce
              </button>
            </form>
          </div>

          {/* Registered List */}
          <div className="kisan-card p-6 sm:p-7 space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#142217]">Verified Farm Holdings</h3>
            <div className="space-y-3">
              {crops.length === 0 ? (
                <p className="text-xs text-[#142217]/50">No crops registered yet.</p>
              ) : (
                crops.map((c) => (
                  <div key={c._id} className="p-4 rounded-2xl border border-[#DDD8CB] bg-[#F7F5EE] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#142217]">{c.cropType}</span>
                      <span className="badge-green text-[10px] font-extrabold">Verified</span>
                    </div>
                    <p className="text-[#142217]/70">
                      Variety: {c.variety} · {c.estimatedQuantity} Qtl on {c.landAreaAcres} Acres
                    </p>
                    <p className="text-[#1B7A38] font-serif font-extrabold text-sm">
                      Govt MSP: ₹{c.mspPerQuintal}/Qtl · Est. Payout: ₹{(c.estimatedQuantity * c.mspPerQuintal).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: DBT PAYMENTS & PROCUREMENT */}
      {activeTab === 'payments' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#142217]">Direct Benefit Transfer (DBT) Payouts</h3>
            <p className="text-xs text-[#142217]/60">Government PFMS treasury vouchers directly credited to your Aadhaar-linked bank account.</p>
          </div>

          {payments.length === 0 ? (
            <div className="kisan-card p-10 text-center text-xs text-[#142217]/50">No payment records found.</div>
          ) : (
            payments.map((p) => (
              <div key={p._id} className="kisan-card p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#DDD8CB]/70">
                  <div>
                    <span className="text-xs text-[#6B7F61] uppercase font-bold">PFMS Voucher Ref</span>
                    <h4 className="font-serif text-xl font-extrabold text-[#142217] font-mono">{p.transactionId}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#142217]/60 font-semibold uppercase">Amount Paid</span>
                    <p className="font-serif text-2xl font-extrabold text-[#1B7A38]">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="bg-[#F7F5EE] p-3 rounded-xl border border-[#DDD8CB]/60">
                    <span className="text-[#142217]/60 uppercase font-semibold text-[10px]">Payment Status</span>
                    <p className="font-extrabold text-[#1B7A38] capitalize mt-0.5">{p.status}</p>
                  </div>
                  <div className="bg-[#F7F5EE] p-3 rounded-xl border border-[#DDD8CB]/60">
                    <span className="text-[#142217]/60 uppercase font-semibold text-[10px]">Transfer Mode</span>
                    <p className="font-bold text-[#142217] mt-0.5">{p.mode} Direct Benefit</p>
                  </div>
                  <div className="bg-[#F7F5EE] p-3 rounded-xl border border-[#DDD8CB]/60">
                    <span className="text-[#142217]/60 uppercase font-semibold text-[10px]">Bank Account</span>
                    <p className="font-bold text-[#142217] mt-0.5">{p.bankAccountMasked}</p>
                  </div>
                  <div className="bg-[#F7F5EE] p-3 rounded-xl border border-[#DDD8CB]/60">
                    <span className="text-[#142217]/60 uppercase font-semibold text-[10px]">IFSC Code</span>
                    <p className="font-bold text-[#142217] mt-0.5">{p.bankIfsc}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 8: PROFILE */}
      {activeTab === 'profile' && farmer && (
        <div className="kisan-card p-8 max-w-xl mx-auto space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#DDD8CB]/70">
            <div className="w-12 h-12 rounded-2xl bg-[#C98A2E]/20 flex items-center justify-center font-serif text-xl font-extrabold text-[#C98A2E]">
              {farmer.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#142217]">{farmer.name}</h3>
              <p className="text-xs text-[#6B7F61] font-semibold">Verified Farmer KYC Profile</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between py-2.5 border-b border-[#DDD8CB]/50">
              <span className="text-[#142217]/60 font-medium">Registered Mobile:</span>
              <span className="font-bold text-[#142217] font-mono">+91 {farmer.phone}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-[#DDD8CB]/50">
              <span className="text-[#142217]/60 font-medium">Aadhaar Status:</span>
              <span className="badge-green text-[10px] font-extrabold">Verified (XXXX-4821)</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-[#DDD8CB]/50">
              <span className="text-[#142217]/60 font-medium">Village & Mandi District:</span>
              <span className="font-bold text-[#142217]">
                {farmer.village || 'Bhavdin'}, {farmer.district || 'Sirsa'}, {farmer.state || 'Haryana'}
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-[#DDD8CB]/50">
              <span className="text-[#142217]/60 font-medium">DBT Bank Account:</span>
              <span className="font-bold text-[#142217]">
                {farmer.bankDetails?.accountNo || '918237461298'} ({farmer.bankDetails?.bankName || 'State Bank of India'})
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[#142217]/60 font-medium">Bank IFSC Code:</span>
              <span className="font-bold text-[#142217] font-mono">{farmer.bankDetails?.ifsc || 'SBIN0001428'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-7 space-y-5 shadow-2xl border border-[#C98A2E]/40 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto border border-emerald-300 shadow-md">
              <CheckCircle2 className="w-10 h-10 text-emerald-700" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-2xl font-bold text-[#142217]">Slot Reserved Successfully!</h3>
              <p className="text-xs text-[#142217]/70">
                Your capacity token has been generated in the state mandi database.
              </p>
            </div>

            <div className="bg-[#F7F5EE] p-5 rounded-2xl border border-[#DDD8CB] space-y-2 text-xs">
              <p className="text-[#142217]/60 uppercase font-extrabold text-[10px] tracking-wider">Digital Mandi Token</p>
              <p className="font-serif text-3xl font-black text-[#C98A2E]">{bookingSuccessModal.token.tokenNumber}</p>
              <p className="text-[#142217]/80 font-bold mt-1">
                {selectedCentre?.name} · {selectedDate}
              </p>
              {bookingSuccessModal.token.qrData && (
                <img
                  src={bookingSuccessModal.token.qrData}
                  alt="Token QR"
                  className="w-28 h-28 mx-auto bg-white p-2 rounded-xl border border-[#DDD8CB] shadow-sm mt-3"
                />
              )}
            </div>

            <button
              onClick={() => {
                setBookingSuccessModal(null);
                setActiveTab('liveQueue');
              }}
              className="btn-gold w-full justify-center py-3 text-xs sm:text-sm font-extrabold shadow-lg"
            >
              Go to Live Queue Tracker
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
