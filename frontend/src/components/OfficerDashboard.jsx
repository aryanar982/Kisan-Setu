import React, { useState, useEffect } from 'react';
import {
  Scale, QrCode, Users, CheckCircle2, XCircle, Play, AlertCircle,
  IndianRupee, Search, RefreshCw, FileText, Printer, ChevronRight,
  ShieldCheck, ArrowRight, Gauge, Cpu, CheckCircle, PlusCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, getAuthToken, setAuthToken, setCurrentUser } from '../api';

export default function OfficerDashboard({ staff, socket }) {
  const [centres, setCentres] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [centre, setCentre] = useState(null);
  const [queue, setQueue] = useState(null);
  const [searchTokenNumber, setSearchTokenNumber] = useState('');
  const [scannedToken, setScannedToken] = useState(null);
  const [isCallingNext, setIsCallingNext] = useState(false);

  // Digital Weighing Scale Form State
  const [grossWeight, setGrossWeight] = useState(42.5);
  const [tareWeight, setTareWeight] = useState(2.5);
  const [rejectedQuantity, setRejectedQuantity] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('High moisture content above threshold');
  const [moisturePercentage, setMoisturePercentage] = useState(11.2);
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [cropRemarks, setCropRemarks] = useState('Certified Grade A produce');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [procurementSuccess, setProcurementSuccess] = useState(null);

  // Ensure staff is authenticated for officer APIs
  useEffect(() => {
    ensureStaffAuth();
    loadAllCentres();
  }, [staff]);

  const ensureStaffAuth = async () => {
    const token = getAuthToken();
    if (!token || !staff) {
      try {
        const res = await api.staffLogin({
          email: 'officer.sirsa@kisansetu.gov.in',
          password: 'password123',
        });
        if (res.success) {
          setAuthToken(res.data.accessToken);
          setCurrentUser({ ...res.data.staff, role: res.data.role });
        }
      } catch (e) {
        console.warn('Demo staff auto-login notice:', e.message);
      }
    }
  };

  const loadAllCentres = async () => {
    try {
      const res = await api.getCentres();
      if (res.success && res.data.length > 0) {
        setCentres(res.data);
        const defaultCentre = staff && staff.centreId
          ? (res.data.find(c => c._id.toString() === (staff.centreId._id || staff.centreId).toString()) || res.data[0])
          : res.data[0];
        setCentre(defaultCentre);
        setSelectedCentreId(defaultCentre._id);
        loadQueueData(defaultCentre._id);
      }
    } catch (e) {
      console.error('Failed to load centres:', e);
    }
  };

  const handleCentreChange = (newId) => {
    setSelectedCentreId(newId);
    const match = centres.find(c => c._id.toString() === newId.toString());
    if (match) {
      setCentre(match);
      setScannedToken(null);
      loadQueueData(newId);
    }
  };

  useEffect(() => {
    if (!socket || !selectedCentreId) return;

    socket.emit('joinCentreQueue', selectedCentreId);

    socket.on('queueUpdated', (updatedQueue) => {
      setQueue(updatedQueue);
    });

    socket.on('newTokenIssued', () => {
      loadQueueData(selectedCentreId);
    });

    return () => {
      socket.off('queueUpdated');
      socket.off('newTokenIssued');
    };
  }, [socket, selectedCentreId]);

  const loadQueueData = async (cId) => {
    const targetId = cId || selectedCentreId || centre?._id;
    if (!targetId) return;

    try {
      const res = await api.getQueue(targetId);
      if (res.success) setQueue(res.data);
    } catch (e) {
      console.error('Queue load error:', e);
    }
  };

  const handleVerifyToken = async (tokenNum) => {
    const target = tokenNum || searchTokenNumber;
    if (!target.trim()) return;

    const targetId = selectedCentreId || centre?._id;
    try {
      const res = await api.verifyToken({ tokenNumber: target, centreId: targetId });
      if (res.success && res.data) {
        setScannedToken(res.data);
        setSearchTokenNumber('');
        // Autofill estimated weight
        const est = res.data.bookingId?.estimatedQuantity || 35;
        setGrossWeight(est + 3.0);
        setTareWeight(3.0);
        loadQueueData(targetId);
      }
    } catch (err) {
      alert(err.message || 'Token not found.');
    }
  };

  const handleCallNext = async () => {
    const targetId = selectedCentreId || centre?._id;
    if (!targetId) {
      alert('Mandi centre is loading. Please wait a moment.');
      return;
    }

    setIsCallingNext(true);
    try {
      const res = await api.callNext(targetId);
      if (res.success && res.data) {
        if (res.data.tokenNumber) {
          confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
          setScannedToken(res.data);
          const est = res.data.bookingId?.estimatedQuantity || 35;
          setGrossWeight(est + 2.8);
          setTareWeight(2.8);
        } else {
          alert(res.data.message || 'No more farmers waiting in queue.');
        }
        loadQueueData(targetId);
      }
    } catch (err) {
      alert(err.message || 'Failed to call next token.');
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleStatusChange = async (tokenId, status) => {
    try {
      await api.updateTokenStatus(tokenId, { status });
      loadQueueData(selectedCentreId);
    } catch (err) {
      alert(err.message);
    }
  };

  // Automated Real-Time Weighbridge Math
  const netWeight = Math.max(0, Number(grossWeight) - Number(tareWeight));
  const acceptedQuantity = Math.max(0, netWeight - Number(rejectedQuantity));
  const pricePerUnit = 2425; // MSP rate for Wheat
  const totalPayable = Math.round(acceptedQuantity * pricePerUnit);

  const handleSubmitProcurement = async (e) => {
    e.preventDefault();
    const tokenToProcure = (scannedToken && scannedToken.tokenNumber)
      ? scannedToken
      : (queue && queue.currentlyServing && queue.currentlyServing.tokenNumber)
      ? queue.currentlyServing
      : null;

    if (!tokenToProcure || !tokenToProcure.bookingId) {
      alert('Please call or scan an active token into the weighbridge bay first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.recordProcurement({
        bookingId: tokenToProcure.bookingId._id || tokenToProcure.bookingId,
        grossWeight,
        tareWeight,
        rejectedQuantity,
        rejectionReason,
        moisturePercentage,
        qualityGrade,
        remarks: cropRemarks,
      });

      if (res.success) {
        confetti({ particleCount: 110, spread: 85, origin: { y: 0.55 } });
        setProcurementSuccess(res.data);
        setScannedToken(null);
        loadQueueData(selectedCentreId);
      }
    } catch (err) {
      alert(err.message || 'Failed to record procurement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Robust check for currently serving token
  const currentlyServingToken = (scannedToken && scannedToken.tokenNumber)
    ? scannedToken
    : (queue && queue.currentlyServing && queue.currentlyServing.tokenNumber)
    ? queue.currentlyServing
    : null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Officer Command Desk Header */}
      <div className="bg-gradient-to-r from-[#142217] via-[#1B2F20] to-[#142217] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#C98A2E]/35 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C98A2E] to-[#9E6819] flex items-center justify-center border border-white/20 shadow-lg shadow-[#C98A2E]/30 shrink-0">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold text-[#EBB668] tracking-widest bg-[#C98A2E]/20 border border-[#C98A2E]/40 px-2.5 py-0.5 rounded-full">
                Officer Desk · {staff?.name || 'Virender Singh (Mandi Officer)'}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#38EF7D] animate-ping"></span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {centre ? centre.name : 'Sirsa Grain Procurement Centre'}
            </h2>
            <p className="text-xs text-white/70 mt-0.5">
              Electronic Weighbridge Terminal 01 · Capacity: {centre?.dailyCapacity || 50} slots/day · Active Waiting: {queue ? queue.waitingCount : 0} farmers
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mandi Centre Dropdown Selector */}
          {centres.length > 0 && (
            <select
              value={selectedCentreId}
              onChange={(e) => handleCentreChange(e.target.value)}
              className="bg-[#0D170F] border border-white/20 text-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none hover:border-[#C98A2E] transition-colors cursor-pointer"
            >
              {centres.map((c) => (
                <option key={c._id} value={c._id} className="bg-[#142217] text-white">
                  {c.name} ({c.district})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleCallNext}
            disabled={isCallingNext}
            className="btn-gold px-5 py-3 text-xs sm:text-sm font-extrabold shadow-xl flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {isCallingNext ? 'Calling...' : 'Call Next Farmer to Bay'}
          </button>

          <button
            onClick={() => loadQueueData()}
            className="btn-outline text-white border-white/20 hover:bg-white/10 text-xs py-3 px-3.5"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QR Scanner & Gate 1 Verification Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QR Scan Desk */}
        <div className="kisan-card p-6 space-y-4 md:col-span-1">
          <div className="flex items-center justify-between pb-2 border-b border-[#DDD8CB]/60">
            <h3 className="font-serif font-bold text-base flex items-center gap-2 text-[#142217]">
              <QrCode className="w-5 h-5 text-[#C98A2E]" /> Verify Farmer Token
            </h3>
            <span className="badge-green text-[10px]">Gate 1 Terminal</span>
          </div>

          <p className="text-xs text-[#142217]/60">
            Scan farmer's QR pass or type token code to verify identity & entry.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyToken();
            }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SIR-20260902-002"
                value={searchTokenNumber}
                onChange={(e) => setSearchTokenNumber(e.target.value)}
                className="input-field text-xs uppercase font-mono font-bold"
              />
              <button type="submit" className="btn-primary py-2.5 px-3.5 text-xs font-bold">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Barcode Buttons */}
          <div className="pt-3 border-t border-[#DDD8CB]/60">
            <span className="text-[10px] font-extrabold text-[#142217]/60 uppercase tracking-wider block mb-2">
              Quick Test Tokens:
            </span>
            <div className="flex flex-wrap gap-2">
              {['SIR-20260902-002', 'SIR-20260902-003', 'SIR-20260902-004'].map((code) => (
                <button
                  key={code}
                  onClick={() => handleVerifyToken(code)}
                  className="text-[11px] bg-[#F7F5EE] hover:bg-[#C98A2E]/20 border border-[#DDD8CB] hover:border-[#C98A2E] px-2.5 py-1 rounded-lg font-mono font-bold text-[#142217] transition-all"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Bay Details Card */}
        <div className="kisan-card-gold p-6 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#C98A2E]/20">
            <div>
              <span className="text-[10px] font-extrabold text-[#1B7A38] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1B7A38] animate-ping"></span>
                Active Farmer on Weighbridge
              </span>
              <h3 className="font-serif text-3xl font-extrabold text-[#142217] mt-0.5">
                {currentlyServingToken ? currentlyServingToken.tokenNumber : 'No Farmer in Bay'}
              </h3>
            </div>
            {currentlyServingToken && currentlyServingToken.status && (
              <span className="badge-green text-xs font-extrabold">
                {currentlyServingToken.status.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>

          {currentlyServingToken ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-white/80 p-3 rounded-xl border border-[#DDD8CB]/70">
                <span className="text-[11px] text-[#142217]/60 font-semibold uppercase">Farmer Name</span>
                <p className="font-bold text-sm text-[#142217] truncate mt-0.5">
                  {currentlyServingToken.bookingId?.farmerId?.name || 'Suresh Patel'}
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-[#DDD8CB]/70">
                <span className="text-[11px] text-[#142217]/60 font-semibold uppercase">Mobile Number</span>
                <p className="font-bold text-sm text-[#142217] font-mono mt-0.5">
                  +91 {currentlyServingToken.bookingId?.farmerId?.phone || '9876500002'}
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-[#DDD8CB]/70">
                <span className="text-[11px] text-[#142217]/60 font-semibold uppercase">Declared Produce</span>
                <p className="font-bold text-sm text-[#142217] mt-0.5">
                  {currentlyServingToken.bookingId?.cropType || 'Wheat'} ({currentlyServingToken.bookingId?.estimatedQuantity || 30} Qtl)
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-[#DDD8CB]/70">
                <span className="text-[11px] text-[#142217]/60 font-semibold uppercase">Aadhaar Verified</span>
                <p className="font-bold text-sm text-[#1B7A38] mt-0.5">Yes (Verified)</p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#142217]/50 space-y-2">
              <Scale className="w-10 h-10 mx-auto text-[#6B7F61]/40" />
              <p>Click "Call Next Farmer to Bay" or verify a token above to load farmer data.</p>
            </div>
          )}
        </div>
      </div>

      {/* Electronic Weighbridge & Procurement Entry Terminal */}
      <div className="kisan-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#DDD8CB]/70">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#142217]">
              <Cpu className="w-6 h-6 text-[#1B7A38]" /> Digital Weighbridge & Quality Grading Terminal
            </h3>
            <p className="text-xs text-[#142217]/60 mt-0.5">
              Direct gross/tare measurement with automatic MSP calculations and DBT disbursement.
            </p>
          </div>
          <span className="badge-gold text-xs font-extrabold font-serif">
            MSP Rate: ₹{pricePerUnit} / Qtl
          </span>
        </div>

        <form onSubmit={handleSubmitProcurement} className="space-y-6 text-xs">
          {/* Digital Readout Screen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 text-[#142217]">
                Gross Truck Weight (Qtl)
              </label>
              <input
                type="number"
                step="0.1"
                value={grossWeight}
                onChange={(e) => setGrossWeight(e.target.value)}
                className="input-field text-xl font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 text-[#142217]">
                Tare Truck Weight (Qtl)
              </label>
              <input
                type="number"
                step="0.1"
                value={tareWeight}
                onChange={(e) => setTareWeight(e.target.value)}
                className="input-field text-xl font-mono font-bold"
              />
            </div>

            <div className="bg-[#0B140D] p-4 rounded-2xl border-2 border-[#38EF7D]/40 flex flex-col justify-center shadow-lg">
              <span className="text-[#38EF7D]/80 font-mono text-[10px] uppercase tracking-widest">
                Net Grain Weight (Automatic)
              </span>
              <p className="font-mono text-3xl font-black text-[#38EF7D] text-shadow mt-1">
                {netWeight.toFixed(2)} <span className="text-base">Qtl</span>
              </p>
            </div>
          </div>

          {/* Quality, Moisture & Rejection Entries */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 text-[#142217]">
                Quality Grade
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="input-field font-semibold"
              >
                <option value="Grade A">Grade A (Premium - 100% MSP)</option>
                <option value="Grade B">Grade B (Standard)</option>
                <option value="Grade C">Grade C (Sub-standard)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 text-[#142217]">
                Moisture Content (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={moisturePercentage}
                onChange={(e) => setMoisturePercentage(e.target.value)}
                className="input-field font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider mb-1.5 text-[#142217]">
                Deduction / Rejected (Qtl)
              </label>
              <input
                type="number"
                step="0.1"
                value={rejectedQuantity}
                onChange={(e) => setRejectedQuantity(e.target.value)}
                className="input-field font-semibold"
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex flex-col justify-center">
              <span className="text-emerald-900 font-extrabold uppercase text-[10px] tracking-wider">
                Net Accepted Quantity
              </span>
              <p className="font-serif text-3xl font-extrabold text-emerald-900 mt-1">
                {acceptedQuantity.toFixed(2)} <span className="text-base font-sans font-normal">Qtl</span>
              </p>
            </div>
          </div>

          {/* Automated DBT Payout Strip */}
          <div className="bg-gradient-to-r from-[#142217] via-[#1C3222] to-[#142217] text-white p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 border border-[#C98A2E]/30 shadow-xl">
            <div>
              <span className="text-xs text-[#EBB668] uppercase font-extrabold tracking-widest">
                Direct Benefit Transfer (DBT) Payout Voucher
              </span>
              <h4 className="font-serif text-3xl sm:text-4xl font-black text-white mt-1">
                ₹{totalPayable.toLocaleString('en-IN')}
              </h4>
              <p className="text-xs text-white/70 mt-1">
                {acceptedQuantity} Quintals × ₹{pricePerUnit}/Qtl (Instantly credited to farmer's Aadhaar-linked account)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !currentlyServingToken}
              className="btn-gold whitespace-nowrap px-8 py-4 text-sm font-extrabold shadow-2xl disabled:opacity-50"
            >
              {isSubmitting ? 'Recording & Disbursing DBT...' : 'Approve & Trigger DBT Payment'}
            </button>
          </div>
        </form>
      </div>

      {/* Queue Management Table */}
      <div className="kisan-card overflow-hidden">
        <div className="p-5 bg-[#F7F5EE] border-b border-[#DDD8CB] flex items-center justify-between">
          <h4 className="font-serif font-bold text-base text-[#142217]">Today's Mandi Queue Desk</h4>
          <span className="badge-gold text-xs">
            {queue ? queue.tokens?.length || 0 : 0} Total Tokens Today
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#EDEAE1]/60 text-[#142217]/70 border-b border-[#DDD8CB] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Pos</th>
                <th className="p-3.5">Token #</th>
                <th className="p-3.5">Farmer</th>
                <th className="p-3.5">Crop / Qtl</th>
                <th className="p-3.5">Slot Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDD8CB]/60 font-medium">
              {queue && queue.tokens && queue.tokens.length > 0 ? (
                queue.tokens.map((t) => (
                  <tr key={t._id} className="hover:bg-[#F7F5EE]/60 transition-colors">
                    <td className="p-3.5 font-bold text-[#142217]/60">
                      {t.queuePosition === 0 ? '▶' : `#${t.queuePosition}`}
                    </td>
                    <td className="p-3.5 font-mono font-extrabold text-[#142217]">{t.tokenNumber}</td>
                    <td className="p-3.5 font-bold text-[#142217]">
                      {t.bookingId?.farmerId?.name || 'Farmer'}
                    </td>
                    <td className="p-3.5 text-[#142217]">
                      {t.bookingId?.cropType || 'Wheat'} ({t.bookingId?.estimatedQuantity || 25} Qtl)
                    </td>
                    <td className="p-3.5 text-[#142217]/70">
                      {t.bookingId?.slotId?.startTime || '08:00'} – {t.bookingId?.slotId?.endTime || '09:00'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        t.status === 'being_served'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse'
                          : t.status === 'served'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-[#FFF3DB] text-[#8C560A] border border-[#C98A2E]/30'
                      }`}>
                        {t.status ? t.status.replace('_', ' ') : 'in_queue'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {t.status !== 'being_served' && t.status !== 'served' && (
                        <button
                          onClick={() => {
                            setScannedToken(t);
                            handleStatusChange(t._id, 'being_served');
                          }}
                          className="text-[#C98A2E] font-bold hover:underline"
                        >
                          Call to Bay
                        </button>
                      )}
                      {t.status !== 'served' && (
                        <button
                          onClick={() => handleStatusChange(t._id, 'no_show')}
                          className="text-[#BA3D2C] hover:underline"
                        >
                          No-Show
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-[#142217]/50">
                    No tokens waiting in queue. Click "Call Next Farmer to Bay" to dispatch produce.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Procurement Confirmation Slip Modal */}
      {procurementSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-7 space-y-5 shadow-2xl border border-[#C98A2E]/40">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto border border-emerald-300 shadow-md">
              <CheckCircle2 className="w-10 h-10 text-emerald-700" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif text-2xl font-bold text-[#142217]">Procurement Confirmed & Disbursed!</h3>
              <p className="text-xs text-[#142217]/60">
                DBT payment voucher has been transmitted directly to PFMS gateway.
              </p>
            </div>

            <div className="bg-[#F7F5EE] p-5 rounded-2xl border border-[#DDD8CB] space-y-2.5 text-xs font-medium">
              <div className="flex justify-between py-1 border-b border-[#DDD8CB]/60">
                <span className="text-[#142217]/60">PFMS UTR Voucher:</span>
                <span className="font-mono font-bold text-[#142217]">{procurementSuccess.payment.transactionId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDD8CB]/60">
                <span className="text-[#142217]/60">Accepted Net Quantity:</span>
                <span className="font-bold text-[#142217]">{procurementSuccess.procurement.acceptedQuantity} Quintals</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDD8CB]/60">
                <span className="text-[#142217]/60">Certified Grade:</span>
                <span className="badge-green font-extrabold">{procurementSuccess.procurement.qualityGrade}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-extrabold text-[#142217]">
                <span>Total Disbursed:</span>
                <span className="font-serif text-2xl text-[#1B7A38]">
                  ₹{procurementSuccess.payment.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="btn-outline flex-1 justify-center text-xs py-3 font-bold"
              >
                <Printer className="w-4 h-4" /> Print Mandi Gate Pass
              </button>
              <button
                onClick={() => setProcurementSuccess(null)}
                className="btn-gold flex-1 justify-center text-xs py-3 font-bold shadow-lg"
              >
                Next Farmer in Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
