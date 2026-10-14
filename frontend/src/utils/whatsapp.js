export function normalizePhone(value) {
  let phone = String(value || '').replace(/\D/g, '');
  if (phone.startsWith('00')) phone = phone.slice(2);
  if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
  else if (phone.startsWith('8')) phone = `62${phone}`;
  return /^\d{10,15}$/.test(phone) ? phone : null;
}

export function guardianPhone(santri) {
  return [santri?.no_hp_wali, santri?.no_hp_ayah, santri?.no_hp_ibu].map(normalizePhone).find(Boolean) || null;
}

export function whatsappUrl(santri, message) {
  const phone = guardianPhone(santri);
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;
}

export function balanceMessage(santri) {
  return `Assalamu'alaikum Bapak/Ibu wali ${santri.nama_lengkap}.\nSaldo tabungan terakhir ${santri.nama_lengkap} (NIS: ${santri.nomor_induk}) per ${new Date().toLocaleDateString('id-ID')} adalah Rp ${Number(santri.saldo || 0).toLocaleString('id-ID')}.\nTerima kasih.\nTPQ Anfak Al Azizah`;
}

export function promotionMessage(record) {
  return `Assalamu'alaikum Bapak/Ibu wali ${record.santri?.nama_lengkap}.\nAlhamdulillah, ${record.santri?.nama_lengkap} telah naik dari ${record.kelas_dari?.nama_kelas || 'jenjang sebelumnya'} ke ${record.kelas_ke?.nama_kelas} pada ${new Date(`${record.tanggal_naik}T12:00:00`).toLocaleDateString('id-ID')}.\nSemoga semakin semangat belajar.\nTPQ Anfak Al Azizah`;
}
