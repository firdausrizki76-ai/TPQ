import { whatsappUrl } from '../utils/whatsapp';
import { useState } from 'react';

export default function WhatsAppLink({ santri, message, label = 'WA', enabled = true, refresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const url = enabled ? whatsappUrl(santri, message) : null;
  const handleClick = async event => {
    if (!refresh) return;
    event.preventDefault();
    if (loading) return;
    const popup = window.open('about:blank', '_blank');
    if (!popup) { setError('Izinkan pop-up untuk membuka WhatsApp.'); return; }
    popup.opener = null;
    setLoading(true); setError('');
    try {
      const latest = await refresh();
      const latestUrl = whatsappUrl(latest.santri, latest.message);
      if (!latestUrl) throw new Error('Nomor HP wali belum tersedia atau tidak valid');
      popup.location.href = latestUrl;
    } catch (e) { popup.close(); setError(e.message); }
    finally { setLoading(false); }
  };
  return url ? <span><a className="wa-button" href={url} onClick={handleClick} target="_blank" rel="noopener noreferrer" title="Buka pesan WhatsApp untuk wali" aria-busy={loading}>{loading ? 'Memuat…' : label}</a>{error && <span role="alert" className="text-xs text-red-600">{error}</span>}</span>
    : <span className="wa-button" aria-disabled="true" title={enabled ? 'Nomor HP wali/ayah/ibu belum tersedia atau tidak valid' : 'Pemberitahuan hanya untuk kenaikan yang lulus'}>{label}</span>;
}
