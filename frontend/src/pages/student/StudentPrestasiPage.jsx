import React, { useState, useEffect } from 'react';
import { 
  Award, BookOpen, Calendar, CheckCircle2, Star, 
  Sparkles, Loader2, Printer, ChevronRight, Bookmark
} from 'lucide-react';
import { prestasiAPI } from '../../services/api';

const StudentPrestasiPage = () => {
  const [records, setRecords] = useState([]);
  const [rapotData, setRapotData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('semua');
  const [showRapotModal, setShowRapotModal] = useState(false);

  const student = JSON.parse(localStorage.getItem('tpq_user') || '{}');

  useEffect(() => {
    if (student?.id) {
      loadData();
    }
  }, [student?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, rapot] = await Promise.all([
        prestasiAPI.getAll({ santri_id: student.id }),
        prestasiAPI.getRapot(student.id)
      ]);
      setRecords(list || []);
      setRapotData(rapot || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    if (filterCat === 'semua') return true;
    return r.kategori === filterCat;
  });

  return (
    <div style={{ padding: '16px' }} className="space-y-4">
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        color: 'white',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(6, 78, 59, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>
              <Sparkles size={14} /> Prestasi & Mutaba'ah
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
              Capaian Belajar Santri
            </h1>
            <p style={{ fontSize: '12px', color: '#a7f3d0', margin: '4px 0 0 0' }}>
              {student.nama_lengkap} &bull; NIS: {student.nomor_induk}
            </p>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            width: '46px',
            height: '46px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24'
          }}>
            <Award size={26} />
          </div>
        </div>

        {/* Ringkasan Capaian Terakhir */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginTop: '16px'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: '14px' }}>
            <span style={{ fontSize: '10px', color: '#a7f3d0', display: 'block', fontWeight: '600' }}>
              Qiraati Terakhir
            </span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff' }}>
              {rapotData?.lastQiraati ? rapotData.lastQiraati.jilid_surat : '-'}
            </span>
            <span style={{ fontSize: '10px', color: '#fef08a', display: 'block' }}>
              {rapotData?.lastQiraati?.halaman_ayat || ''}
            </span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: '14px' }}>
            <span style={{ fontSize: '10px', color: '#a7f3d0', display: 'block', fontWeight: '600' }}>
              Tahfidz Terakhir
            </span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff' }}>
              {rapotData?.lastTahfidz ? rapotData.lastTahfidz.jilid_surat : '-'}
            </span>
            <span style={{ fontSize: '10px', color: '#fef08a', display: 'block' }}>
              {rapotData?.lastTahfidz?.halaman_ayat || ''}
            </span>
          </div>
        </div>
      </div>

      {/* Button Cetak Rapot Prestasi */}
      <button
        type="button"
        onClick={() => setShowRapotModal(true)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '16px',
          backgroundColor: '#fffbeb',
          border: '1.5px solid #fde68a',
          color: '#92400e',
          fontWeight: 'bold',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={18} color="#b45309" />
          <span>Lihat & Cetak Rapot Prestasi Mandiri</span>
        </div>
        <ChevronRight size={16} />
      </button>

      {/* Filter Kategori */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { key: 'semua', label: 'Semua' },
          { key: 'Qiraati', label: 'Qiraati' },
          { key: 'Tahfidz', label: 'Tahfidz' },
          { key: 'Doa Harian', label: 'Doa' },
          { key: 'Hadits', label: 'Hadits' },
          { key: 'Adab & Akhlak', label: 'Akhlak' }
        ].map(cat => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setFilterCat(cat.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: filterCat === cat.key ? '1px solid #059669' : '1px solid #e2e8f0',
              backgroundColor: filterCat === cat.key ? '#059669' : '#ffffff',
              color: filterCat === cat.key ? '#ffffff' : '#64748b',
              fontSize: '11px',
              fontWeight: filterCat === cat.key ? 'bold' : '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Riwayat Capaian List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#059669' }} />
            Memuat catatan prestasi...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px 16px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            color: '#94a3b8',
            fontSize: '12px'
          }}>
            Belum ada catatan mutaba'ah untuk kategori ini.
          </div>
        ) : (
          filteredRecords.map(item => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '14px 16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: item.kategori === 'Tahfidz' ? '#f3e8ff' : item.kategori === 'Qiraati' ? '#dcfce7' : '#e0f2fe',
                  color: item.kategori === 'Tahfidz' ? '#7e22ce' : item.kategori === 'Qiraati' ? '#15803d' : '#0369a1'
                }}>
                  {item.kategori}
                </span>

                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                  {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                  {item.jilid_surat}
                </h3>
                {item.halaman_ayat && (
                  <p style={{ fontSize: '12px', color: '#059669', fontWeight: '600', margin: '2px 0 0 0' }}>
                    {item.halaman_ayat}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: item.status === 'lanjut' ? '#166534' : '#b45309'
                }}>
                  Nilai: {item.nilai || item.status}
                </span>

                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Oleh: {item.guru?.nama_lengkap || 'Ustadz / Ustadzah'}
                </span>
              </div>

              {item.catatan && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  color: '#475569',
                  fontStyle: 'italic',
                  borderLeft: '3px solid #059669'
                }}>
                  "{item.catatan}"
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL RAPOT PRINT (STUDENT SELF-VIEW) */}
      {showRapotModal && rapotData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:max-w-none print:p-0">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200 print:hidden">
              <h3 className="font-bold text-slate-800 text-sm">Rapot Prestasi Belajar Santri</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow"
                >
                  <Printer size={14} /> Cetak
                </button>
                <button
                  type="button"
                  onClick={() => setShowRapotModal(false)}
                  className="text-slate-400 p-1"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="printable-rapot space-y-4 text-xs text-slate-800">
              <div className="text-center border-b-2 border-emerald-900 pb-3">
                <h2 className="text-base font-bold font-serif uppercase tracking-wider text-emerald-950">
                  TPQ ANFAK AL AZIZAH
                </h2>
                <p className="text-[11px] text-slate-600">Laporan Hasil Mutaba'ah & Prestasi Belajar Santri</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div><strong>Nama:</strong> {student.nama_lengkap}</div>
                <div><strong>NIS:</strong> {student.nomor_induk}</div>
                <div><strong>Kelas:</strong> {student.kelas?.nama_kelas || '-'}</div>
              </div>

              <div>
                <h4 className="font-bold mb-2 uppercase text-[10px] tracking-wider text-slate-600">
                  Riwayat Capaian Mutaba'ah
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                        <th className="p-2">Tanggal</th>
                        <th className="p-2">Kategori</th>
                        <th className="p-2">Materi</th>
                        <th className="p-2">Nilai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400">Belum ada rekap prestasi.</td>
                        </tr>
                      ) : (
                        records.map((r, i) => (
                          <tr key={i}>
                            <td className="p-2">{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                            <td className="p-2 font-semibold text-emerald-800">{r.kategori}</td>
                            <td className="p-2">{r.jilid_surat} {r.halaman_ayat ? `(${r.halaman_ayat})` : ''}</td>
                            <td className="p-2 font-bold">{r.nilai || r.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-2 text-center text-[11px]">
                <div>
                  <p className="text-slate-500 mb-12">Wali Kelas,</p>
                  <p className="font-bold">( {student.wali_kelas?.nama_lengkap || 'Ustadz / Ustadzah'} )</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-12">Kepala TPQ,</p>
                  <p className="font-bold">( Kepala Lembaga )</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPrestasiPage;
