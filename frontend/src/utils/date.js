export function dateInputValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDuration(minutes) {
  if (minutes == null) return 'Belum lengkap';
  return `${Math.floor(minutes / 60)} jam ${minutes % 60} menit`;
}
