import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Loader2, 
  Sun, BookOpen, PartyPopper, Flag, Star, AlertCircle, CheckCircle2
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

const KalenderViewPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [hariIni, setHariIni] = useState(null);
  const [statistik, setStatistik] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, hariIniData, statsData] = await Promise.all([
        kalenderAPI.getAll({ tahun: year }),
        kalenderAPI.getHariIni(),
        kalenderAPI.getStatistik({ tahun: year })
      ]);
      setEvents(eventsData || []);
      setHariIni(hariIniData);
      setStatistik(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      days.push({ day: d, isCurrentMonth: true, date: dateStr });
    }
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

  const monthEvents = useMemo(() => {
    return events.filter(e => {
      const eventMonth = new Date(e.tanggal).getMonth();
      return eventMonth === month;
    });
  }, [events, month]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const currentMonthStats = statistik?.statistik?.find(s => s.bulan === month + 1);

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Calendar size={22} style={{ color: '#064e3b' }} />
        <h2 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--font-family-display)', color: '#064e3b' }}>Kalender Pendidikan</h2>
      </div>

      {/* Status Hari Ini */}
      {hariIni && (
        <div style={{
          padding: '14px 16px', borderRadius: '14px',
          background: hariIni.is_libur 
            ? 'linear-gradient(135deg, #fef2f2, #fecaca)' 
            : 'linear-gradient(135deg, #f0fdf4, #bbf7d0)',
          border: `1px solid ${hariIni.is_libur ? '#fca5a5' : '#86efac'}`,
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: hariIni.is_libur ? '#dc262620' : '#064e3b20'
          }}>
            {hariIni.is_libur ? <AlertCircle size={20} style={{ color: '#dc2626' }} /> : <CheckCircle2 size={20} style={{ color: '#064e3b' }} />}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: hariIni.is_libur ? '#991b1b' : '#166534' }}>
              Hari Ini: {hariIni.keterangan}
            </div>
            <div style={{ fontSize: '12px', color: hariIni.is_libur ? '#b91c1c' : '#15803d', marginTop: '2px' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {hariIni.events?.length > 0 && (
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                {hariIni.events.map(e => e.judul).join(' • ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {currentMonthStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f0fdf4', textAlign: 'center', border: '1px solid #bbf7d020' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#064e3b' }}>{currentMonthStats.hari_efektif}</div>
            <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Hari Efektif</div>
          </div>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#fef2f2', textAlign: 'center', border: '1px solid #fecaca20' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>{currentMonthStats.hari_libur}</div>
            <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Hari Libur</div>
          </div>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#f9fafb', textAlign: 'center', border: '1px solid #e5e7eb20' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#6b7280' }}>{currentMonthStats.hari_minggu}</div>
            <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Hari Minggu</div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
        {[{ key: 'calendar', label: '📅 Kalender' }, { key: 'list', label: '📋 Daftar' }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: '600', fontSize: '12px',
              fontFamily: 'var(--font-family-body)',
              backgroundColor: viewMode === tab.key ? '#ffffff' : 'transparent',
              color: viewMode === tab.key ? '#064e3b' : '#94a3b8',
              boxShadow: viewMode === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '13px' }}>Memuat kalender...</p>
        </div>
      ) : (
        <>
          {viewMode === 'calendar' && (
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              {/* Month Nav */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', backgroundColor: '#064e3b', color: '#ffffff'
              }}>
                <button onClick={prevMonth} style={navBtn}><ChevronLeft size={18} /></button>
                <span style={{ fontWeight: '700', fontSize: '16px', fontFamily: 'var(--font-family-display)' }}>
                  {BULAN_NAMES[month]} {year}
                </span>
                <button onClick={nextMonth} style={navBtn}><ChevronRight size={18} /></button>
              </div>

              {/* Day Labels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#f8fafc' }}>
                {HARI_NAMES.map((name, i) => (
                  <div key={name} style={{
                    padding: '8px 0', textAlign: 'center', fontSize: '10px', fontWeight: '700',
                    color: i === 0 ? '#dc2626' : '#94a3b8', textTransform: 'uppercase'
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
                  const hasLibur = dayEvents.some(e => e.is_libur);
                  const isSelected = day.date === selectedDate;

                  return (
                    <div
                      key={idx}
                      onClick={() => day.isCurrentMonth && day.date && setSelectedDate(day.date === selectedDate ? null : day.date)}
                      style={{
                        minHeight: '52px', padding: '2px', textAlign: 'center',
                        borderRight: '1px solid #f8fafc', borderBottom: '1px solid #f8fafc',
                        cursor: day.isCurrentMonth ? 'pointer' : 'default',
                        backgroundColor: isSelected ? '#f0fdf4' : isToday ? '#fffbeb' : !day.isCurrentMonth ? '#fafafa' : '#fff',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%', margin: '2px auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: isToday ? '800' : '500',
                        backgroundColor: isToday ? '#064e3b' : 'transparent',
                        color: isToday ? '#fff' : !day.isCurrentMonth ? '#d1d5db' : isSunday || hasLibur ? '#dc2626' : '#1f2937'
                      }}>
                        {day.day}
                      </div>
                      {dayEvents.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '1px' }}>
                          {dayEvents.slice(0, 3).map((e, i) => (
                            <div key={i} style={{
                              width: '5px', height: '5px', borderRadius: '50%',
                              backgroundColor: e.warna || getJenisInfo(e.jenis).color
                            }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Date Detail */}
              {selectedDate && (
                <div style={{ padding: '14px 16px', borderTop: '2px solid #064e3b', backgroundColor: '#f8fdf9' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#064e3b', marginBottom: '10px' }}>
                    📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  {(eventsByDate[selectedDate] || []).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(eventsByDate[selectedDate] || []).map(event => {
                        const info = getJenisInfo(event.jenis);
                        const IconComp = info.icon;
                        return (
                          <div key={event.id} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '10px', backgroundColor: '#fff',
                            borderLeft: `3px solid ${event.warna || info.color}`,
                            border: '1px solid #f1f5f9'
                          }}>
                            <IconComp size={16} style={{ color: event.warna || info.color, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937' }}>{event.judul}</div>
                              {event.deskripsi && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{event.deskripsi}</div>}
                            </div>
                            {event.is_libur && (
                              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '700' }}>LIBUR</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Tidak ada event di tanggal ini.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {monthEvents.length > 0 ? monthEvents.map(event => {
                const info = getJenisInfo(event.jenis);
                const IconComp = info.icon;
                return (
                  <div key={event.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px', borderRadius: '12px', backgroundColor: '#fff',
                    border: '1px solid #f1f5f9', borderLeft: `4px solid ${event.warna || info.color}`
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#064e3b', lineHeight: 1 }}>
                        {new Date(event.tanggal + 'T00:00:00').getDate()}
                      </span>
                      <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
                        {BULAN_NAMES[new Date(event.tanggal + 'T00:00:00').getMonth()].slice(0, 3)}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconComp size={12} style={{ color: event.warna || info.color }} />
                        <span style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937' }}>{event.judul}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {new Date(event.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long' })} • {info.label}
                      </div>
                    </div>
                    {event.is_libur && (
                      <span style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '700', flexShrink: 0 }}>LIBUR</span>
                    )}
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '13px' }}>
                  Tidak ada event di bulan {BULAN_NAMES[month]}.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', padding: '8px 0' }}>
        {JENIS_OPTIONS.map(j => (
          <div key={j.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#6b7280' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: j.color }} />
            {j.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const navBtn = {
  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff',
  width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};

export default KalenderViewPage;
