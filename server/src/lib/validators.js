const MOBILE_PATTERN = /^[0-9]{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RTO_REGNO_PATTERN = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

const RELATIONSHIP_OPTIONS = [
  'Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister',
  'Doughter-in-law', 'Son-in-law', 'Uncle', 'Aunt', 'Cousin Sister', 'Cousin Brother',
];

const POLICY_TYPE_OPTIONS = ['Life Insurance', 'Health Insurance'];
const EMI_FREQUENCY_OPTIONS = ['Monthly', 'Quaterly', 'Half Yearly', 'Yearly', 'Single Premium'];
const VEHICLE_TYPE_OPTIONS = ['Car', 'Bike', 'Scooty'];

const LIVING_TOGETHER_OPTIONS = ['Yes', 'No', 'NA'];

function isValidMobile(mobile) {
  return typeof mobile === 'string' && MOBILE_PATTERN.test(mobile);
}

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_PATTERN.test(email);
}

function isValidDateString(s) {
  if (!s || typeof s !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

function isValidRegNo(regNo) {
  return typeof regNo === 'string' && RTO_REGNO_PATTERN.test(regNo);
}

module.exports = {
  MOBILE_PATTERN,
  EMAIL_PATTERN,
  RTO_REGNO_PATTERN,
  RELATIONSHIP_OPTIONS,
  POLICY_TYPE_OPTIONS,
  EMI_FREQUENCY_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  LIVING_TOGETHER_OPTIONS,
  isValidMobile,
  isValidEmail,
  isValidDateString,
  isValidRegNo,
};
