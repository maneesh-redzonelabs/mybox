export const MOBILE_PATTERN = /^[0-9]{10}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const RTO_REGNO_PATTERN = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

export const RELATIONSHIP_OPTIONS = [
  'Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister',
  'Doughter-in-law', 'Son-in-law', 'Uncle', 'Aunt', 'Cousin Sister', 'Cousin Brother',
];

export const POLICY_TYPE_OPTIONS = ['Life Insurance', 'Health Insurance'];
export const EMI_FREQUENCY_OPTIONS = ['Monthly', 'Quaterly', 'Half Yearly', 'Yearly', 'Single Premium'];
export const VEHICLE_TYPE_OPTIONS = ['Car', 'Bike', 'Scooty'];

export const VEHICLE_MAKE_OPTIONS = [
  'Maruti Suzuki', 'Hyundai', 'Tata Motors', 'Mahindra & Mahindra', 'Kia',
  'Toyota Kirloskar', 'Honda Cars India', 'Honda Motorcycle & Scooter India (HMSI)',
  'Renault India', 'Nissan Motor India',
  'Volkswagen India', 'Skoda Auto India', 'MG Motor India', 'Citroen India',
  'Jeep India', 'Force Motors', 'Premier Limited', 'BYD India',
  'Hero MotoCorp', 'Bajaj Auto', 'TVS Motor Company', 'Royal Enfield',
  'Yamaha Motor India', 'Suzuki Motorcycle India', 'KTM India',
  'Harley-Davidson India', 'Ather Energy', 'Ola Electric', 'Okinawa Autotech',
  'Ashok Leyland', 'Eicher Motors',
];

export function getVehicleModelYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= 1990; y--) {
    years.push(y);
  }
  return years;
}

export function isValidMobile(mobile) {
  return typeof mobile === 'string' && MOBILE_PATTERN.test(mobile);
}

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_PATTERN.test(email);
}

export function isValidRegNo(regNo) {
  return typeof regNo === 'string' && RTO_REGNO_PATTERN.test(regNo);
}
