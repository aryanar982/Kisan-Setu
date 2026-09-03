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
  // ==========================================
  // 1. SEED 10 UTTAR PRADESH PROCUREMENT CENTRES
  // ==========================================
  const centres = await Centre.insertMany([
    {
      name: 'Lucknow Procurement Centre',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      location: { lat: 26.8467, lng: 80.9462, address: 'Transport Nagar Mandi Yard, Lucknow, Uttar Pradesh 226012' },
      cropsAccepted: ['Wheat', 'Mustard', 'Bajra', 'Barley'],
      dailyCapacity: 50,
      contactPhone: '0522-224411',
      currentQueueCount: 4,
      averageWaitTimeMinutes: 18,
      activeStatus: true,
    },
    {
      name: 'Kanpur Procurement Centre',
      district: 'Kanpur',
      state: 'Uttar Pradesh',
      location: { lat: 26.4499, lng: 80.3319, address: 'Chakeri Grain Yard, Kanpur, Uttar Pradesh 208007' },
      cropsAccepted: ['Wheat', 'Paddy', 'Gram'],
      dailyCapacity: 40,
      contactPhone: '0512-231188',
      currentQueueCount: 2,
      averageWaitTimeMinutes: 12,
      activeStatus: true,
    },
    {
      name: 'Prayagraj Procurement Centre',
      district: 'Prayagraj',
      state: 'Uttar Pradesh',
      location: { lat: 25.4358, lng: 81.8463, address: 'Mundera Mandi Complex, Prayagraj, Uttar Pradesh 211011' },
      cropsAccepted: ['Wheat', 'Cotton', 'Mustard'],
      dailyCapacity: 45,
      contactPhone: '0532-220044',
      currentQueueCount: 8,
      averageWaitTimeMinutes: 28,
      activeStatus: true,
    },
    {
      name: 'Bareilly Procurement Centre',
      district: 'Bareilly',
      state: 'Uttar Pradesh',
      location: { lat: 28.3670, lng: 79.4304, address: 'Delapeer Mandi Samiti, Bareilly, Uttar Pradesh 243122' },
      cropsAccepted: ['Wheat', 'Mustard', 'Gram', 'Bajra'],
      dailyCapacity: 60,
      contactPhone: '0581-245599',
      currentQueueCount: 1,
      averageWaitTimeMinutes: 10,
      activeStatus: true,
    },
    {
      name: 'Gorakhpur Procurement Centre',
      district: 'Gorakhpur',
      state: 'Uttar Pradesh',
      location: { lat: 26.7606, lng: 83.3732, address: 'Mahewa Mandi Samiti, Gorakhpur, Uttar Pradesh 273001' },
      cropsAccepted: ['Wheat', 'Paddy', 'Mustard', 'Barley'],
      dailyCapacity: 55,
      contactPhone: '0551-225588',
      currentQueueCount: 3,
      averageWaitTimeMinutes: 15,
      activeStatus: true,
    },
    {
      name: 'Varanasi Procurement Centre',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      location: { lat: 25.3176, lng: 82.9739, address: 'Panchkroshi Mandi, Varanasi, Uttar Pradesh 221002' },
      cropsAccepted: ['Wheat', 'Paddy', 'Mustard'],
      dailyCapacity: 45,
      contactPhone: '0542-250123',
      currentQueueCount: 3,
      averageWaitTimeMinutes: 14,
      activeStatus: true,
    },
    {
      name: 'Agra Procurement Centre',
      district: 'Agra',
      state: 'Uttar Pradesh',
      location: { lat: 27.1767, lng: 78.0081, address: 'Sikandra Mandi Yard, Agra, Uttar Pradesh 282007' },
      cropsAccepted: ['Wheat', 'Mustard', 'Bajra'],
      dailyCapacity: 50,
      contactPhone: '0562-260456',
      currentQueueCount: 2,
      averageWaitTimeMinutes: 16,
      activeStatus: true,
    },
    {
      name: 'Meerut Procurement Centre',
      district: 'Meerut',
      state: 'Uttar Pradesh',
      location: { lat: 28.9845, lng: 77.7064, address: 'Delhi Road Mandi, Meerut, Uttar Pradesh 250002' },
      cropsAccepted: ['Wheat', 'Mustard', 'Sugarcane'],
      dailyCapacity: 55,
      contactPhone: '0121-240789',
      currentQueueCount: 4,
      averageWaitTimeMinutes: 20,
      activeStatus: true,
    },
    {
      name: 'Jhansi Procurement Centre',
      district: 'Jhansi',
      state: 'Uttar Pradesh',
      location: { lat: 25.4484, lng: 78.5685, address: 'Gwalior Road Mandi, Jhansi, Uttar Pradesh 284001' },
      cropsAccepted: ['Wheat', 'Gram', 'Mustard', 'Barley'],
      dailyCapacity: 40,
      contactPhone: '0510-230012',
      currentQueueCount: 1,
      averageWaitTimeMinutes: 11,
      activeStatus: true,
    },
    {
      name: 'Ayodhya Procurement Centre',
      district: 'Ayodhya',
      state: 'Uttar Pradesh',
      location: { lat: 26.7922, lng: 82.1998, address: 'Faizabad Bypass APMC Yard, Ayodhya, Uttar Pradesh 224001' },
      cropsAccepted: ['Wheat', 'Paddy', 'Mustard'],
      dailyCapacity: 45,
      contactPhone: '05278-223344',
      currentQueueCount: 2,
      averageWaitTimeMinutes: 13,
      activeStatus: true,
    },
  ]);
  console.log(`✓ Seeded ${centres.length} Uttar Pradesh Mandi Centres.`);

  // ==========================================
  // 2. SEED OFFICERS & ADMINS (UP MANDI PARISHAD)
  // ==========================================
  const staff = await Admin.insertMany([
    {
      name: 'Virender Singh (Mandi Officer)',
      email: 'officer.lucknow@kisansetu.gov.in',
      phone: '9876543210',
      passwordHash,
      role: 'centre_staff',
      centreId: centres[0]._id,
      district: 'Lucknow',
      state: 'Uttar Pradesh',
    },
    {
      name: 'Rajesh Sharma (Mandi Officer)',
      email: 'officer.kanpur@kisansetu.gov.in',
      phone: '9876543211',
      passwordHash,
      role: 'centre_staff',
      centreId: centres[1]._id,
      district: 'Kanpur',
      state: 'Uttar Pradesh',
    },
    {
      name: 'Kuldeep Bishnoi (Mandi Officer)',
      email: 'officer.prayagraj@kisansetu.gov.in',
      phone: '9876543214',
      passwordHash,
      role: 'centre_staff',
      centreId: centres[2]._id,
      district: 'Prayagraj',
      state: 'Uttar Pradesh',
    },
    {
      name: 'Dr. Sunita Deshmukh (District Collector / Admin)',
      email: 'admin.lucknow@kisansetu.gov.in',
      phone: '9876543212',
      passwordHash,
      role: 'district_admin',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
    },
    {
      name: 'Director, UP Mandi Parishad (UPMRP)',
      email: 'admin.up@kisansetu.gov.in',
      phone: '9876543213',
      passwordHash,
      role: 'state_admin',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
    },
  ]);
  console.log(`✓ Seeded ${staff.length} UP Mandi Parishad Officers and Admins.`);

  // ==========================================
  // 3. SEED 35 REALISTIC FARMERS ACROSS UP
  // ==========================================
  const farmerNames = [
    { name: 'Ramesh Kumar', village: 'Mohanlalganj', district: 'Lucknow', crop: 'Wheat' },
    { name: 'Suresh Patel', village: 'Bakshi Ka Talab', district: 'Lucknow', crop: 'Wheat' },
    { name: 'Harpreet Singh', village: 'Malihabad', district: 'Lucknow', crop: 'Mustard' },
    { name: 'Anita Devi', village: 'Gosainganj', district: 'Lucknow', crop: 'Wheat' },
    { name: 'Balwinder Singh', village: 'Bilhaur', district: 'Kanpur', crop: 'Paddy' },
    { name: 'Kuldeep Yadav', village: 'Ghatampur', district: 'Kanpur', crop: 'Wheat' },
    { name: 'Meena Kumari', village: 'Bithoor', district: 'Kanpur', crop: 'Gram' },
    { name: 'Jagdish Chand', village: 'Phaphamau', district: 'Prayagraj', crop: 'Cotton' },
    { name: 'Pooja Rani', village: 'Naini', district: 'Prayagraj', crop: 'Wheat' },
    { name: 'Satnam Singh', village: 'Soraon', district: 'Prayagraj', crop: 'Mustard' },
    { name: 'Devender Kumar', village: 'Aonla', district: 'Bareilly', crop: 'Wheat' },
    { name: 'Kavita Sharma', village: 'Faridpur', district: 'Bareilly', crop: 'Mustard' },
    { name: 'Rajendra Prasad', village: 'Baheri', district: 'Bareilly', crop: 'Bajra' },
    { name: 'Sunil Bishnoi', village: 'Nawabganj', district: 'Bareilly', crop: 'Wheat' },
    { name: 'Manjeet Kaur', village: 'Sahjanwa', district: 'Gorakhpur', crop: 'Paddy' },
    { name: 'Surinder Pal', village: 'Pipraich', district: 'Gorakhpur', crop: 'Wheat' },
    { name: 'Vikas Hooda', village: 'Campierganj', district: 'Gorakhpur', crop: 'Mustard' },
    { name: 'Pawan Malik', village: 'Bansgaon', district: 'Gorakhpur', crop: 'Wheat' },
    { name: 'Rekha Devi', village: 'Rohania', district: 'Varanasi', crop: 'Paddy' },
    { name: 'Mukesh Saini', village: 'Pindra', district: 'Varanasi', crop: 'Wheat' },
    { name: 'Jaswinder Singh', village: 'Sewapuri', district: 'Varanasi', crop: 'Wheat' },
    { name: 'Dharmendra Singh', village: 'Fatehabad UP', district: 'Agra', crop: 'Paddy' },
    { name: 'Geeta Devi', village: 'Kiraoli', district: 'Agra', crop: 'Wheat' },
    { name: 'Ashok Kumar', village: 'Etmadpur', district: 'Agra', crop: 'Mustard' },
    { name: 'Naresh Chahal', village: 'Sardhana', district: 'Meerut', crop: 'Wheat' },
    { name: 'Bhim Singh', village: 'Mawana', district: 'Meerut', crop: 'Gram' },
    { name: 'Santosh Devi', village: 'Hastinapur', district: 'Meerut', crop: 'Wheat' },
    { name: 'Rakesh Sharma', village: 'Babina', district: 'Jhansi', crop: 'Wheat' },
    { name: 'Deepak Verma', village: 'Mauranipur', district: 'Jhansi', crop: 'Mustard' },
    { name: 'Amarjeet Singh', village: 'Bhikapur', district: 'Ayodhya', crop: 'Wheat' },
    { name: 'Suman Lata', village: 'Sohawal', district: 'Ayodhya', crop: 'Paddy' },
    { name: 'Om Prakash', village: 'Rudauli', district: 'Ayodhya', crop: 'Wheat' },
    { name: 'Tarun Dahiya', village: 'Milkipur', district: 'Ayodhya', crop: 'Wheat' },
    { name: 'Anand Rathi', village: 'Kalyanpur', district: 'Kanpur', crop: 'Wheat' },
    { name: 'Praveen Punia', village: 'Chinhat', district: 'Lucknow', crop: 'Mustard' },
  ];

  const banks = [
    { name: 'State Bank of India', ifsc: 'SBIN0001428' },
    { name: 'Punjab National Bank', ifsc: 'PUNB0104200' },
    { name: 'HDFC Bank', ifsc: 'HDFC0001924' },
    { name: 'Canara Bank', ifsc: 'CNRB0002198' },
    { name: 'Bank of Baroda', ifsc: 'BARB0LUCKNO' },
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
      state: 'Uttar Pradesh',
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
  console.log(`✓ Seeded ${farmers.length} Farmers across Uttar Pradesh.`);

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
