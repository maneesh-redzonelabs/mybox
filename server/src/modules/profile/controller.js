const ApiError = require('../../lib/ApiError');
const { isValidEmail, isValidDateString } = require('../../lib/validators');
const { mapUser } = require('../../lib/mappers');
const { signToken } = require('../../middleware/auth');
const repo = require('./repository');

function validateProfileInput({ name, email, dateOfBirth }) {
  const fields = {};
  if (!name || !String(name).trim()) fields.name = 'Name is required.';
  if (!isValidEmail(email)) fields.email = 'Please enter a valid email address.';
  if (dateOfBirth !== undefined && dateOfBirth !== null && dateOfBirth !== '' && !isValidDateString(dateOfBirth)) {
    fields.dateOfBirth = 'Date of birth must be a valid YYYY-MM-DD date.';
  }
  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', fields);
  }
}

async function createProfile(req, res, next) {
  try {
    const mobile = req.verifiedMobile;
    const { name, email, dateOfBirth } = req.body || {};
    validateProfileInput({ name, email, dateOfBirth });

    const existing = await repo.findByMobile(mobile);
    if (existing) {
      throw new ApiError(409, 'ALREADY_EXISTS', 'A profile already exists for this mobile number.');
    }

    const user = await repo.createUserWithSelfRow({
      mobile,
      name: String(name).trim(),
      email: String(email).trim(),
      dateOfBirth: dateOfBirth || null,
    });

    const token = signToken(user);
    res.status(201).json({ data: { token, user: mapUser(user) } });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await repo.findById(req.userId);
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'Profile not found.');
    res.status(200).json({ data: mapUser(user) });
  } catch (err) {
    next(err);
  }
}

async function putProfile(req, res, next) {
  try {
    const { name, email, dateOfBirth } = req.body || {};
    validateProfileInput({ name, email, dateOfBirth });

    const user = await repo.updateProfile(req.userId, {
      name: String(name).trim(),
      email: String(email).trim(),
      dateOfBirth: dateOfBirth || null,
    });

    res.status(200).json({ data: mapUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { createProfile, getProfile, putProfile };
