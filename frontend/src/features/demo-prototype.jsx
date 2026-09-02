import React, { useState, useMemo } from "react";
import {
  Wheat, MapPin, Clock, User, CheckCircle2, ArrowLeft, Ticket,
  Users, LayoutGrid, ClipboardList, IndianRupee, BarChart3,
  ChevronRight, PlayCircle, PackageCheck, AlertCircle
} from "lucide-react";

const ink = "#1F2E22";
const paper = "#F4F2E9";
const gold = "#C98A2E";
const sage = "#7A8B6F";
const rust = "#B4483A";
const white = "#FFFFFF";

const headFont = { fontFamily: "'Roboto Slab', serif" };
const bodyFont = { fontFamily: "'Inter', sans-serif" };

const initialCentres = [
  {
    id: "c1", name: "Sirsa Grain Procurement Centre", village: "Sirsa, Haryana",
    crop: "Wheat", dailyCapacity: 40,
    slots: [
      { id: "s1", time: "7:00 – 8:00 AM", capacity: 10, booked: 10 },
      { id: "s2", time: "8:00 – 9:00 AM", capacity: 10, booked: 6 },
      { id: "s3", time: "9:00 – 10:00 AM", capacity: 10, booked: 3 },
      { id: "s4", time: "10:00 – 11:00 AM", capacity: 10, booked: 1 },
    ],
  },
  {
    id: "c2", name: "Kaithal Mandi Procurement Centre", village: "Kaithal, Haryana",
    crop: "Paddy", dailyCapacity: 30,
    slots: [
      { id: "s5", time: "7:00 – 8:00 AM", capacity: 8, booked: 4 },
      { id: "s6", time: "8:00 – 9:00 AM", capacity: 8, booked: 8 },
      { id: "s7", time: "9:00 – 10:00 AM", capacity: 8, booked: 2 },
    ],
  },
];

const statusMeta = {
  booked: { label: "Booked", color: sage },
  checked_in: { label: "Checked in", color: gold },
  in_queue: { label: "In queue", color: gold },
  being_served: { label: "Being served", color: "#3B6D11" },
  served: { label: "Procured", color: ink },
};

const paymentMeta = {
  pending: { label: "Pending", color: rust },
  processing: { label: "Processing", color: gold },
  paid: { label: "Paid", color: "#3B6D11" },
};

function nextTokenNumber(centreId, existing) {
  const code = centreId.toUpperCase();
  const count = existing.filter((t) => t.centreId === centreId).length + 1;
  return `${code}-${String(count).padStart(3, "0")}`;
}

export default function App() {
  const [role, setRole] = useState("farmer");
  const [centres, setCentres] = useState(initialCentres);
  const [tokens, setTokens] = useState([]);

  return (
    <div style={{ ...bodyFont, background: paper, minHeight: "600px", color: ink }} className="w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      <TopBar role={role} setRole={setRole} />

      <div className="max-w-5xl mx-auto px-6 py-6">
        {role === "farmer" && (
          <FarmerFlow centres={centres} setCentres={setCentres} tokens={tokens} setTokens={setTokens} />
        )}
        {role === "centre" && (
          <CentreDashboard centres={centres} tokens={tokens} setTokens={setTokens} />
        )}
        {role === "admin" && <AdminDashboard centres={centres} tokens={tokens} />}
      </div>
    </div>
  );
}

