/**
 * Ports of the date/business-logic helpers from MyBox.html, operating on 'YYYY-MM-DD'
 * strings / Date objects exactly as the prototype does.
 */

function toDateOnlyString(d) {
  return d.toISOString().slice(0, 10);
}

/** today-based year diff, decrement if birthday hasn't occurred yet this year. */
function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const beforeBirthdayThisYear =
    today.getMonth() < d.getMonth() ||
    (today.getMonth() === d.getMonth() && today.getDate() < d.getDate());
  if (beforeBirthdayThisYear) age--;
  return age >= 0 ? age : null;
}

/** startDate + policyTermYears calendar years. */
function calcMaturityDate(startDate, policyTermYears) {
  if (!startDate || !policyTermYears) return null;
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + Number(policyTermYears));
  return toDateOnlyString(d);
}

const MONTHS_PER_CYCLE = {
  Monthly: 1,
  Quaterly: 3,
  'Half Yearly': 6,
  Yearly: 12,
};

/**
 * "Single Premium" -> null. Else roll startDate forward by the EMI cycle (in months)
 * repeatedly until it lands on/after today (midnight-normalized).
 */
function calcNextPremiumDate(startDate, emiFrequency) {
  if (!startDate || !emiFrequency) return null;
  if (emiFrequency === 'Single Premium') return null;

  const interval = MONTHS_PER_CYCLE[emiFrequency];
  if (!interval) return null;

  let dueDate = new Date(startDate);
  if (isNaN(dueDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (dueDate < today) {
    dueDate.setMonth(dueDate.getMonth() + interval);
  }

  return toDateOnlyString(dueDate);
}

module.exports = { calcAge, calcMaturityDate, calcNextPremiumDate };
