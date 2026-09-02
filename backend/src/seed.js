const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const env = require('./config/env');
const Farmer = require('./models/Farmer');
const Centre = require('./models/Centre');
const Admin = require('./models/Admin');
const Slot = require('./models/Slot');
const Booking = require('./models/Booking');
const Token = require('./models/Token');
const Crop = require('./models/Crop');
const Procurement = require('./models/Procurement');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');

const SALT_ROUNDS = 10;

async function seed() {
  console.log('Connecting to MongoDB for seeding...');
  await mongoose.connect(env.mongoUri);
  console.log('Connected to MongoDB.');

  // Clear existing collections
  await Promise.all([
    Farmer.deleteMany({}),
    Centre.deleteMany({}),
    Admin.deleteMany({}),
    Slot.deleteMany({}),
    Booking.deleteMany({}),
    Token.deleteMany({}),
    Crop.deleteMany({}),
    Procurement.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('Cleared existing collections.');

  const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);

  // 1. Seed Procurement Centres
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
  ]);

  console.log(`Created ${centres.length} centres.`);

  // 2. Seed Officers and Admins
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

  console.log(`Created ${staff.length} staff & admin users.`);

  // 3. Seed Farmers
  const farmers = await Farmer.insertMany([
    {
      name: 'Ramesh Kumar',
      phone: '9876500001',
      passwordHash,
      aadhaar: 'XXXX-XXXX-4821',
      village: 'Bhavdin',
      district: 'Sirsa',
      state: 'Haryana',
      preferredLanguage: 'hi',
      crops: ['Wheat', 'Mustard'],
      bankDetails: { accountNo: '918237461298', ifsc: 'SBIN0001428', bankName: 'State Bank of India' },
      isVerified: true,
    },
    {
      name: 'Suresh Patel',
      phone: '9876500002',
      passwordHash,
      aadhaar: 'XXXX-XXXX-9912',
      village: 'Ding',
      district: 'Sirsa',
      state: 'Haryana',
      preferredLanguage: 'hi',
      crops: ['Wheat', 'Cotton'],
      bankDetails: { accountNo: '887213459102', ifsc: 'PUNB0023400', bankName: 'Punjab National Bank' },
      isVerified: true,
    },
    {
      name: 'Harpreet Singh',
      phone: '9876500003',
      passwordHash,
      aadhaar: 'XXXX-XXXX-6104',
      village: 'Kalanwali',
      district: 'Sirsa',
      state: 'Haryana',
      preferredLanguage: 'en',
      crops: ['Paddy', 'Wheat'],
      bankDetails: { accountNo: '772349102384', ifsc: 'HDFC0000123', bankName: 'HDFC Bank' },
      isVerified: true,
    },
    {
      name: 'Anita Devi',
      phone: '9876500004',
      passwordHash,
      aadhaar: 'XXXX-XXXX-7734',
      village: 'Rania',
      district: 'Sirsa',
      state: 'Haryana',
      preferredLanguage: 'hi',
      crops: ['Mustard', 'Wheat'],
      bankDetails: { accountNo: '661294810239', ifsc: 'BARB0SIRSAX', bankName: 'Bank of Baroda' },
      isVerified: true,
    },
  ]);

  console.log(`Created ${farmers.length} farmers.`);

  // 4. Seed Crops
  await Crop.insertMany([
    {
      farmerId: farmers[0]._id,
      cropType: 'Wheat',
      variety: 'PBW-502 High Yield',
      estimatedQuantity: 45,
      harvestSeason: 'Rabi 2026',
      mspPerQuintal: 2425,
      landAreaAcres: 4,
    },
    {
      farmerId: farmers[0]._id,
      cropType: 'Mustard',
      variety: 'Pusa Bold',
      estimatedQuantity: 15,
      harvestSeason: 'Rabi 2026',
      mspPerQuintal: 5650,
      landAreaAcres: 2,
    },
    {
      farmerId: farmers[1]._id,
      cropType: 'Wheat',
      variety: 'Sharbati Premium',
      estimatedQuantity: 60,
      harvestSeason: 'Rabi 2026',
      mspPerQuintal: 2425,
      landAreaAcres: 5.5,
    },
    {
      farmerId: farmers[2]._id,
      cropType: 'Paddy',
      variety: 'Basmati 1121',
      estimatedQuantity: 50,
      harvestSeason: 'Kharif 2026',
      mspPerQuintal: 2300,
      landAreaAcres: 4.5,
    },
  ]);

  // 5. Seed Slots for Today and Tomorrow for each centre
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

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

  const allSlots = [];
  for (const c of centres) {
    for (const date of [todayStr, tomorrowStr]) {
      for (let i = 0; i < slotTimes.length; i++) {
        const booked = i === 1 ? 6 : i === 2 ? 4 : i === 0 ? 3 : 1;
        allSlots.push({
          centreId: c._id,
          date,
          startTime: slotTimes[i].start,
          endTime: slotTimes[i].end,
          capacity: Math.floor(c.dailyCapacity / 6),
          bookedCount: booked,
          status: 'open',
        });
      }
    }
  }

  const createdSlots = await Slot.insertMany(allSlots);
  console.log(`Created ${createdSlots.length} slots.`);

  // 6. Seed Bookings & Tokens for Sirsa centre (to demo live queue immediately)
  const sirsaSlot = createdSlots.find((s) => s.centreId.toString() === centres[0]._id.toString() && s.date === todayStr);

  const booking1 = await Booking.create({
    farmerId: farmers[0]._id,
    centreId: centres[0]._id,
    slotId: sirsaSlot._id,
    cropType: 'Wheat',
    estimatedQuantity: 40,
    tokenNumber: 'SIR-20260902-001',
    status: 'completed',
  });

  const qr1 = await QRCode.toDataURL(JSON.stringify({ token: 'SIR-20260902-001', farmer: farmers[0].name }));
  await Token.create({
    bookingId: booking1._id,
    centreId: centres[0]._id,
    farmerId: farmers[0]._id,
    tokenNumber: 'SIR-20260902-001',
    qrData: qr1,
    status: 'served',
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    completedAt: new Date(),
  });

  // Seed Procurement & Payment for Booking 1
  const proc1 = await Procurement.create({
    bookingId: booking1._id,
    farmerId: farmers[0]._id,
    centreId: centres[0]._id,
    crop: 'Wheat',
    grossWeight: 42.5,
    tareWeight: 2.5,
    netWeight: 40.0,
    acceptedQuantity: 39.2,
    rejectedQuantity: 0.8,
    rejectionReason: 'Moisture content above 12%',
    moisturePercentage: 11.2,
    qualityGrade: 'Grade A',
    pricePerUnit: 2425,
    totalAmount: 95060,
    remarks: 'Grain quality certified Grade A',
    recordedBy: staff[0]._id,
  });

  await Payment.create({
    procurementId: proc1._id,
    farmerId: farmers[0]._id,
    bookingId: booking1._id,
    centreId: centres[0]._id,
    amount: 95060,
    status: 'completed',
    mode: 'DBT',
    transactionId: 'DBT2026090218842',
    bankAccountMasked: 'XXXX-XXXX-1298',
    bankIfsc: 'SBIN0001428',
    disbursedAt: new Date(),
  });

  // Seed Currently Serving Farmer (Suresh Patel)
  const booking2 = await Booking.create({
    farmerId: farmers[1]._id,
    centreId: centres[0]._id,
    slotId: sirsaSlot._id,
    cropType: 'Wheat',
    estimatedQuantity: 30,
    tokenNumber: 'SIR-20260902-002',
    status: 'checked_in',
  });

  const qr2 = await QRCode.toDataURL(JSON.stringify({ token: 'SIR-20260902-002', farmer: farmers[1].name }));
  await Token.create({
    bookingId: booking2._id,
    centreId: centres[0]._id,
    farmerId: farmers[1]._id,
    tokenNumber: 'SIR-20260902-002',
    qrData: qr2,
    status: 'being_served',
    queuePosition: 0,
    estimatedWaitMinutes: 2,
    calledAt: new Date(),
    checkInTime: new Date(Date.now() - 20 * 60 * 1000),
  });

  // Seed In-Queue Farmer (Harpreet Singh)
  const booking3 = await Booking.create({
    farmerId: farmers[2]._id,
    centreId: centres[0]._id,
    slotId: sirsaSlot._id,
    cropType: 'Wheat',
    estimatedQuantity: 50,
    tokenNumber: 'SIR-20260902-003',
    status: 'checked_in',
  });

  const qr3 = await QRCode.toDataURL(JSON.stringify({ token: 'SIR-20260902-003', farmer: farmers[2].name }));
  await Token.create({
    bookingId: booking3._id,
    centreId: centres[0]._id,
    farmerId: farmers[2]._id,
    tokenNumber: 'SIR-20260902-003',
    qrData: qr3,
    status: 'in_queue',
    queuePosition: 1,
    estimatedWaitMinutes: 8,
    checkInTime: new Date(Date.now() - 10 * 60 * 1000),
  });

  // Seed In-Queue Farmer (Anita Devi)
  const booking4 = await Booking.create({
    farmerId: farmers[3]._id,
    centreId: centres[0]._id,
    slotId: sirsaSlot._id,
    cropType: 'Mustard',
    estimatedQuantity: 15,
    tokenNumber: 'SIR-20260902-004',
    status: 'booked',
  });

  const qr4 = await QRCode.toDataURL(JSON.stringify({ token: 'SIR-20260902-004', farmer: farmers[3].name }));
  await Token.create({
    bookingId: booking4._id,
    centreId: centres[0]._id,
    farmerId: farmers[3]._id,
    tokenNumber: 'SIR-20260902-004',
    qrData: qr4,
    status: 'issued',
    queuePosition: 2,
    estimatedWaitMinutes: 16,
  });

  // 7. Seed Notifications
  await Notification.insertMany([
    {
      recipientId: farmers[0]._id,
      recipientModel: 'Farmer',
      title: '💰 DBT Payment Credited!',
      message: '₹95,060 credited to account XXXX-XXXX-1298 (SBI). Ref: DBT2026090218842',
      type: 'PAYMENT_COMPLETE',
      channel: 'all',
      read: false,
    },
    {
      recipientId: farmers[1]._id,
      recipientModel: 'Farmer',
      title: '🚨 Token Called',
      message: 'Your token SIR-20260902-002 is now being served at Gate 1!',
      type: 'QUEUE_STARTED',
      channel: 'all',
      read: false,
    },
    {
      recipientId: farmers[2]._id,
      recipientModel: 'Farmer',
      title: '⏳ Queue Progress Notice',
      message: '1 farmer ahead of you. Estimated wait time: 8 minutes.',
      type: 'TOKEN_NEAR',
      channel: 'all',
      read: false,
    },
  ]);

  console.log('Seed completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
