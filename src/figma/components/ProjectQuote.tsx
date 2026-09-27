import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { useDashTheme } from '@/figma/context/DashTheme';
import { projectService } from '@/lib/services';
import type { Quote } from '@/lib/owner.functions';

const VAT = 0.25;
const sek = (n: number) => `${Math.round(n).toLocaleString('sv-SE')} SEK`;
const empty: Quote = { materials: [], labor: 0, deposit: 0, installments: [], notes: '', valid_until: '', status: 'draft' };
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');

export function ProjectQuote({ projectId, initial }: { projectId: string; initial: unknown }) {
  const { tokens: T } = useDashTheme();
  const save = useServerFn(projectService.saveQuote);
  const qc = useQueryClient();
  const [q, setQ] = useState<Quote>({ ...empty, ...(initial && typeof initial === 'object' ? (initial as Partial<Quote>) : {}) });
  const [busy, setBusy] = useState(false);
  const materials = q.materials.reduce((s, m) => s + m.qty * m.unit_price, 0);
  const net = materials + q.labor, vat = net * VAT, gross = net + vat;
  const scheduled = q.deposit + q.installments.reduce((s, i) => s + i.amount, 0);
  const remaining = gross - scheduled;
  const paid = q.installments.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);
  const setM = (i: number, patch: Partial<Quote['materials'][number]>) => setQ({ ...q, materials: q.materials.map((m, k) => k === i ? { ...m, ...patch } : m) });
  const setI = (i: number, patch: Partial<Quote['installments'][number]>) => setQ({ ...q, installments: q.installments.map((m, k) => k === i ? { ...m, ...patch } : m) });
  const split = (n: number) => { const rest = Math.max(0, gross - q.deposit); const each = Math.round(rest / n); setQ({ ...q, installments: Array.from({ length: n }, (_, k) => ({ label: `Installment ${k + 1}`, amount: k === n - 1 ? Math.round(rest - each * (n - 1)) : each, due: '', paid: false })) }); };

  const inputStyle = { background: T.input } as const;
  const label = { display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 5 };

  const doSave = async () => {
    setBusy(true);
    try {
      await save({ data: { projectId, quote: q } });
      await Promise.all([qc.invalidateQueries({ queryKey: ['project', projectId] }), qc.invalidateQueries({ queryKey: ['projects'] })]);
      toast.success('Quote saved');
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: T.text, fontWeight: 400 }}>Quote & payment plan</h4>
        <select
          aria-label="Quote status"
          value={q.status}
          onChange={e => setQ({ ...q, status: e.target.value as Quote['status'] })}
          className="text-sm rounded-lg px-2 py-1.5"
          style={{ background: T.input, border: `1px solid ${T.cardBorder}`, color: T.text }}
        >
          {(['draft', 'sent', 'accepted', 'declined'] as const).map(s => (
            <option key={s} value={s}>{s[0]!.toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Materials to buy</div>
      <div className="flex flex-col gap-2 mb-3">
        {q.materials.length === 0 && <p style={{ fontSize: 13, color: T.textMid }}>No materials yet.</p>}
        {q.materials.map((m, i) => (
          <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 70px 110px auto' }}>
            <input className="vvs-input" aria-label="Item" placeholder="e.g. PEX pipe 16 mm" value={m.name} onChange={e => setM(i, { name: e.target.value })} style={inputStyle} />
            <input className="vvs-input" aria-label="Quantity" type="number" min={0} value={m.qty} onChange={e => setM(i, { qty: Number(e.target.value) })} style={inputStyle} />
            <input className="vvs-input" aria-label="Unit price (SEK)" type="number" min={0} value={m.unit_price} onChange={e => setM(i, { unit_price: Number(e.target.value) })} style={inputStyle} />
            <button aria-label="Remove item" onClick={() => setQ({ ...q, materials: q.materials.filter((_, k) => k !== i) })} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        <button onClick={() => setQ({ ...q, materials: [...q.materials, { name: '', qty: 1, unit_price: 0 }] })} className="btn-ghost py-2 rounded-lg text-sm">+ Add item</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label style={label}>Labour (SEK, excl. VAT)</label>
          <input className="vvs-input" type="number" min={0} value={q.labor} onChange={e => setQ({ ...q, labor: Number(e.target.value) })} style={inputStyle} />
        </div>
        <div>
          <label style={label}>Quote valid until</label>
          <input className="vvs-input" type="date" value={q.valid_until} onChange={e => setQ({ ...q, valid_until: e.target.value })} style={inputStyle} />
        </div>
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: T.cardAlt }}>
        <Row k="Materials" v={sek(materials)} T={T} />
        <Row k="Labour" v={sek(q.labor)} T={T} />
        <Row k="Subtotal excl. VAT" v={sek(net)} T={T} />
        <Row k="VAT 25%" v={sek(vat)} T={T} />
        <div style={{ borderTop: `1px solid ${T.divider}`, marginTop: 6, paddingTop: 6 }}>
          <Row k="Total incl. VAT" v={sek(gross)} T={T} strong />
        </div>
      </div>

      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Payments</div>
      <div className="flex gap-3 items-end mb-3 flex-wrap">
        <div className="flex-1">
          <label style={label}>Deposit paid upfront (SEK)</label>
          <input className="vvs-input" type="number" min={0} value={q.deposit} onChange={e => setQ({ ...q, deposit: Number(e.target.value) })} style={inputStyle} />
        </div>
        <div className="flex gap-1">
          {[20, 30, 50].map(p => (
            <button key={p} onClick={() => setQ({ ...q, deposit: Math.round(gross * p / 100) })} className="btn-ghost px-3 py-2 rounded-lg text-xs">{p}%</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 mb-2">
        {q.installments.map((it, i) => (
          <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: 'auto 1fr 110px 130px auto' }}>
            <input type="checkbox" aria-label="Paid" checked={it.paid} onChange={e => setI(i, { paid: e.target.checked })} />
            <input className="vvs-input" aria-label="Label" value={it.label} onChange={e => setI(i, { label: e.target.value })} style={inputStyle} />
            <input className="vvs-input" aria-label="Amount" type="number" min={0} value={it.amount} onChange={e => setI(i, { amount: Number(e.target.value) })} style={inputStyle} />
            <input className="vvs-input" aria-label="Due date" type="date" value={it.due} onChange={e => setI(i, { due: e.target.value })} style={inputStyle} />
            <button aria-label="Remove installment" onClick={() => setQ({ ...q, installments: q.installments.filter((_, k) => k !== i) })} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setQ({ ...q, installments: [...q.installments, { label: `Installment ${q.installments.length + 1}`, amount: Math.max(0, Math.round(remaining)), due: '', paid: false }] })} className="btn-ghost px-3 py-2 rounded-lg text-xs">+ Add installment</button>
          {[2, 3, 4].map(n => (
            <button key={n} onClick={() => split(n)} className="btn-ghost px-3 py-2 rounded-lg text-xs">Split rest in {n}</button>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 12, color: Math.abs(remaining) > 1 ? '#F59E0B' : '#22C55E', marginBottom: 16 }}>
        {Math.abs(remaining) <= 1 ? 'Payment plan covers the full total.' : remaining > 0 ? `${sek(remaining)} not yet scheduled.` : `Plan exceeds total by ${sek(-remaining)}.`} · Received so far: {sek(q.deposit + paid)}
      </p>

      <div className="mb-4">
        <label style={label}>Terms & notes</label>
        <textarea className="vvs-input" rows={3} maxLength={3000} value={q.notes} onChange={e => setQ({ ...q, notes: e.target.value })} placeholder="Warranty, exclusions, ROT deduction, access conditions…" style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <button
        onClick={doSave}
        disabled={busy || q.materials.some(m => !m.name.trim())}
        className="btn-copper w-full py-3 rounded-xl text-sm font-semibold"
        style={{ opacity: busy || q.materials.some(m => !m.name.trim()) ? 0.6 : 1 }}
      >
        {busy ? 'Saving…' : 'Save quote'}
      </button>
    </div>
  );
}

function Row({ k, v, strong, T }: { k: string; v: string; strong?: boolean; T: ReturnType<typeof useDashTheme>['tokens'] }) {
  return (
    <div className="flex justify-between gap-3 py-0.5" style={{ fontSize: strong ? 14 : 12, fontWeight: strong ? 700 : 400, color: strong ? T.text : T.textMid }}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
