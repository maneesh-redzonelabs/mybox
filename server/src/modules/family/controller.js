const ApiError = require('../../lib/ApiError');
const { RELATIONSHIP_OPTIONS, isValidMobile, isValidDateString } = require('../../lib/validators');
const repo = require('./repository');

function validateMembers(members) {
  for (const m of members) {
    if (m.relationship === 'Self') {
      throw new ApiError(400, 'SELF_ROW_LOCKED', 'The Self row is managed automatically and cannot be edited, removed, or duplicated from this endpoint.');
    }
  }

  const fieldErrors = [];
  for (const m of members) {
    if (!m.name || !String(m.name).trim()) {
      fieldErrors.push('Please enter a name for every family member row.');
    }
    if (!m.relationship || !RELATIONSHIP_OPTIONS.includes(m.relationship)) {
      fieldErrors.push(`Please select a valid relationship for ${m.name || 'this row'}.`);
    }
    if (!m.livingTogether || !['Yes', 'No'].includes(m.livingTogether)) {
      fieldErrors.push(`Please select "Living Together" (Yes/No) for ${m.name || 'this row'}.`);
    }
    if (m.mobile && !isValidMobile(m.mobile)) {
      fieldErrors.push(`Please enter a valid 10-digit mobile number for ${m.name || 'this row'}, or leave it blank.`);
    }
    if (m.dateOfBirth && !isValidDateString(m.dateOfBirth)) {
      fieldErrors.push(`Please enter a valid date of birth for ${m.name || 'this row'}.`);
    }
  }
  if (fieldErrors.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', fieldErrors[0], { rows: fieldErrors });
  }
}

async function getFamilyMembers(req, res, next) {
  try {
    const list = await repo.list(req.userId);
    res.status(200).json({ data: list });
  } catch (err) {
    next(err);
  }
}

async function putFamilyMembers(req, res, next) {
  try {
    const members = Array.isArray((req.body || {}).familyMembers) ? req.body.familyMembers : null;
    if (!members) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'familyMembers must be an array.');
    }

    validateMembers(members);

    const updated = await repo.bulkReplace(req.userId, members);
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFamilyMembers, putFamilyMembers };
