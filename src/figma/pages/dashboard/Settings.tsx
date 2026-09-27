import { useState } from 'react';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Settings() {
  const { tokens: T } = useDashTheme();
  const [saved, setSaved] = useState(false);
  const [restDays, setRestDays] = useState(['Sat', 'Sun']);
  const [form, setForm] = useState({
    companyName: 'Ekström VVS',
    ownerName: 'Mats Ekström',
    serviceZone: 'Västerås and surroundings',
    hourlyRate: '850',
    startTime: '07:00',
    endTime: '18:00',
    emergencyBuffer: '60',
  });

  const toggleRestDay = (day: string) => {
    setRestDays(rd => rd.includes(day) ? rd.filter(d => d !== day) : [...rd, day]);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-up">
        <div className="mb-8">
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: T.text, marginBottom: 4 }}>Settings</h1>
          <p style={{ fontSize: 13, color: T.textMid }}>Business configuration — this drives all client-facing slot availability.</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Business */}
          <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 17, color: T.text, marginBottom: 16, fontWeight: 400 }}>Business</h3>
            <div className="flex flex-col gap-4">
              {[
                { key: 'companyName', label: 'Company name', type: 'text' },
                { key: 'ownerName', label: 'Owner name', type: 'text' },
                { key: 'serviceZone', label: 'Service zone', type: 'text' },
                { key: 'hourlyRate', label: 'Hourly rate (SEK)', type: 'number' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    className="vvs-input"
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    style={{ background: T.input }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 17, color: T.text, marginBottom: 16, fontWeight: 400 }}>Working hours</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { key: 'startTime', label: 'Work day starts' },
                { key: 'endTime', label: 'Work day ends' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {field.label}
                  </label>
                  <input
                    type="time"
                    className="vvs-input"
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    style={{ background: T.input }}
                  />
                </div>
              ))}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Emergency buffer (min before/after)
              </label>
              <input
                type="number"
                className="vvs-input"
                value={form.emergencyBuffer}
                onChange={e => setForm(f => ({ ...f, emergencyBuffer: e.target.value }))}
                style={{ background: T.input }}
              />
            </div>
          </div>

          {/* Rest days */}
          <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 17, color: T.text, marginBottom: 6, fontWeight: 400 }}>Rest days</h3>
            <p style={{ fontSize: 13, color: T.textMid, marginBottom: 16 }}>No slots will be shown on rest days.</p>
            <div className="flex gap-2 flex-wrap">
              {ALL_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleRestDay(day)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: restDays.includes(day) ? 'rgba(229,57,53,0.12)' : T.input,
                    color: restDays.includes(day) ? '#E53935' : T.textMid,
                    border: `1px solid ${restDays.includes(day) ? 'rgba(229,57,53,0.3)' : T.cardBorder}`,
                    cursor: 'pointer',
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Demo clock info */}
          <div className="p-4 rounded-xl" style={{ background: T.input, border: `1px dashed ${T.cardBorderStrong}` }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Demo mode active
            </div>
            <p style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
              The demo clock is active. Use the control on the Overview page to advance time and see how the dashboard responds. Reset from Overview.
            </p>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="btn-copper py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {saved ? '✓ Changes saved' : 'Save changes'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
