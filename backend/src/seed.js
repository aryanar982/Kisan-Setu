const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');

const Centre = require('./models/Centre');
const Admin = require('./models/Admin');
const Farmer = require('./models/Farmer');
const Crop = require('./models/Crop');
const Slot = require('./models/Slot');
const Booking = require('./models/Booking');
const Token = require('./models/Token');
const Procurement = require('./models/Procurement');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmer_procurement';

async function seedDatabase() {
  console.log('--- Connecting to MongoDB for comprehensive seeding ---');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  // Clean all existing data
  await Promise.all([
    Centre.deleteMany({}),
    Admin.deleteMany({}),
    Farmer.deleteMany({}),
    Crop.deleteMany({}),
    Slot.deleteMany({}),
    Booking.deleteMany({}),
    Token.deleteMany({}),
    Procurement.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('Cleared existing database collections.');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ==========================================
  // 1. SEED 5 PROCUREMENT CENTRES
  // ==========================================
  const centres = await Centre.insertMany([
    {
      name: 'Sirsa Grain Procurement Centre',
      district: 'Sirsa',
      state: 'Haryana',
      location: { lat: 29.5334, lng: 75.0298, address: 'Old Mandi Road, Sector 3, Sirsa, Haryana 125055' },
      cropsAccepted: ['Wheat', 'Mustard', 'Bajra', 'Barley'],
      dailyCapacity: 50,
      contactPhone: '01666-224411',
      currentQueueCount: 4,
      averageWaitTimeMinutes: 18,
      activeStatus: true,
    },
    {
      name: 'Kaithal Mandi Procurement Centre',
      district: 'Kaithal',
      state: 'Haryana',
      location: { lat: 29.8015, lng: 76.3996, address: 'Near Grain Market, Kaithal, Haryana 136027' },
      cropsAccepted: ['Wheat', 'Paddy', 'Gram'],
      dailyCapacity: 40,
      contactPhone: '01746-231188',
      currentQueueCount: 2,
      averageWaitTimeMinutes: 12,
      activeStatus: true,
    },
    {
      name: 'Fatehabad APMC Mandi',
      district: 'Fatehabad',
      state: 'Haryana',
      location: { lat: 29.5147, lng: 75.4549, address: 'NH-9 Bypass, Fatehabad, Haryana 125050' },
      cropsAccepted: ['Wheat', 'Cotton', 'Mustard'],
      dailyCapacity: 45,
      contactPhone: '01667-220044',
      currentQueueCount: 8,
      averageWaitTimeMinutes: 28,
      activeStatus: true,
    },
    {
      name: 'Hisar Agro Procurement Hub',
      district: 'Hisar',
      state: 'Haryana',
      location: { lat: 29.1492, lng: 75.7217, address: 'Rajgarh Road, Hisar, Haryana 125001' },
      cropsAccepted: ['Wheat', 'Mustard', 'Gram', 'Bajra'],
      dailyCapacity: 60,
      contactPhone: '01662-245599',
      currentQueueCount: 1,
      averageWaitTimeMinutes: 10,
      activeStatus: true,
    },
    {
      name: 'Karnal Royal APMC Grain Market',
      district: 'Karnal',
      state: 'Haryana',
      location: { lat: 29.6857, lng: 76.9905, address: 'GT Road APMC Yard, Karnal, Haryana 132001' },
      cropsAccepted: ['Wheat', 'Paddy', 'Mustard', 'Barley'],
      dailyCapacity: 55,
      contactPhone: '0184-225588',
      currentQueueCount: 3,
      averageWaitTimeMinutes: 15,
      activeStatus: true,
    },
  ]);
  console.log(`✓ Seeded ${centres.length} Procurement Centres.`);

  // ==========================================
  // 2. SEED OFFICERS & ADMINS
  // ==========================================
  const staff = await Admin.insertMany([
    {
      name: 'Virender Singh (Mandi Officer)',
      email: 'officer.sirsa@kisansetu.gov.in',
      phone: '9876543210',
      passwordHash,
      role: 'centre_staff',
      centreId: centres[0]._id,
      district: 'Sirsa',
      state: 'Haryana',
    },
    {
      name: 'Rajesh Sharma (Mandi Officer)',
      email: 'officer.kaithal@kisansetu.gov.in',
      phone: '9876543211',
      passwordHash,
      role: 'centre_staff',
      centreId: centres[1]._id,
      district: 'Kaithal',
      state: 'Haryana',
    },
    {
      name: 'Kuldeep Bishnoi (Mandi Officer)',
      email: 'officer.fatehabad@kisansetu.gov.in',
      phone: '9876543214',
      passwordHash,
      role: 'centre_staff',
      centreId: centres[2]._id,
      district: 'Fatehabad',
      state: 'Haryana',
    },
    {
      name: 'Dr. Sunita Deshmukh (District Collector / Admin)',
      email: 'admin.sirsa@kisansetu.gov.in',
      phone: '9876543212',
      passwordHash,
      role: 'district_admin',
      district: 'Sirsa',
      state: 'Haryana',
    },
    {
      name: 'State Director of Agriculture',
      email: 'admin.haryana@kisansetu.gov.in',
      phone: '9876543213',
      passwordHash,
      role: 'state_admin',
      district: 'Chandigarh',
      state: 'Haryana',
    },
  ]);
  console.log(`✓ Seeded ${staff.length} Officers and Admins.`);

  // ==========================================
  // 3. SEED 35 REALISTIC FARMERS
  // ==========================================
  const farmerNames = [
    { name: 'Ramesh Kumar', village: 'Bhavdin', district: 'Sirsa', crop: 'Wheat' },
    { name: 'Suresh Patel', village: 'Ding', district: 'Sirsa', crop: 'Wheat' },
    { name: 'Harpreet Singh', village: 'Rania', district: 'Sirsa', crop: 'Mustard' },
    { name: 'Anita Devi', village: 'Chopta', district: 'Sirsa', crop: 'Wheat' },
    { name: 'Balwinder Singh', village: 'Pundri', district: 'Kaithal', crop: 'Paddy' },
    { name: 'Kuldeep Yadav', village: 'Kalayat', district: 'Kaithal', crop: 'Wheat' },
    { name: 'Meena Kumari', village: 'Rajound', district: 'Kaithal', crop: 'Gram' },
    { name: 'Jagdish Chand', village: 'Tohana', district: 'Fatehabad', crop: 'Cotton' },
    { name: 'Pooja Rani', village: 'Ratia', district: 'Fatehabad', crop: 'Wheat' },
    { name: 'Satnam Singh', village: 'Bhuna', district: 'Fatehabad', crop: 'Mustard' },
    { name: 'Devender Kumar', village: 'Hansi', district: 'Hisar', crop: 'Wheat' },
    { name: 'Kavita Sharma', village: 'Barwala', district: 'Hisar', crop: 'Mustard' },
    { name: 'Rajendra Prasad', village: 'Narnaund', district: 'Hisar', crop: 'Bajra' },
    { name: 'Sunil Bishnoi', village: 'Adampur', district: 'Hisar', crop: 'Wheat' },
    { name: 'Manjeet Kaur', village: 'Taraori', district: 'Karnal', crop: 'Paddy' },
    { name: 'Surinder Pal', village: 'Gharaunda', district: 'Karnal', crop: 'Wheat' },
    { name: 'Vikas Hooda', village: 'Assandh', district: 'Karnal', crop: 'Mustard' },
    { name: 'Pawan Malik', village: 'Indri', district: 'Karnal', crop: 'Wheat' },
    { name: 'Rekha Devi', village: 'Nilokheri', district: 'Karnal', crop: 'Paddy' },
    { name: 'Mukesh Saini', village: 'Kalanwali', district: 'Sirsa', crop: 'Wheat' },
    { name: 'Jaswinder Singh', village: 'Ellenabad', district: 'Sirsa', crop: 'Wheat' },
    { name: 'Dharmendra Singh', village: 'Siwan', district: 'Kaithal', crop: 'Paddy' },
    { name: 'Geeta Devi', village: 'Cheeka', district: 'Kaithal', crop: 'Wheat' },
    { name: 'Ashok Kumar', village: 'Bhattu Kalan', district: 'Fatehabad', crop: 'Mustard' },
    { name: 'Naresh Chahal', village: 'Jakhal', district: 'Fatehabad', crop: 'Wheat' },
    { name: 'Bhim Singh', village: 'Agroha', district: 'Hisar', crop: 'Gram' },
    { name: 'Santosh Devi', village: 'Uklana', district: 'Hisar', crop: 'Wheat' },
    { name: 'Rakesh Sharma', village: 'Kunjpura', district: 'Karnal', crop: 'Wheat' },
    { name: 'Deepak Verma', village: 'Nissing', district: 'Karnal', crop: 'Mustard' },
    { name: 'Amarjeet Singh', village: 'Dabwali', district: 'Sirsa', crop: 'Wheat' },
    { name: 'Suman Lata', village: 'Shahabad', district: 'Kurukshetra', crop: 'Paddy' },
    { name: 'Om Prakash', village: 'Pehowa', district: 'Kurukshetra', crop: 'Wheat' },
    { name: 'Tarun Dahiya', village: 'Gohana', district: 'Sonipat', crop: 'Wheat' },
    { name: 'Anand Rathi', village: 'Meham', district: 'Rohtak', crop: 'Wheat' },
    { name: 'Praveen Punia', village: 'Safidon', district: 'Jind', crop: 'Mustard' },
  ];

  const banks = [
    { name: 'State Bank of India', ifsc: 'SBIN0001428' },
    { name: 'Punjab National Bank', ifsc: 'PUNB0104200' },
    { name: 'HDFC Bank', ifsc: 'HDFC0001924' },
    { name: 'Canara Bank', ifsc: 'CNRB0002198' },
    { name: 'Bank of Baroda', ifsc: 'BARB0SIRSAX' },
  ];

  const farmerDocs = farmerNames.map((fn, idx) => {
    const pad = String(idx + 1).padStart(5, '0');
    const b = banks[idx % banks.length];
    return {
      name: fn.name,
      phone: `98765${pad}`,
      passwordHash,
      aadhaar: `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`,
      village: fn.village,
      district: fn.district,
      state: 'Haryana',
      preferredLanguage: idx % 6 === 0 ? 'te' : idx % 3 === 0 ? 'en' : 'hi',
      crops: [fn.crop, 'Mustard'],
      isVerified: true,
      bankDetails: {
        accountNo: `9182374${Math.floor(10000 + Math.random() * 90000)}`,
        ifsc: b.ifsc,
        bankName: b.name,
      },
    };
  });

  const farmers = await Farmer.insertMany(farmerDocs);
  console.log(`✓ Seeded ${farmers.length} Farmers across Haryana.`);

  // ==========================================
  // 4. SEED CROPS (2 per farmer = 70 crops)
  // ==========================================
  const mspTable = {
    Wheat: 2425,
    Mustard: 5650,
    Paddy: 2300,
    Cotton: 7122,
    Gram: 5440,
    Bajra: 2500,
    Barley: 1850,
  };

  const cropDocs = [];
  farmers.forEach((f, i) => {
    const primaryCrop = farmerNames[i].crop;
    cropDocs.push({
      farmerId: f._id,
      cropType: primaryCrop,
      variety: `${primaryCrop}-Certified-HYV`,
      estimatedQuantity: 30 + (i % 5) * 5,
      harvestSeason: 'Rabi 2026',
      mspPerQuintal: mspTable[primaryCrop] || 2425,
      landAreaAcres: 2.5 + (i % 4) * 1.2,
      status: 'verified',
    });

    if (primaryCrop !== 'Mustard') {
      cropDocs.push({
        farmerId: f._id,
        cropType: 'Mustard',
        variety: 'RH-725 Super',
        estimatedQuantity: 15 + (i % 3) * 4,
        harvestSeason: 'Rabi 2026',
        mspPerQuintal: 5650,
        landAreaAcres: 1.5,
        status: 'verified',
      });
    }
  });

  const crops = await Crop.insertMany(cropDocs);
  console.log(`✓ Seeded ${crops.length} Registered Crop Holdings.`);

  // ==========================================
  // 5. SEED SLOTS (Hourly windows for today & tomorrow across 5 centres)
  // ==========================================
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const slotTimes = [
    { start: '07:00', end: '08:00' },
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
  ];

  const slotDocs = [];
  for (const c of centres) {
    for (const d of [yesterday, todayStr, tomorrow]) {
      for (let s = 0; s < slotTimes.length; s++) {
        slotDocs.push({
          centreId: c._id,
          date: d,
          startTime: slotTimes[s].start,
          endTime: slotTimes[s].end,
          capacity: Math.floor(c.dailyCapacity / slotTimes.length),
          bookedCount: d === yesterday ? 6 : s < 3 ? 5 : 2,
          status: 'open',
        });
      }
    }
  }

  const slots = await Slot.insertMany(slotDocs);
  console.log(`✓ Seeded ${slots.length} Hourly Slots across 5 centres.`);

  // ==========================================
  // 6. SEED 100 BOOKINGS, TOKENS, PROCUREMENTS & PAYMENTS
  // ==========================================
  // Status Distribution:
  // - 50 'completed' (past & today, with Procurement & Payment)
  // - 15 'serving' (at weighbridges right now)
  // - 20 'checked_in' (in live queues with ordered queue positions)
  // - 12 'booked' (issued QR passes for upcoming slots)
  // - 3 'cancelled' / 'no_show'
  console.log('Generating 100 realistic bookings...');

  const bookingDocs = [];
  const tokenDocs = [];
  const procDocs = [];
  const payDocs = [];

  for (let i = 0; i < 100; i++) {
    const farmer = farmers[i % farmers.length];
    const centre = centres[i % centres.length];
    const cropType = farmerNames[i % farmerNames.length].crop || 'Wheat';
    const pricePerUnit = mspTable[cropType] || 2425;
    const estQty = 25 + (i % 8) * 5;

    let status = 'completed';
    let dateToUse = yesterday;
    let tokenStatus = 'served';

    if (i < 50) {
      status = 'completed';
      dateToUse = i < 30 ? yesterday : todayStr;
      tokenStatus = 'served';
    } else if (i < 65) {
      status = 'serving';
      dateToUse = todayStr;
      tokenStatus = 'being_served';
    } else if (i < 85) {
      status = 'checked_in';
      dateToUse = todayStr;
      tokenStatus = 'in_queue';
    } else if (i < 97) {
      status = 'booked';
      dateToUse = tomorrow;
      tokenStatus = 'issued';
    } else {
      status = i === 97 ? 'cancelled' : 'no_show';
      dateToUse = yesterday;
      tokenStatus = status;
    }

    const matchedSlot = slots.find(
      (s) => s.centreId.toString() === centre._id.toString() && s.date === dateToUse
    ) || slots[0];

    const centreCode = centre.name.slice(0, 3).toUpperCase();
    const tokenNumber = `${centreCode}-${dateToUse.replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`;

    const bookingId = new mongoose.Types.ObjectId();
    const qrData = await QRCode.toDataURL(JSON.stringify({
      token: tokenNumber,
      farmer: farmer.name,
      centre: centre.name,
      date: dateToUse,
    }));

    bookingDocs.push({
      _id: bookingId,
      farmerId: farmer._id,
      centreId: centre._id,
      slotId: matchedSlot._id,
      cropType,
      estimatedQuantity: estQty,
      tokenNumber,
      status,
      createdAt: new Date(Date.now() - (100 - i) * 60 * 60 * 1000),
    });

    const queuePos = tokenStatus === 'being_served' ? 0 : tokenStatus === 'in_queue' ? ((i - 65) % 8) + 1 : 0;
    tokenDocs.push({
      bookingId,
      centreId: centre._id,
      farmerId: farmer._id,
      tokenNumber,
      qrData,
      status: tokenStatus,
      queuePosition: queuePos,
      estimatedWaitMinutes: queuePos * 8,
      checkInTime: status !== 'booked' ? new Date(Date.now() - (100 - i) * 30 * 1000) : null,
      calledAt: tokenStatus === 'being_served' || tokenStatus === 'served' ? new Date() : null,
      completedAt: tokenStatus === 'served' ? new Date() : null,
      createdAt: new Date(Date.now() - (100 - i) * 60 * 60 * 1000),
    });

    // If completed, seed corresponding Procurement and DBT Payment record!
    if (status === 'completed') {
      const gross = estQty + 2.8;
      const tare = 2.8;
      const net = estQty;
      const rejected = (i % 7 === 0) ? 0.8 : 0;
      const accepted = net - rejected;
      const totalAmount = Math.round(accepted * pricePerUnit);

      const procId = new mongoose.Types.ObjectId();
      procDocs.push({
        _id: procId,
        bookingId,
        farmerId: farmer._id,
        centreId: centre._id,
        crop: cropType,
        grossWeight: gross,
        tareWeight: tare,
        netWeight: net,
        acceptedQuantity: accepted,
        rejectedQuantity: rejected,
        rejectionReason: rejected > 0 ? 'Moisture slightly exceeded 12%' : '',
        moisturePercentage: 11.2 + (i % 4) * 0.2,
        qualityGrade: (i % 5 === 0) ? 'Grade B' : 'Grade A',
        pricePerUnit,
        totalAmount,
        remarks: 'Produce verified & grade certified by mandi staff.',
        recordedBy: staff[i % 3]._id,
        createdAt: new Date(Date.now() - (100 - i) * 45 * 60 * 1000),
      });

      payDocs.push({
        procurementId: procId,
        farmerId: farmer._id,
        bookingId,
        centreId: centre._id,
        amount: totalAmount,
        status: 'completed',
        mode: 'DBT',
        transactionId: `DBT2026${String(Date.now()).slice(-6)}${String(i).padStart(3, '0')}`,
        bankAccountMasked: `XXXX-XXXX-${farmer.bankDetails.accountNo.slice(-4)}`,
        bankIfsc: farmer.bankDetails.ifsc,
        disbursedAt: new Date(Date.now() - (100 - i) * 30 * 60 * 1000),
        createdAt: new Date(Date.now() - (100 - i) * 40 * 60 * 1000),
      });
    }
  }

  await Booking.insertMany(bookingDocs);
  await Token.insertMany(tokenDocs);
  await Procurement.insertMany(procDocs);
  await Payment.insertMany(payDocs);

  console.log(`✓ Seeded ${bookingDocs.length} Bookings.`);
  console.log(`✓ Seeded ${tokenDocs.length} Tokens with QR Passes.`);
  console.log(`✓ Seeded ${procDocs.length} Procurement Weighbridge Records.`);
  console.log(`✓ Seeded ${payDocs.length} Direct Benefit Transfer (DBT) Payments.`);

  // Calculate and log grand total stats
  const totalVolume = procDocs.reduce((acc, p) => acc + p.acceptedQuantity, 0);
  const totalDisbursed = payDocs.reduce((acc, p) => acc + p.amount, 0);
  console.log(`📊 Grand Statewide Total Procured: ${totalVolume.toFixed(2)} Quintals (~${(totalVolume / 10).toFixed(1)} MT)`);
  console.log(`💰 Grand Statewide DBT Disbursed: ₹${totalDisbursed.toLocaleString('en-IN')}`);

  // Seed sample initial notifications
  await Notification.insertMany([
    {
      recipientId: farmers[0]._id,
      recipientModel: 'Farmer',
      title: '💰 DBT Payment Credited!',
      message: `₹84,875 has been credited to your bank account (${farmers[0].bankDetails.accountNo}). Ref: DBT202619082`,
      type: 'PAYMENT_COMPLETE',
      channel: 'all',
      read: false,
    },
    {
      recipientId: farmers[1]._id,
      recipientModel: 'Farmer',
      title: '🚨 Token Called to Weighbridge',
      message: 'Your produce token is now being served at Gate 1 Weighbridge.',
      type: 'TOKEN_NEAR',
      channel: 'all',
      read: false,
    },
    {
      recipientId: farmers[2]._id,
      recipientModel: 'Farmer',
      title: '🌾 Slot Confirmed',
      message: 'Your slot for Wheat procurement has been confirmed for 09:00 AM.',
      type: 'SLOT_CONFIRMED',
      channel: 'all',
      read: true,
    },
  ]);

  console.log('=== Database Seeding Complete & Verified ===');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
