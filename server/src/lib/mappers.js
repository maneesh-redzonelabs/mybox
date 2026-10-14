function mapUser(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    mobile: row.mobile,
    name: row.name,
    email: row.email,
    dateOfBirth: row.date_of_birth || null,
  };
}

module.exports = { mapUser };
