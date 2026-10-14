const ApiError = require('../../lib/ApiError');
const { POLICY_TYPE_OPTIONS, EMI_FREQUENCY_OPTIONS, isValidDateString } = require('../../lib/validators');
const repo = require('./repository');

function validatePolicies(policies) {
  const errors = [];
  const seenPolicyNos = new Set();

  for (const p of policies) {
    if (!p.policyNo || !String(p.policyNo).trim()) {
      errors.push('Please enter a policy number for every policy row.');
      continue;
    }
    const key = String(p.policyNo).trim();
    if (seenPolicyNos.has(key)) {
      throw new ApiError(409, 'DUPLICATE_POLICY_NO', `Policy number ${key} is repeated in your list.`);
    }
    seenPolicyNos.add(key);

    if (!p.bankName || !String(p.bankName).trim()) {
      errors.push(`Please enter a bank name for policy ${p.policyNo}.`);
    }
    if (!p.policyType || !POLICY_TYPE_OPTIONS.includes(p.policyType)) {
      errors.push(`Please select a valid policy type for ${p.policyNo}.`);
    }
    if (!p.startDate || !isValidDateString(p.startDate)) {
      errors.push(`Please select a valid start date for ${p.policyNo}.`);
    }
    if (!Number.isInteger(Number(p.policyTermYears)) || p.policyTermYears < 1 || p.policyTermYears > 60) {
      errors.push(`Please enter a policy term between 1 and 60 years for ${p.policyNo}.`);
    }
    if (!Number.isInteger(Number(p.payingTermYears)) || p.payingTermYears < 1 || p.payingTermYears > 60) {
      errors.push(`Please enter a paying term between 1 and 60 years for ${p.policyNo}.`);
    }
    if (!p.emiFrequency || !EMI_FREQUENCY_OPTIONS.includes(p.emiFrequency)) {
      errors.push(`Please select a valid EMI frequency for ${p.policyNo}.`);
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', errors[0], { rows: errors });
  }
}

async function getPolicies(req, res, next) {
  try {
    const list = await repo.list(req.userId);
    res.status(200).json({ data: list });
  } catch (err) {
    next(err);
  }
}

async function putPolicies(req, res, next) {
  try {
    const policies = Array.isArray((req.body || {}).policies) ? req.body.policies : null;
    if (!policies) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'policies must be an array.');
    }

    validatePolicies(policies);

    const updated = await repo.bulkReplace(req.userId, policies);
    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPolicies, putPolicies };