function TopBar({ role, setRole }) {
  const tabs = [
    { id: "farmer", label: "Farmer", icon: User },
    { id: "centre", label: "Centre staff", icon: LayoutGrid },
    { id: "admin", label: "Admin", icon: BarChart3 },
  ];
  return (
    <div style={{ background: ink, color: white }}>
      <div className="max-w-5xl mx-auto px-6 pt-5 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <Wheat size={22} color={gold} />
          <span style={{ ...headFont, fontSize: "18px", fontWeight: 500 }}>Kisan Setu</span>
          <span style={{ color: sage, fontSize: "13px", marginLeft: "4px" }}>farmer procurement platform</span>
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = role === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setRole(t.id)}
                className="flex items-center gap-2"
                style={{
                  ...bodyFont,
                  fontSize: "14px",
                  padding: "9px 16px",
                  background: active ? paper : "transparent",
                  color: active ? ink : "#D8D6C9",
                  border: "none",
                  borderRadius: "8px 8px 0 0",
                  cursor: "pointer",
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- FARMER FLOW ---------------- */

function FarmerFlow({ centres, setCentres, tokens, setTokens }) {
  const [step, setStep] = useState("search");
  const [farmerName, setFarmerName] = useState("Ramesh Kumar");
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [myTokenId, setMyTokenId] = useState(null);

  const myToken = tokens.find((t) => t.id === myTokenId);

  function bookSlot() {
    if (selectedSlot.booked >= selectedSlot.capacity) return;
    setCentres((prev) =>
      prev.map((c) =>
        c.id !== selectedCentre.id
          ? c
          : {
              ...c,
              slots: c.slots.map((s) =>
                s.id === selectedSlot.id ? { ...s, booked: s.booked + 1 } : s
              ),
            }
      )
    );
    const tokenNumber = nextTokenNumber(selectedCentre.id, tokens);
    const newToken = {
      id: `${selectedCentre.id}-${Date.now()}`,
      tokenNumber,
      farmerName,
      centreId: selectedCentre.id,
      centreName: selectedCentre.name,
      slotTime: selectedSlot.time,
      crop: selectedCentre.crop,
      status: "booked",
      queuePosition: tokens.filter((t) => t.centreId === selectedCentre.id && t.status !== "served").length + 1,
      procurement: null,
      payment: "pending",
    };
    setTokens((prev) => [...prev, newToken]);
    setMyTokenId(newToken.id);
    setStep("token");
  }

  if (step === "search") {
    return (
      <div>
        <SectionHeading eyebrow="Step 1 of 3" title="Find a procurement centre" />
        <div className="mb-5" style={{ maxWidth: "320px" }}>
          <label style={{ fontSize: "13px", color: sage, display: "block", marginBottom: "4px" }}>Your name</label>
          <input
            value={farmerName}
            onChange={(e) => setFarmerName(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div className="flex flex-col gap-3">
          {centres.map((c) => {
            const totalBooked = c.slots.reduce((a, s) => a + s.booked, 0);
            const pct = Math.round((totalBooked / c.dailyCapacity) * 100);
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedCentre(c); setStep("slots"); }}
                className="flex items-center justify-between text-left"
                style={{ ...cardStyle, cursor: "pointer" }}
              >
                <div>
                  <div style={{ ...headFont, fontSize: "16px", fontWeight: 500 }}>{c.name}</div>
                  <div className="flex items-center gap-3 mt-1" style={{ fontSize: "13px", color: sage }}>
                    <span className="flex items-center gap-1"><MapPin size={13} />{c.village}</span>
                    <span className="flex items-center gap-1"><Wheat size={13} />{c.crop}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: pct >= 90 ? rust : sage, marginTop: "6px" }}>
                    {totalBooked}/{c.dailyCapacity} booked today ({pct}% capacity)
                  </div>
                </div>
                <ChevronRight size={18} color={sage} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === "slots") {
    return (
      <div>
        <BackLink onClick={() => setStep("search")} label="Back to centres" />
        <SectionHeading eyebrow="Step 2 of 3" title={`Available slots — ${selectedCentre.name}`} />
        <div className="flex flex-col gap-2">
          {selectedCentre.slots.map((s) => {
            const full = s.booked >= s.capacity;
            return (
              <button
                key={s.id}
                disabled={full}
                onClick={() => { setSelectedSlot(s); setStep("confirm"); }}
                className="flex items-center justify-between text-left"
                style={{
                  ...cardStyle,
                  cursor: full ? "not-allowed" : "pointer",
                  opacity: full ? 0.55 : 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <Clock size={16} color={ink} />
                  <span style={{ fontSize: "15px", fontWeight: 500 }}>{s.time}</span>
                </div>
                <span style={{ fontSize: "13px", color: full ? rust : sage }}>
                  {full ? "Full" : `${s.capacity - s.booked} of ${s.capacity} left`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div>
        <BackLink onClick={() => setStep("slots")} label="Back to slots" />
        <SectionHeading eyebrow="Step 3 of 3" title="Confirm your booking" />
        <div style={{ ...cardStyle, maxWidth: "420px" }}>
          <Row label="Centre" value={selectedCentre.name} />
          <Row label="Crop" value={selectedCentre.crop} />
          <Row label="Slot" value={selectedSlot.time} />
          <Row label="Farmer" value={farmerName} />
        </div>
        <button onClick={bookSlot} style={primaryBtn} className="mt-4">
          Book this slot
        </button>
      </div>
    );
  }

  if (step === "token" && myToken) {
    return (
      <div>
        <SectionHeading title="Your digital token" />
        <TokenCard token={myToken} />
        <button
          onClick={() => { setStep("search"); setSelectedCentre(null); setSelectedSlot(null); }}
          style={{ ...bodyFont, fontSize: "13px", color: sage, background: "none", border: "none", cursor: "pointer", marginTop: "16px" }}
        >
          Book another slot
        </button>
      </div>
    );
  }
}

function TokenCard({ token }) {
  const meta = statusMeta[token.status];
  const payMeta = paymentMeta[token.payment];
  return (
    <div style={{ maxWidth: "420px" }}>
      <div
        style={{
          background: white,
          border: `1.5px solid ${ink}`,
          borderRadius: "14px",
          padding: "20px 22px",
          position: "relative",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ticket size={18} color={gold} />
            <span style={{ ...headFont, fontSize: "20px", fontWeight: 600, letterSpacing: "0.5px" }}>
              {token.tokenNumber}
            </span>
          </div>
          <span
            style={{
              fontSize: "12px", fontWeight: 500, color: white,
              background: meta.color, padding: "4px 10px", borderRadius: "20px",
            }}
          >
            {meta.label}
          </span>
        </div>
        <div style={{ borderTop: `1px dashed ${sage}`, margin: "10px 0" }} />
        <Row label="Centre" value={token.centreName} />
        <Row label="Crop" value={token.crop} />
        <Row label="Slot" value={token.slotTime} />
        <Row label="Queue position" value={token.status === "served" ? "—" : `#${token.queuePosition}`} />
        {token.procurement && (
          <>
            <Row label="Quantity" value={`${token.procurement.qty} quintal`} />
            <Row label="Rate" value={`₹${token.procurement.price}/quintal`} />
            <Row label="Total" value={`₹${(token.procurement.qty * token.procurement.price).toLocaleString("en-IN")}`} />
          </>
        )}
        <div className="flex items-center justify-between mt-3" style={{ borderTop: `1px solid ${paper}`, paddingTop: "10px" }}>
          <span style={{ fontSize: "13px", color: sage }}>Payment</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: payMeta.color }}>{payMeta.label}</span>
        </div>
      </div>
      <p style={{ fontSize: "12px", color: sage, marginTop: "10px" }}>
        This screen updates live as centre staff move you through the queue — try switching to "Centre staff" and calling the next token.
      </p>
    </div>
  );
}

/* ---------------- CENTRE DASHBOARD ---------------- */

function CentreDashboard({ centres, tokens, setTokens }) {
  const [centreId, setCentreId] = useState(centres[0].id);
  const [servingModal, setServingModal] = useState(null);
  const centre = centres.find((c) => c.id === centreId);
  const centreTokens = tokens
    .filter((t) => t.centreId === centreId)
    .sort((a, b) => a.queuePosition - b.queuePosition);

  const waiting = centreTokens.filter((t) => ["booked", "checked_in", "in_queue"].includes(t.status));
  const active = centreTokens.find((t) => t.status === "being_served");

  function callNext() {
    if (active) return;
    const next = waiting[0];
    if (!next) return;
    setTokens((prev) => prev.map((t) => (t.id === next.id ? { ...t, status: "being_served" } : t)));
  }

  function markServed(qty, price) {
    setTokens((prev) =>
      prev.map((t) =>
        t.id === servingModal.id
          ? { ...t, status: "served", procurement: { qty, price }, payment: "processing" }
          : t
      )
    );
    setServingModal(null);
  }

  function markPaid(id) {
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, payment: "paid" } : t)));
  }

  const totalBooked = centre.slots.reduce((a, s) => a + s.booked, 0);
  const utilPct = Math.round((totalBooked / centre.dailyCapacity) * 100);

  return (
    <div>
      <SectionHeading title="Centre dashboard" />
      <div className="mb-5" style={{ maxWidth: "320px" }}>
        <label style={{ fontSize: "13px", color: sage, display: "block", marginBottom: "4px" }}>Centre</label>
        <select value={centreId} onChange={(e) => setCentreId(e.target.value)} style={inputStyle}>
          {centres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6" style={{ maxWidth: "620px" }}>
        <MetricCard label="Today's bookings" value={centreTokens.length} />
        <MetricCard label="Waiting in queue" value={waiting.length} />
        <MetricCard label="Capacity used" value={`${utilPct}%`} warn={utilPct >= 90} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 style={{ ...headFont, fontSize: "16px", fontWeight: 500 }}>Live queue</h3>
        <button onClick={callNext} disabled={!!active || waiting.length === 0} style={{
          ...primaryBtn, padding: "8px 16px", fontSize: "13px",
          opacity: active || waiting.length === 0 ? 0.5 : 1,
          cursor: active || waiting.length === 0 ? "not-allowed" : "pointer",
        }}>
          <PlayCircle size={15} className="inline mr-1" style={{ verticalAlign: "-3px" }} />
          Call next token
        </button>
      </div>

      {centreTokens.length === 0 ? (
        <EmptyNote text="No bookings yet for this centre — book a slot from the Farmer tab to see it appear here." />
      ) : (
        <div className="flex flex-col gap-2">
          {centreTokens.map((t) => (
            <QueueRow key={t.id} token={t} onServe={() => setServingModal(t)} onMarkPaid={() => markPaid(t.id)} />
          ))}
        </div>
      )}

      {servingModal && (
        <ServeModal token={servingModal} onClose={() => setServingModal(null)} onSubmit={markServed} />
      )}
    </div>
  );
}

function QueueRow({ token, onServe, onMarkPaid }) {
  const meta = statusMeta[token.status];
  const payMeta = paymentMeta[token.payment];
  return (
    <div style={{ ...cardStyle, cursor: "default" }} className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span style={{ ...headFont, fontSize: "15px", fontWeight: 600, width: "90px" }}>{token.tokenNumber}</span>
        <div>
          <div style={{ fontSize: "14px" }}>{token.farmerName}</div>
          <div style={{ fontSize: "12px", color: sage }}>{token.slotTime}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ fontSize: "12px", fontWeight: 500, color: white, background: meta.color, padding: "3px 9px", borderRadius: "20px" }}>
          {meta.label}
        </span>
        {token.status === "being_served" && (
          <button onClick={onServe} style={{ ...secondaryBtn, fontSize: "12px", padding: "6px 12px" }}>
            <PackageCheck size={13} className="inline mr-1" style={{ verticalAlign: "-2px" }} />
            Record procurement
          </button>
        )}
        {token.status === "served" && token.payment !== "paid" && (
          <button onClick={onMarkPaid} style={{ ...secondaryBtn, fontSize: "12px", padding: "6px 12px" }}>
            <IndianRupee size={13} className="inline mr-1" style={{ verticalAlign: "-2px" }} />
            Mark paid
          </button>
        )}
        {token.status === "served" && (
          <span style={{ fontSize: "12px", color: payMeta.color, fontWeight: 500 }}>{payMeta.label}</span>
        )}
      </div>
    </div>
  );
}

function ServeModal({ token, onClose, onSubmit }) {
  const [qty, setQty] = useState("20");
  const [price, setPrice] = useState("2275");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(31,46,34,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
      <div style={{ background: white, borderRadius: "12px", padding: "22px", width: "320px" }}>
        <h3 style={{ ...headFont, fontSize: "16px", fontWeight: 500, marginBottom: "12px" }}>
          Record procurement — {token.tokenNumber}
        </h3>
        <label style={{ fontSize: "13px", color: sage, display: "block", marginBottom: "4px" }}>Quantity (quintal)</label>
        <input value={qty} onChange={(e) => setQty(e.target.value)} style={{ ...inputStyle, marginBottom: "12px" }} />
        <label style={{ fontSize: "13px", color: sage, display: "block", marginBottom: "4px" }}>Rate (₹ per quintal)</label>
        <input value={price} onChange={(e) => setPrice(e.target.value)} style={{ ...inputStyle, marginBottom: "18px" }} />
        <div className="flex gap-2">
          <button onClick={onClose} style={{ ...secondaryBtn, flex: 1 }}>Cancel</button>
          <button
            onClick={() => onSubmit(Number(qty) || 0, Number(price) || 0)}
            style={{ ...primaryBtn, flex: 1 }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ADMIN DASHBOARD ---------------- */

function AdminDashboard({ centres, tokens }) {
  const totalBookings = tokens.length;
  const served = tokens.filter((t) => t.status === "served").length;
  const pendingPayments = tokens.filter((t) => t.status === "served" && t.payment !== "paid").length;
  const avgUtil = Math.round(
    centres.reduce((sum, c) => {
      const booked = c.slots.reduce((a, s) => a + s.booked, 0);
      return sum + booked / c.dailyCapacity;
    }, 0) / centres.length * 100
  );

  return (
    <div>
      <SectionHeading title="Admin overview" />
      <div className="grid grid-cols-4 gap-3 mb-7" style={{ maxWidth: "700px" }}>
        <MetricCard label="Centres" value={centres.length} />
        <MetricCard label="Bookings today" value={totalBookings} />
        <MetricCard label="Procured" value={served} />
        <MetricCard label="Payments pending" value={pendingPayments} warn={pendingPayments > 0} />
      </div>

      <h3 style={{ ...headFont, fontSize: "16px", fontWeight: 500, marginBottom: "10px" }}>Centre utilization</h3>
      <div className="flex flex-col gap-3" style={{ maxWidth: "560px" }}>
        {centres.map((c) => {
          const booked = c.slots.reduce((a, s) => a + s.booked, 0);
          const pct = Math.round((booked / c.dailyCapacity) * 100);
          return (
            <div key={c.id}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: "14px" }}>{c.name}</span>
                <span style={{ fontSize: "13px", color: pct >= 90 ? rust : sage }}>{booked}/{c.dailyCapacity}</span>
              </div>
              <div style={{ background: "#E4E1D3", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 90 ? rust : gold, height: "100%" }} />
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={{ ...headFont, fontSize: "16px", fontWeight: 500, margin: "26px 0 10px" }}>All tokens</h3>
      {tokens.length === 0 ? (
        <EmptyNote text="No activity yet — book a slot as a farmer to populate the platform." />
      ) : (
        <div className="flex flex-col gap-2">
          {tokens.map((t) => {
            const meta = statusMeta[t.status];
            return (
              <div key={t.id} style={{ ...cardStyle, cursor: "default", padding: "10px 16px" }} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span style={{ ...headFont, fontSize: "13px", fontWeight: 600 }}>{t.tokenNumber}</span>
                  <span style={{ fontSize: "13px", color: sage }}>{t.farmerName}</span>
                  <span style={{ fontSize: "12px", color: sage }}>{t.centreName}</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: white, background: meta.color, padding: "3px 9px", borderRadius: "20px" }}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- SHARED ---------------- */

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mb-5">
      {eyebrow && <div style={{ fontSize: "12px", color: gold, marginBottom: "2px" }}>{eyebrow}</div>}
      <h2 style={{ ...headFont, fontSize: "22px", fontWeight: 500 }}>{title}</h2>
    </div>
  );
}

function BackLink({ onClick, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 mb-4" style={{ ...bodyFont, fontSize: "13px", color: sage, background: "none", border: "none", cursor: "pointer" }}>
      <ArrowLeft size={14} /> {label}
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "4px 0", fontSize: "14px" }}>
      <span style={{ color: sage }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function MetricCard({ label, value, warn }) {
  return (
    <div style={{ background: white, border: `1px solid #E4E1D3`, borderRadius: "10px", padding: "14px 16px" }}>
      <div style={{ fontSize: "12px", color: sage, marginBottom: "6px" }}>{label}</div>
      <div style={{ ...headFont, fontSize: "22px", fontWeight: 500, color: warn ? rust : ink }}>{value}</div>
    </div>
  );
}

function EmptyNote({ text }) {
  return (
    <div className="flex items-center gap-2" style={{ ...cardStyle, cursor: "default", color: sage, fontSize: "13px" }}>
      <AlertCircle size={15} />
      {text}
    </div>
  );
}

const cardStyle = {
  background: white,
  border: "1px solid #E4E1D3",
  borderRadius: "10px",
  padding: "14px 18px",
  width: "100%",
};

const inputStyle = {
  ...bodyFont,
  width: "100%",
  padding: "9px 12px",
  border: `1px solid #D8D6C9`,
  borderRadius: "8px",
  fontSize: "14px",
  background: white,
};

const primaryBtn = {
  ...bodyFont,
  background: ink,
  color: white,
  border: "none",
  borderRadius: "8px",
  padding: "10px 20px",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
};

const secondaryBtn = {
  ...bodyFont,
  background: "transparent",
  color: ink,
  border: `1px solid ${ink}`,
  borderRadius: "8px",
  padding: "8px 14px",
  fontSize: "13px",
  cursor: "pointer",
};
