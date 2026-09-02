const Token = require('../models/Token');
const Booking = require('../models/Booking');
const Centre = require('../models/Centre');
const { getIO } = require('../sockets/queue.socket');

const AVG_SERVICE_MINS = 8;

async function getCentreQueue(centreId) {
  const tokens = await Token.find({
    centreId,
    status: { $in: ['issued', 'checked_in', 'in_queue', 'being_served'] },
  })
    .populate({
      path: 'bookingId',
      populate: { path: 'farmerId slotId' },
    })
    .sort({ createdAt: 1 })
    .lean();

  // Find currently serving token
  const currentlyServing = tokens.find((t) => t.status === 'being_served') || null;

  // Re-calculate dynamic wait time & live position for each
  let position = 1;
  const queueWithEta = tokens.map((token) => {
    let currentPosition = position;
    let estimatedWaitMinutes = 0;

    if (token.status === 'being_served') {
      currentPosition = 0;
      estimatedWaitMinutes = 2; // Almost complete
    } else {
      estimatedWaitMinutes = position * AVG_SERVICE_MINS;
      position += 1;
    }

    return {
      ...token,
      queuePosition: currentPosition,
      estimatedWaitMinutes,
    };
  });

  return {
    currentlyServing,
    waitingCount: tokens.filter((t) => t.status !== 'being_served').length,
    averageWaitTimeMinutes: AVG_SERVICE_MINS,
    tokens: queueWithEta,
  };
}

async function verifyToken(tokenNumber, centreId) {
  const query = { tokenNumber: tokenNumber.trim() };
  if (centreId) query.centreId = centreId;

  const token = await Token.findOne(query)
    .populate({
      path: 'bookingId',
      populate: { path: 'farmerId slotId' },
    })
    .populate('centreId');

  if (!token) {
    const err = new Error(`Token ${tokenNumber} not found`);
    err.status = 404;
    throw err;
  }

  // If newly arrived, mark as checked_in
  if (token.status === 'issued') {
    token.status = 'checked_in';
    token.checkInTime = new Date();
    await token.save();

    await Booking.findByIdAndUpdate(token.bookingId._id, { status: 'checked_in' });

    emitQueueUpdate(token.centreId._id || token.centreId);
  }

  return token;
}

async function callNextToken(centreId) {
  // Mark any currently serving token as served or finished if not already done
  const activeCurrent = await Token.findOne({ centreId, status: 'being_served' });

  // Find next waiting token (checked_in or in_queue or issued)
  const nextToken = await Token.findOne({
    centreId,
    status: { $in: ['checked_in', 'in_queue', 'issued'] },
  })
    .sort({ createdAt: 1 })
    .populate({
      path: 'bookingId',
      populate: { path: 'farmerId' },
    });

  if (!nextToken) {
    return { message: 'No more farmers waiting in queue', currentlyServing: null };
  }

  nextToken.status = 'being_served';
  nextToken.calledAt = new Date();
  nextToken.serviceStartTime = new Date();
  await nextToken.save();

  // Update centre active queue count
  const remainingCount = await Token.countDocuments({
    centreId,
    status: { $in: ['checked_in', 'in_queue', 'issued'] },
  });
  await Centre.findByIdAndUpdate(centreId, { currentQueueCount: remainingCount });

  // Broadcast to centre and farmer rooms
  emitTokenCalled(nextToken);
  emitQueueUpdate(centreId);

  return nextToken;
}

async function updateTokenStatus(tokenId, status, remarks) {
  const token = await Token.findById(tokenId).populate('bookingId');
  if (!token) {
    const err = new Error('Token not found');
    err.status = 404;
    throw err;
  }

  token.status = status;
  if (status === 'served') {
    token.completedAt = new Date();
  }
  await token.save();

  if (status === 'served' && token.bookingId) {
    await Booking.findByIdAndUpdate(token.bookingId._id, { status: 'completed' });
  } else if (status === 'no_show' && token.bookingId) {
    await Booking.findByIdAndUpdate(token.bookingId._id, { status: 'no_show' });
  }

  emitQueueUpdate(token.centreId);
  return token;
}

function emitQueueUpdate(centreId) {
  try {
    const io = getIO();
    getCentreQueue(centreId).then((queue) => {
      io.to(`centre:${centreId}:queue`).emit('queueUpdated', queue);
    });
  } catch (e) {
    // Socket not ready
  }
}

function emitTokenCalled(token) {
  try {
    const io = getIO();
    const farmerId = token.bookingId && token.bookingId.farmerId ? token.bookingId.farmerId._id : token.farmerId;
    if (farmerId) {
      io.to(`farmer:${farmerId}:token`).emit('yourTokenCalled', {
        tokenNumber: token.tokenNumber,
        calledAt: token.calledAt,
        message: `Your token ${token.tokenNumber} is now being served! Please proceed to the procurement desk.`,
      });
    }
  } catch (e) {
    // Socket not ready
  }
}

module.exports = {
  getCentreQueue,
  verifyToken,
  callNextToken,
  updateTokenStatus,
  emitQueueUpdate,
};
