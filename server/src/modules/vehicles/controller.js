const ApiError = require('../../lib/ApiError');
const { VEHICLE_TYPE_OPTIONS, isValidRegNo } = require('../../lib/validators');
const repo = require('./repository');

const CURRENT_YEAR = new Date().getFullYear();

function validateVehicles(vehicles) {
  const errors = [];
  const seenRegNos = new Set();

  for (const v of vehicles) {
    if (!v.registrationNo || !String(v.registrationNo).trim()) {
      errors.push('Please enter a registration number for every vehicle row.');
      continue;
    }
    const regNo = String(v.registrationNo).trim().toUpperCase();
    if (!isValidRegNo(regNo)) {
      errors.push(`Please enter a valid Indian RTO registration number for ${v.registrationNo} (e.g. MH12AB1234).`);
      continue;
    }
    if (seenRegNos.has(regNo)) {
      throw new ApiError(409, 'DUPLICATE_REG_NO', `Registration number ${regNo} is repeated in your list.`);
    }
    seenRegNos.add(regNo);

    if (!v.vehicleType || !VEHICLE_TYPE_OPTIONS.includes(v.vehicleType)) {
      errors.push(`Please select a vehicle type for ${regNo}.`);
    }
    if (!v.make || !String(v.make).trim()) {
      errors.push(`Please enter the make for ${regNo}.`);
    }
    const modelYear = Number(v.modelYear);
    if (!Number.isInteger(modelYear) || modelYear < 1990 || modelYear > CURRENT_YEAR + 1) {
      errors.push(`Please select a valid model year for ${regNo}.`);
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', errors[0], { rows: errors });
  }
}

async function getVehicles(req, res, next) {
  try {
    const list = await repo.list(req.userId);
    res.status(200).json({ data: list });
  } catch (err) {
    next(err);
  }
}

async function putVehicles(req, res, next) {
  try {
    const vehicles = Array.isArray((req.body || {}).vehicles) ? req.body.vehicles : null;
    if (!vehicles) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'vehicles must be an array.');
    }

    const normalized = vehicles.map((v) => ({
      ...v,
      registrationNo: v.registrationNo ? String(v.registrationNo).trim().toUpperCase() : v.registrationNo,
    }));

    validateVehicles(normalized);

    const updated = await repo.bulkReplace(req.userId, normalized);
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getVehicles, putVehicles };
