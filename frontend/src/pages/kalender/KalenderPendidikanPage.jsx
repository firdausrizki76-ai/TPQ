import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, 
  RefreshCw, Loader2, Download, X, Check, AlertCircle,
  Sun, BookOpen, PartyPopper, Flag, Star
} from 'lucide-react';
import { kalenderAPI } from '../../services/api';

const JENIS_OPTIONS = [
  { value: 'libur_nasional', label: 'Libur Nasional', color: '#dc2626', icon: Flag },
  { value: 'cuti_bersama', label: 'Cuti Bersama', color: '#f59e0b', icon: Sun },
  { value: 'agenda', label: 'Agenda TPQ', color: '#064e3b', icon: BookOpen },
  { value: 'kegiatan', label: 'Kegiatan', color: '#7c3aed', icon: PartyPopper },
  { value: 'hari_khusus', label: 'Hari Khusus', color: '#0ea5e9', icon: Star },
];

const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const HARI_NAMES = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

const getJenisInfo = (jenis) => JENIS_OPTIONS.find(j => j.value === jenis) || JENIS_OPTIONS[2];

const KalenderPendidikanPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [statistik, setStatistik] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list' | 'statistik'
  const [filterJenis, setFilterJenis] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    tanggal: '', judul: '', deskripsi: '', jenis: 'agenda', 
    warna: '#064e3b', is_libur: false, tahun_ajaran: ''
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [eventsData, statsData] = await Promise.all([
        kalenderAPI.getAll({ tahun: year }),
        kalenderAPI.getStatistik({ tahun: year })
      ]);
      setEvents(eventsData || []);
      setStatistik(statsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!confirm(`Sync hari libur nasional tahun ${year} dari API?\nData libur dari API sebelumnya akan di-refresh.`)) return;
    setSyncing(true);
    setError('');
    try {
      const result = await kalenderAPI.syncLibur({ tahun: year });
      setSuccess(`Berhasil sync ${result.synced} hari libur nasional untuk tahun ${year}`);
      setTimeout(() => setSuccess(''), 4000);
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const openAddModal = (date = null) => {
    setEditingEvent(null);
    setForm({
      tanggal: date || '', judul: '', deskripsi: '', jenis: 'agenda',
      warna: '#064e3b', is_libur: false, tahun_ajaran: ''
    });
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setForm({
      tanggal: event.tanggal, judul: event.judul, deskripsi: event.deskripsi || '',
      jenis: event.jenis, warna: event.warna || '#064e3b',
      is_libur: event.is_libur, tahun_ajaran: event.tahun_ajaran || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.tanggal || !form.judul) {
      setError('Tanggal dan judul harus diisi');
      return;
    }
    setError('');
    try {
      if (editingEvent) {
        await kalenderAPI.update(editingEvent.id, form);
        setSuccess('Event berhasil diperbarui');
      } else {
        await kalenderAPI.create(form);
        setSuccess('Event berhasil ditambahkan');
      }
      setTimeout(() => setSuccess(''), 3000);
      setShowModal(false);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus event ini?')) return;
    try {
      await kalenderAPI.delete(id);
      setSuccess('Event berhasil dihapus');
      setTimeout(() => setSuccess(''), 3000);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleJenisChange = (jenis) => {
    const info = getJenisInfo(jenis);
    setForm(prev => ({ 
      ...prev, 
      jenis, 
      warna: info.color,
      is_libur: jenis === 'libur_nasional' || jenis === 'cuti_bersama'
    }));
  };

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: null });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      days.push({ day: d, isCurrentMonth: true, date: dateStr });
    }
    // Next month leading days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false, date: null });
    }
    return days;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (!map[e.tanggal]) map[e.tanggal] = [];
      map[e.tanggal].push(e);
    });
    return map;
  }, [events]);

  const filteredEvents = useMemo(() => {
    let filtered = events.filter(e => {
      const eventMonth = new Date(e.tanggal).getMonth();
      return eventMonth === month;
    });
    if (filterJenis !== 'all') {
      filtered = filtered.filter(e => e.jenis === filterJenis);
    }
    return filtered;
  }, [events, month, filterJenis]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const currentMonthStats = statistik?.statistik?.find(s => s.bulan === month + 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={28} />
            Kalender Pendidikan
          </h1>
          <p className="page-subtitle">Kelola jadwal, hari libur nasional, agenda & kegiatan TPQ.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleSync} 
            disabled={syncing}
            style={{
              ...btnStyle('#f59e0b', '#ffffff'),
              opacity: syncing ? 0.7 : 1
            }}
          >
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {syncing ? 'Syncing...' : 'Sync Libur Nasional'}
          </button>
          <button onClick={() => openAddModal()} style={btnStyle('#064e3b', '#ffffff')}>
            <Plus size={16} /> Tambah Event
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> {success}
        </div>
      )}

      {/* Stats Summary Cards */}
      {currentMonthStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <StatMiniCard label="Hari Efektif" value={currentMonthStats.hari_efektif} color="#064e3b" bg="#f0fdf4" />
          <StatMiniCard label="Hari Libur" value={currentMonthStats.hari_libur} color="#dc2626" bg="#fef2f2" />
          <StatMiniCard label="Hari Minggu" value={currentMonthStats.hari_minggu} color="#6b7280" bg="#f9fafb" />
          <StatMiniCard label="Total Hari" value={currentMonthStats.total_hari} color="#1d4ed8" bg="#eff6ff" />
        </div>
      )}

      {/* View Mode Tabs */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
        {[
          { key: 'calendar', label: 'Kalender' },
          { key: 'list', label: 'Daftar Event' },
          { key: 'statistik', label: 'Statistik Hari Efektif' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: '600', fontSize: '13px',
              fontFamily: 'var(--font-family-body)',
              backgroundColor: viewMode === tab.key ? '#ffffff' : 'transparent',
              color: viewMode === tab.key ? '#064e3b' : '#64748b',
              boxShadow: viewMode === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Memuat kalender...</p>
        </div>
      ) : (
        <>
          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Calendar Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 24px', backgroundColor: '#064e3b', color: '#ffffff'
              }}>
                <button onClick={prevMonth} style={navBtnStyle}><ChevronLeft size={20} /></button>
                <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '20px', fontWeight: '700', margin: 0 }}>
                  {BULAN_NAMES[month]} {year}
                </h2>
                <button onClick={nextMonth} style={navBtnStyle}><ChevronRight size={20} /></button>
              </div>

              {/* Day Names */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {HARI_NAMES.map((name, i) => (
                  <div key={name} style={{
                    padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '700',
                    color: i === 0 ? '#dc2626' : '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {name}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {calendarDays.map((day, idx) => {
                  const dayEvents = day.date ? (eventsByDate[day.date] || []) : [];
                  const isToday = day.date === todayStr;
                  const isSunday = idx % 7 === 0;
                  const isSelected = day.date === selectedDate;
                  const hasLibur = dayEvents.some(e => e.is_libur);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (day.isCurrentMonth && day.date) {
                          setSelectedDate(day.date === selectedDate ? null : day.date);
                        }
                      }}
                      style={{
                        minHeight: '80px', padding: '4px', borderRight: '1px solid #f1f5f9',
                        borderBottom: '1px solid #f1f5f9', cursor: day.isCurrentMonth ? 'pointer' : 'default',
                        backgroundColor: isSelected ? '#f0fdf4' : isToday ? '#fffbeb' : !day.isCurrentMonth ? '#fafafa' : '#ffffff',
                        transition: 'background-color 0.15s',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        width: '28px', height: '28px', borderRadius: '50%', margin: '2px auto 2px',
                        fontSize: '13px', fontWeight: isToday ? '800' : '500',
                        backgroundColor: isToday ? '#064e3b' : 'transparent',
                        color: isToday ? '#ffffff' : !day.isCurrentMonth ? '#d1d5db' : isSunday || hasLibur ? '#dc2626' : '#1f2937'
                      }}>
                        {day.day}
                      </div>
                      {dayEvents.slice(0, 2).map((e, i) => (
                        <div key={i} style={{
                          fontSize: '9px', padding: '1px 4px', marginBottom: '1px',
                          borderRadius: '3px', backgroundColor: e.warna + '15',
                          color: e.warna, fontWeight: '600', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          borderLeft: `2px solid ${e.warna}`
                        }}>
                          {e.judul}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', fontWeight: '600' }}>
                          +{dayEvents.length - 2} lagi
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Date Detail */}
              {selectedDate && (
                <div style={{ padding: '20px 24px', borderTop: '2px solid #064e3b', backgroundColor: '#f0fdf4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#064e3b' }}>
                      📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={() => openAddModal(selectedDate)} style={{ ...btnStyle('#064e3b', '#ffffff'), padding: '6px 12px', fontSize: '12px' }}>
                      <Plus size={14} /> Tambah
                    </button>
                  </div>
                  {(eventsByDate[selectedDate] || []).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(eventsByDate[selectedDate] || []).map(event => (
                        <EventCard key={event.id} event={event} onEdit={openEditModal} onDelete={handleDelete} />
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Tidak ada event di tanggal ini.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Daftar Event — {BULAN_NAMES[month]} {year}</h3>
                <select
                  value={filterJenis}
                  onChange={e => setFilterJenis(e.target.value)}
                  className="input-field"
                  style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
                >
                  <option value="all">Semua Jenis</option>
                  {JENIS_OPTIONS.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
                </select>
              </div>
              {filteredEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredEvents.map(event => (
                    <EventCard key={event.id} event={event} onEdit={openEditModal} onDelete={handleDelete} showDate />
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Tidak ada event di bulan ini.</p>
              )}
            </div>
          )}

          {/* Statistik View */}
          {viewMode === 'statistik' && statistik && (
            <div className="card">
              <h3 style={{ margin: '0 0 4px', fontSize: '18px' }}>Statistik Hari Efektif KBM — {year}</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Hari efektif = Senin–Sabtu dikurangi hari libur nasional & cuti bersama</p>
              
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                <StatMiniCard label="Total Hari Efektif KBM" value={statistik.ringkasan.total_hari_efektif} color="#064e3b" bg="#f0fdf4" large />
                <StatMiniCard label="Total Hari Libur" value={statistik.ringkasan.total_hari_libur} color="#dc2626" bg="#fef2f2" large />
                <StatMiniCard label="Total Hari Minggu" value={statistik.ringkasan.total_hari_minggu} color="#6b7280" bg="#f9fafb" large />
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Bulan</th>
                      <th style={{ textAlign: 'center' }}>Total Hari</th>
                      <th style={{ textAlign: 'center' }}>Hari Minggu</th>
                      <th style={{ textAlign: 'center' }}>Hari Libur</th>
                      <th style={{ textAlign: 'center' }}>Hari Efektif KBM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistik.statistik.map(s => (
                      <tr key={s.bulan} style={{ backgroundColor: s.bulan === month + 1 ? '#f0fdf4' : 'transparent' }}>
                        <td style={{ fontWeight: s.bulan === month + 1 ? '700' : '400' }}>{s.nama_bulan}</td>
                        <td style={{ textAlign: 'center' }}>{s.total_hari}</td>
                        <td style={{ textAlign: 'center', color: '#6b7280' }}>{s.hari_minggu}</td>
                        <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: '600' }}>{s.hari_libur}</td>
                        <td style={{ textAlign: 'center', color: '#064e3b', fontWeight: '700', fontSize: '16px' }}>{s.hari_efektif}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', fontWeight: '700' }}>
                      <td>TOTAL</td>
                      <td style={{ textAlign: 'center' }}>{statistik.statistik.reduce((s,r) => s + r.total_hari, 0)}</td>
                      <td style={{ textAlign: 'center' }}>{statistik.ringkasan.total_hari_minggu}</td>
                      <td style={{ textAlign: 'center' }}>{statistik.ringkasan.total_hari_libur}</td>
                      <td style={{ textAlign: 'center', fontSize: '18px' }}>{statistik.ringkasan.total_hari_efektif}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Tambah/Edit Event */}
      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{editingEvent ? 'Edit Event' : 'Tambah Event Baru'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tanggal *</label>
                <input type="date" className="input-field" value={form.tanggal} onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Judul *</label>
                <input type="text" className="input-field" placeholder="Contoh: Maulid Nabi, Libur Semester, dll" value={form.judul} onChange={e => setForm(p => ({ ...p, judul: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Jenis Event</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {JENIS_OPTIONS.map(j => (
                    <button
                      key={j.value}
                      onClick={() => handleJenisChange(j.value)}
                      style={{
                        padding: '8px 14px', borderRadius: '20px', border: '2px solid',
                        borderColor: form.jenis === j.value ? j.color : '#e2e8f0',
                        backgroundColor: form.jenis === j.value ? j.color + '15' : '#ffffff',
                        color: form.jenis === j.value ? j.color : '#64748b',
                        cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                        fontFamily: 'var(--font-family-body)',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <j.icon size={14} /> {j.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">Deskripsi</label>
                <textarea className="input-field" rows={3} placeholder="Keterangan tambahan..." value={form.deskripsi} onChange={e => setForm(p => ({ ...p, deskripsi: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <label className="input-label">Tahun Ajaran</label>
                  <input type="text" className="input-field" placeholder="2024/2025" value={form.tahun_ajaran} onChange={e => setForm(p => ({ ...p, tahun_ajaran: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '28px' }}>
                  <input type="checkbox" id="isLibur" checked={form.is_libur} onChange={e => setForm(p => ({ ...p, is_libur: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: '#064e3b' }} />
                  <label htmlFor="isLibur" style={{ fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Tandai sebagai Hari Libur</label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ ...btnStyle('#e2e8f0', '#1f2937'), fontWeight: '500' }}>Batal</button>
              <button onClick={handleSave} style={btnStyle('#064e3b', '#ffffff')}>
                <Check size={16} /> {editingEvent ? 'Simpan Perubahan' : 'Tambah Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Keterangan:</span>
          {JENIS_OPTIONS.map(j => (
            <div key={j.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: j.color }} />
              <span style={{ color: '#374151' }}>{j.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sub-components
const EventCard = ({ event, onEdit, onDelete, showDate = false }) => {
  const info = getJenisInfo(event.jenis);
  const IconComp = info.icon;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
      borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #f1f5f9',
      borderLeft: `4px solid ${event.warna || info.color}`
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: (event.warna || info.color) + '15', color: event.warna || info.color,
        flexShrink: 0
      }}>
        <IconComp size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>{event.judul}</span>
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
            backgroundColor: (event.warna || info.color) + '15', color: event.warna || info.color,
            fontWeight: '600'
          }}>
            {info.label}
          </span>
          {event.is_libur && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '600' }}>
              LIBUR
            </span>
          )}
          {event.sumber === 'api' && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: '600' }}>
              API
            </span>
          )}
        </div>
        {showDate && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            {new Date(event.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        )}
        {event.deskripsi && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{event.deskripsi}</div>}
      </div>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button onClick={() => onEdit(event)} style={iconBtnStyle('#f59e0b')} title="Edit"><Edit2 size={14} /></button>
        <button onClick={() => onDelete(event.id)} style={iconBtnStyle('#dc2626')} title="Hapus"><Trash2 size={14} /></button>
      </div>
    </div>
  );
};

const StatMiniCard = ({ label, value, color, bg, large = false }) => (
  <div style={{
    padding: large ? '20px' : '14px 16px', borderRadius: '12px', backgroundColor: bg,
    border: `1px solid ${color}20`, textAlign: 'center'
  }}>
    <div style={{ fontSize: large ? '28px' : '22px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: large ? '13px' : '11px', color: '#64748b', fontWeight: '500', marginTop: '4px' }}>{label}</div>
  </div>
);

// Styles
const btnStyle = (bg, color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
  borderRadius: '8px', border: 'none', backgroundColor: bg, color,
  fontWeight: '600', fontSize: '13px', cursor: 'pointer',
  fontFamily: 'var(--font-family-body)', transition: 'all 0.2s'
});

const navBtnStyle = {
  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff',
  width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
};

const iconBtnStyle = (color) => ({
  width: '30px', height: '30px', borderRadius: '8px', border: 'none',
  backgroundColor: color + '10', color, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
});

const overlayStyle = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '20px'
};

const modalStyle = {
  backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px',
  width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
};

export default KalenderPendidikanPage;
