/** "YYYY-MM-DD" -> "DD/MM/YYYY", ported from MyBox.html's formatDateDMY(). */
export function formatDateDMY(dob) {
  if (!dob) return '';
  const parts = dob.split('-');
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

/** today-based year diff, decrement if birthday hasn't occurred yet this year. */
export function calcAge(dob) {
  if (!dob) return '';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const beforeBirthdayThisYear =
    today.getMonth() < d.getMonth() ||
    (today.getMonth() === d.getMonth() && today.getDate() < d.getDate());
  if (beforeBirthdayThisYear) age--;
  return age >= 0 ? age : '';
}
