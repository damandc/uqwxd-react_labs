import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Smartphone, Users, Gauge, AlertTriangle, Clock, Send, Download, X,
  CheckCircle2, XCircle, Loader2, Upload, Camera, FileText, ShieldCheck, Lock, Sparkles,
  ScanLine, ChevronRight, ChevronDown, Search, Mail, MessageSquare, FolderArchive, Folder,
  File, RotateCcw, Building2, User, MinusCircle, Calendar, Info, History, Zap, Link2,
  PhoneCall, PartyPopper, Activity,
} from 'lucide-react';

/* =============================================================================
   SlipChase — dual-sided prototype
   Bookkeeper dashboard + client magic-link upload portal, sharing one mock store.
   ========================================================================== */

const FIRM = 'Oakridge Bookkeeping';
const SCAN_MS = 1200;

const stamp = () =>
  new Date().toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const slug = (s) => s.replace(/&/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ai = (docType, year, issuer, fields, confidence = 98, note = null) => ({
  docType, year, issuer, fields, confidence, note,
});

const doc = (o) => ({
  status: 'pending', optional: false, file: null, uploadedAt: null, verifiedAt: null,
  ai: null, sizeKb: 0, folder: '01_Income', ...o,
});

/* ---------- Mock data (all names/figures are fictional demo data) ---------- */

function makeClients() {
  return [
    {
      id: 'sarah', name: 'Sarah Jenkins', initials: 'SJ', kind: 'Individual',
      engagement: 'T1 Personal Return', code: 'T1', year: '2025',
      email: 'sarah.j•••@gmail.com', phone: '(604) •••-0182', city: 'Burnaby, BC',
      due: 'Apr 30, 2026', lastActivity: '2 days ago',
      reminders: [{ at: 'Mar 9, 9:00 a.m.', step: 'Day 0 — Magic link sent', channels: ['Email', 'SMS'] }],
      docs: [
        doc({ id: 't4', code: 'T4', name: 'T4 — Statement of Remuneration Paid', status: 'verified',
          file: 'IMG_4471.HEIC', uploadedAt: 'Mar 10, 8:12 p.m.', verifiedAt: 'Mar 10, 8:12 p.m.', sizeKb: 1840,
          ai: ai('T4 Statement of Remuneration Paid', '2025', 'Pacific Ridge Dental Corp.',
            [['Box 14 — Employment income', '$68,450.00'], ['Box 22 — Income tax deducted', '$11,902.31'], ['Box 52 — Pension adjustment', '$5,410.00']], 99) }),
        doc({ id: 't5', code: 'T5', name: 'T5 — Statement of Investment Income', status: 'verified',
          file: 'T5_2025.pdf', uploadedAt: 'Mar 10, 8:15 p.m.', verifiedAt: 'Mar 10, 8:15 p.m.', sizeKb: 204,
          ai: ai('T5 Statement of Investment Income', '2025', 'Harbourline Credit Union',
            [['Box 13 — Interest from Canadian sources', '$642.18']], 99) }),
        doc({ id: 'med', code: 'MED', name: 'Medical expense receipts', status: 'verified', folder: '02_Deductions-Credits',
          file: 'pharmacy_receipts.pdf', uploadedAt: 'Mar 11, 7:40 p.m.', verifiedAt: 'Mar 11, 7:41 p.m.', sizeKb: 3120,
          ai: ai('Medical receipts (bundle, 7 pages)', '2025', 'Multiple providers',
            [['Receipts detected', '7'], ['Total eligible (est.)', '$2,316.40']], 94) }),
        doc({ id: 'care', code: 'CHILDCARE', name: 'Childcare expense receipts', status: 'verified', folder: '02_Deductions-Credits',
          file: 'daycare_2025.pdf', uploadedAt: 'Mar 11, 7:44 p.m.', verifiedAt: 'Mar 11, 7:44 p.m.', sizeKb: 488,
          ai: ai('Childcare expense receipt', '2025', 'Little Sprouts Early Learning',
            [['Provider SIN/BN present', 'Yes'], ['Annual amount', '$7,800.00']], 97) }),
        doc({ id: 'rrsp', code: 'RRSP', name: 'Official RRSP contribution receipt', folder: '02_Deductions-Credits' }),
      ],
    },
    {
      id: 'apex', name: 'Apex Plumbing & Heating Ltd.', initials: 'AP', kind: 'Corporation',
      engagement: 'T2 Corporate Year-End', code: 'T2', year: 'FY2025',
      email: 'office@apexplumb•••.ca', phone: '(778) •••-4410', city: 'Surrey, BC',
      due: 'Jun 30, 2026', lastActivity: '6 days ago',
      reminders: [
        { at: 'Feb 20, 9:00 a.m.', step: 'Day 0 — Magic link sent', channels: ['Email', 'SMS'] },
        { at: 'Feb 23, 9:00 a.m.', step: 'Day 3 — SMS nudge', channels: ['SMS'] },
      ],
      docs: [
        doc({ id: 'bank', code: 'BANK', name: 'Bank & credit card statements (Jan–Dec 2025)', status: 'verified', folder: '01_Banking',
          file: 'RBC_Business_2025_all.pdf', uploadedAt: 'Feb 21, 10:02 a.m.', verifiedAt: 'Feb 21, 10:03 a.m.', sizeKb: 5420,
          ai: ai('Business bank statements (12 of 12 months)', '2025', 'Chartered bank (business chequing)',
            [['Months detected', 'Jan–Dec (12/12)'], ['Closing balance Dec 31', '$48,211.07']], 98) }),
        doc({ id: 'gl', code: 'GL', name: 'General ledger / trial balance export', status: 'verified', folder: '02_Accounting',
          file: 'Apex_TB_FY2025.xlsx', uploadedAt: 'Feb 21, 10:06 a.m.', verifiedAt: 'Feb 21, 10:06 a.m.', sizeKb: 316,
          ai: ai('Trial balance (spreadsheet)', 'FY2025', 'Accounting software export',
            [['Accounts', '84'], ['Debits = Credits', 'Balanced']], 99) }),
        doc({ id: 't5018', code: 'T5018', name: 'T5018 — Statement of Contract Payments (subcontractors)', folder: '03_Payroll-Contractors', blocking: true }),
        doc({ id: 't4sum', code: 'T4SUM', name: 'T4 Summary & payroll remittance records', folder: '03_Payroll-Contractors' }),
        doc({ id: 'assets', code: 'CAPEX', name: 'Fixed asset purchase invoices (vehicles, equipment)', folder: '04_Assets' }),
        doc({ id: 'gst', code: 'GST', name: 'GST/HST return filings & working papers', folder: '05_Sales-Tax' }),
      ],
    },
    {
      id: 'david', name: 'David Chen', initials: 'DC', kind: 'Individual',
      engagement: 'T1 Sole Proprietorship & GST/HST', code: 'T1-SP', year: '2025',
      email: 'dchen.•••@outlook.com', phone: '(604) •••-7731', city: 'Vancouver, BC',
      due: 'Jun 15, 2026', lastActivity: 'Yesterday',
      reminders: [{ at: 'Mar 4, 9:00 a.m.', step: 'Day 0 — Magic link sent', channels: ['Email', 'SMS'] }],
      docs: [
        doc({ id: 't4', code: 'T4', name: 'T4 — Statement of Remuneration Paid', desc: 'From each employer you worked for in 2025.',
          status: 'verified', file: 'T4_MetroTech.jpg', uploadedAt: 'Mar 5, 6:31 p.m.', verifiedAt: 'Mar 5, 6:31 p.m.', sizeKb: 1310,
          ai: ai('T4 Statement of Remuneration Paid', '2025', 'Metro Tech',
            [['Box 14 — Employment income', '$74,200.00'], ['Box 22 — Income tax deducted', '$13,486.50']], 99) }),
        doc({ id: 't5', code: 'T5', name: 'T5 — Statement of Investment Income', desc: 'Interest, dividends — from your bank or brokerage.',
          status: 'verified', file: 'T5_2025.pdf', uploadedAt: 'Mar 5, 6:34 p.m.', verifiedAt: 'Mar 5, 6:34 p.m.', sizeKb: 196,
          ai: ai('T5 Statement of Investment Income', '2025', 'Harbourline Credit Union',
            [['Box 13 — Interest from Canadian sources', '$1,184.22']], 98) }),
        doc({ id: 't2202', code: 'T2202', name: 'T2202 / Tuition Slip', desc: 'Only if you took post-secondary courses in 2025.',
          status: 'na', optional: true, folder: '02_Deductions-Credits' }),
        doc({ id: 'rrsp', code: 'RRSP', name: 'Official RRSP Contribution Receipts (March–Dec 2025 & First 60 Days 2026)',
          desc: 'Every receipt your bank or brokerage issued for contributions in this window.', folder: '02_Deductions-Credits' }),
        doc({ id: 'noa', code: 'NOA', name: 'Notice of Assessment (NOA) 2024', desc: 'The letter CRA sent after processing your 2024 return.',
          status: 'flagged', folder: '03_CRA-Correspondence', file: 'CRA_letter.jpg', uploadedAt: 'Mar 5, 6:40 p.m.', sizeKb: 940,
          ai: ai('T1 General — return summary (not an NOA)', '2024', 'Self-prepared / tax software printout',
            [['Detected form', 'T1 return summary'], ['CRA assessment block', 'Not found']], 96,
            'Mismatch: this is a 2024 T1 return summary, not a Notice of Assessment. Download your NOA from CRA My Account → Tax returns → Notice of assessment.') }),
      ],
    },
    {
      id: 'elena', name: 'Elena Rostova', initials: 'ER', kind: 'Individual',
      engagement: 'T1 New Immigrant First-Year Return', code: 'T1-NEW', year: '2025',
      email: 'e.rostova•••@gmail.com', phone: '(236) •••-5508', city: 'Richmond, BC',
      due: 'Apr 30, 2026', lastActivity: '3 hours ago',
      reminders: [
        { at: 'Feb 28, 9:00 a.m.', step: 'Day 0 — Magic link sent', channels: ['Email', 'SMS'] },
        { at: 'Mar 3, 9:00 a.m.', step: 'Day 3 — SMS nudge', channels: ['SMS'] },
      ],
      docs: [
        doc({ id: 'res', code: 'RES', name: 'Proof of residency date (PR confirmation / COPR)', status: 'verified', folder: '00_Identity-Residency',
          file: 'COPR_scan.pdf', uploadedAt: 'Mar 1, 11:20 a.m.', verifiedAt: 'Mar 1, 11:21 a.m.', sizeKb: 760,
          ai: ai('Confirmation of Permanent Residence', '2025', 'IRCC',
            [['Date of landing', 'Jun 14, 2025'], ['Name matches client', 'Yes']], 97) }),
        doc({ id: 'world', code: 'WORLD', name: 'World income statement (pre-arrival, Jan–Jun 2025)', status: 'verified',
          file: 'income_statement_EN.pdf', uploadedAt: 'Mar 1, 11:24 a.m.', verifiedAt: 'Mar 1, 11:26 a.m.', sizeKb: 410,
          ai: ai('Foreign employment income statement (translated)', '2025', 'Foreign employer',
            [['Period', 'Jan 1 – Jun 13, 2025'], ['Translation attached', 'Yes']], 92) }),
        doc({ id: 't4', code: 'T4', name: 'T4 — Statement of Remuneration Paid', status: 'verified',
          file: 'T4.png', uploadedAt: 'Mar 2, 9:05 p.m.', verifiedAt: 'Mar 2, 9:05 p.m.', sizeKb: 880,
          ai: ai('T4 Statement of Remuneration Paid', '2025', 'Northshore Logistics Inc.',
            [['Box 14 — Employment income', '$31,940.00']], 99) }),
        doc({ id: 'rent', code: 'RENT', name: 'Rent receipts (BC renter\'s tax credit)', status: 'verified', folder: '02_Deductions-Credits',
          file: 'rent_receipts.pdf', uploadedAt: 'Mar 2, 9:09 p.m.', verifiedAt: 'Mar 2, 9:10 p.m.', sizeKb: 352,
          ai: ai('Residential rent receipts (7 months)', '2025', 'Landlord (individual)',
            [['Months', 'Jun–Dec 2025'], ['Address in BC', 'Yes']], 95) }),
        doc({ id: 'fa', code: 'FOREIGN', name: 'Foreign bank & asset statements (opening balances)', status: 'verified', folder: '04_Foreign-Assets',
          file: 'foreign_accounts.pdf', uploadedAt: 'Mar 3, 10:30 a.m.', verifiedAt: 'Mar 3, 10:32 a.m.', sizeKb: 620,
          ai: ai('Foreign bank statements', '2025', 'Foreign financial institution',
            [['Accounts detected', '2'], ['Fair market value on landing', 'Listed']], 93) }),
      ],
    },
  ];
}

const INITIAL_ACTIVITY = [
  { id: 'a1', at: '3 hours ago', tone: 'emerald', text: 'Elena Rostova — all 5 items verified. Ready for review.' },
  { id: 'a2', at: 'Yesterday', tone: 'rose', text: 'David Chen — AI flagged NOA upload (T1 summary, not an NOA).' },
  { id: 'a3', at: '2 days ago', tone: 'indigo', text: 'Sarah Jenkins — 2 receipt bundles verified automatically.' },
];

/* ---------- Status helpers ---------- */

const STATUS = {
  verified: { label: 'Verified', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: CheckCircle2, ic: 'text-emerald-600' },
  pending: { label: 'Pending upload', chip: 'bg-slate-100 text-slate-600 ring-slate-500/20', icon: Clock, ic: 'text-slate-400' },
  flagged: { label: 'Flagged', chip: 'bg-rose-50 text-rose-700 ring-rose-600/20', icon: XCircle, ic: 'text-rose-600' },
  wrongyear: { label: 'Wrong tax year', chip: 'bg-amber-50 text-amber-800 ring-amber-600/20', icon: AlertTriangle, ic: 'text-amber-600' },
  na: { label: 'Not applicable', chip: 'bg-zinc-100 text-zinc-500 ring-zinc-400/20', icon: MinusCircle, ic: 'text-zinc-400' },
  scanning: { label: 'AI scanning…', chip: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20', icon: Loader2, ic: 'text-indigo-600 animate-spin' },
};

const isDone = (d) => d.status === 'verified' || d.status === 'na';
const isProblem = (d) => d.status === 'flagged' || d.status === 'wrongyear';

function progressOf(client) {
  const total = client.docs.length;
  const done = client.docs.filter(isDone).length;
  const verified = client.docs.filter((d) => d.status === 'verified').length;
  const problems = client.docs.filter(isProblem).length;
  const missing = client.docs.filter((d) => d.status === 'pending').length;
  return { total, done, verified, problems, missing, pct: Math.round((done / total) * 100) };
}

function clientState(client) {
  const p = progressOf(client);
  if (p.problems > 0) return { label: 'Action required', tone: 'rose', detail: 'AI flagged mismatched slip' };
  if (p.done === p.total) return { label: 'Ready for review', tone: 'emerald', detail: '100% complete' };
  const blocking = client.docs.find((d) => d.blocking && d.status === 'pending');
  if (blocking) return { label: 'Blocked', tone: 'amber', detail: `${blocking.code} missing` };
  return { label: 'Awaiting client', tone: 'slate', detail: `${p.missing} missing` };
}

const TONE_CHIP = {
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
};
const TONE_DOT = { rose: 'bg-rose-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', slate: 'bg-slate-400', indigo: 'bg-indigo-500' };
const TONE_BAR = { rose: 'bg-rose-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', slate: 'bg-indigo-500', indigo: 'bg-indigo-500' };

const REMINDER_STEPS = [
  { day: 0, title: 'Magic link sent', channels: ['Email', 'SMS'], icon: Link2 },
  { day: 3, title: 'SMS nudge listing missing items', channels: ['SMS'], icon: MessageSquare },
  { day: 7, title: 'Email escalation with checklist', channels: ['Email', 'SMS'], icon: Mail },
  { day: 10, title: 'Call task created for bookkeeper', channels: ['Task'], icon: PhoneCall },
];

/* =============================================================================
   Root
   ========================================================================== */

export default function SlipChase() {
  const [role, setRole] = useState('bookkeeper');
  const [clients, setClients] = useState(makeClients);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [toasts, setToasts] = useState([]);
  const [drawerId, setDrawerId] = useState(null);
  const [zipId, setZipId] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  const pushToast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, ...t }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.duration || 5000);
  }, []);

  const logActivity = useCallback((text, tone = 'indigo') => {
    setActivity((a) => [{ id: Math.random().toString(36).slice(2), at: 'Just now', text, tone }, ...a].slice(0, 8));
  }, []);

  const sendReminder = useCallback((clientId) => {
    const c = clients.find((x) => x.id === clientId);
    if (!c) return;
    const p = progressOf(c);
    if (p.done === p.total) {
      pushToast({ tone: 'slate', title: 'Nothing to chase', body: [`${c.name} is 100% complete — no reminder sent.`] });
      return;
    }
    const outstanding = c.docs.filter((d) => !isDone(d));
    const step = REMINDER_STEPS[Math.min(c.reminders.length, REMINDER_STEPS.length - 1)];
    const first = c.name.split(' ')[0];
    setClients((cs) => cs.map((x) => (x.id === clientId
      ? { ...x, lastActivity: 'Just now', reminders: [...x.reminders, { at: stamp(), step: `Day ${step.day} — ${step.title}`, channels: ['Email', 'SMS'], manual: true }] }
      : x)));
    logActivity(`Reminder sequence sent to ${c.name} (SMS + email) — ${outstanding.length} item${outstanding.length > 1 ? 's' : ''} outstanding.`, 'indigo');
    pushToast({
      tone: 'indigo',
      title: `Reminder sent to ${c.name}`,
      body: [
        { icon: MessageSquare, text: `SMS to ${c.phone}: "Hi ${c.kind === 'Corporation' ? 'there' : first}, ${outstanding.length} item${outstanding.length > 1 ? 's' : ''} left for ${FIRM}. Tap your secure link to upload."` },
        { icon: Mail, text: `Email to ${c.email} with magic link + checklist (${outstanding.map((d) => d.code).join(', ')})` },
        { icon: Calendar, text: 'Next automatic nudge scheduled in 3 days' },
      ],
      duration: 6500,
    });
  }, [clients, pushToast, logActivity]);

  const updateDoc = useCallback((clientId, docId, patch) => {
    setClients((cs) => cs.map((c) => (c.id !== clientId ? c : {
      ...c,
      lastActivity: 'Just now',
      docs: c.docs.map((d) => (d.id === docId ? { ...d, ...patch } : d)),
    })));
  }, []);

  const reset = () => {
    setClients(makeClients());
    setActivity(INITIAL_ACTIVITY);
    setDrawerId(null);
    setZipId(null);
    setToasts([]);
    setResetKey((k) => k + 1);
  };

  const david = clients.find((c) => c.id === 'david');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <style>{`
        @keyframes sc-scan { 0% { top: 4%; } 50% { top: 92%; } 100% { top: 4%; } }
        @keyframes sc-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes sc-drawer { from { transform: translateX(100%); } to { transform: none; } }
        .sc-in { animation: sc-in .28s ease-out both; }
        .sc-drawer { animation: sc-drawer .3s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      <RoleBanner role={role} setRole={setRole} onReset={reset} />

      <div className="pt-[76px] sm:pt-20">
        {role === 'bookkeeper' ? (
          <BookkeeperDashboard
            clients={clients}
            activity={activity}
            onOpen={setDrawerId}
            onRemind={sendReminder}
            onZip={setZipId}
            onSwitchToPortal={() => setRole('client')}
          />
        ) : (
          <ClientPortal
            key={resetKey}
            client={david}
            updateDoc={(docId, patch) => updateDoc('david', docId, patch)}
            logActivity={logActivity}
          />
        )}
      </div>

      {drawerId && role === 'bookkeeper' && (
        <ClientDrawer
          client={clients.find((c) => c.id === drawerId)}
          onClose={() => setDrawerId(null)}
          onRemind={sendReminder}
          onZip={setZipId}
          pushToast={pushToast}
        />
      )}

      {zipId && (
        <ZipModal client={clients.find((c) => c.id === zipId)} onClose={() => setZipId(null)} pushToast={pushToast} logActivity={logActivity} />
      )}

      <ToastStack toasts={toasts} dismiss={(id) => setToasts((ts) => ts.filter((t) => t.id !== id))} />
    </div>
  );
}

/* =============================================================================
   Shared UI
   ========================================================================== */

function RoleBanner({ role, setRole, onReset }) {
  const opts = [
    { id: 'bookkeeper', label: 'Bookkeeper Dashboard', short: 'Bookkeeper', icon: LayoutDashboard },
    { id: 'client', label: 'Client Upload Portal', short: 'Client Portal', icon: Smartphone },
  ];
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex justify-center px-2 pt-2 sm:pt-3 pointer-events-none">
      <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-2 rounded-2xl bg-slate-900/95 p-1.5 pl-3 text-white shadow-xl shadow-slate-900/20 ring-1 ring-white/10 backdrop-blur">
        <div className="hidden items-center gap-1.5 pr-1 sm:flex">
          <ScanLine className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold tracking-tight">SlipChase</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-300">Prototype</span>
        </div>
        <span className="hidden text-xs text-slate-400 md:inline">Viewing as</span>
        <div className="flex flex-1 rounded-xl bg-white/5 p-0.5" role="tablist" aria-label="Switch perspective">
          {opts.map((o) => {
            const Icon = o.icon;
            const active = role === o.id;
            return (
              <button
                key={o.id}
                role="tab"
                aria-selected={active}
                onClick={() => setRole(o.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2.5 py-2 text-xs font-medium transition sm:text-sm ${active ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="sm:hidden">{o.short}</span>
                <span className="hidden sm:inline">{o.label}</span>
              </button>
            );
          })}
        </div>
        <button onClick={onReset} title="Reset demo data" className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white">
          <RotateCcw className="h-4 w-4" />
          <span className="hidden lg:inline">Reset</span>
        </button>
      </div>
    </div>
  );
}

function StatusChip({ status, className = '' }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${s.chip} ${className}`}>
      <Icon className={`h-3 w-3 ${status === 'scanning' ? 'animate-spin' : ''}`} />
      {s.label}
    </span>
  );
}

function ToneChip({ tone, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONE_CHIP[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />
      {children}
    </span>
  );
}

function ProgressBar({ pct, tone = 'slate', className = 'h-1.5' }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-200/70 ${className}`}>
      <div className={`h-full rounded-full transition-all duration-700 ease-out ${TONE_BAR[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ToastStack({ toasts, dismiss }) {
  const toneIcon = { indigo: Send, emerald: CheckCircle2, rose: XCircle, amber: AlertTriangle, slate: Info };
  const toneRing = { indigo: 'text-indigo-600 bg-indigo-50', emerald: 'text-emerald-600 bg-emerald-50', rose: 'text-rose-600 bg-rose-50', amber: 'text-amber-600 bg-amber-50', slate: 'text-slate-500 bg-slate-100' };
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[80] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[400px]" aria-live="polite">
      {toasts.map((t) => {
        const Icon = toneIcon[t.tone] || Info;
        return (
          <div key={t.id} className="sc-in pointer-events-auto w-full rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg shadow-slate-900/10">
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-1.5 ${toneRing[t.tone] || toneRing.slate}`}><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                <ul className="mt-1 space-y-1">
                  {t.body.map((line, i) => {
                    const LI = typeof line === 'object' ? line.icon : null;
                    return (
                      <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-slate-600">
                        {LI && <LI className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />}
                        <span>{typeof line === 'object' ? line.text : line}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =============================================================================
   Bookkeeper dashboard
   ========================================================================== */

const BASE_METRICS = { engagements: 28, completion: 74, missing: 14, hours: 38 };

function BookkeeperDashboard({ clients, activity, onOpen, onRemind, onZip, onSwitchToPortal }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const initial = useMemo(() => makeClients(), []);

  // Headline metrics cover all 28 engagements; the 4 demo rows nudge them live.
  const metrics = useMemo(() => {
    const outstanding = (cs) => cs.reduce((n, c) => n + c.docs.filter((d) => !isDone(d)).length, 0);
    const pctSum = (cs) => cs.reduce((n, c) => n + progressOf(c).pct, 0);
    const missing = BASE_METRICS.missing + (outstanding(clients) - outstanding(initial));
    const completion = Math.round(BASE_METRICS.completion + (pctSum(clients) - pctSum(initial)) / BASE_METRICS.engagements);
    const extraReminders = clients.reduce((n, c) => n + c.reminders.filter((r) => r.manual).length, 0);
    return { ...BASE_METRICS, missing, completion, hours: (BASE_METRICS.hours + extraReminders * 0.25).toFixed(extraReminders ? 1 : 0) };
  }, [clients, initial]);

  const filtered = clients.filter((c) => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    const st = clientState(c).tone;
    if (filter === 'action') return st === 'rose' || st === 'amber';
    if (filter === 'ready') return st === 'emerald';
    return true;
  });

  const cards = [
    { label: 'Active Engagements', value: `${metrics.engagements}`, unit: 'clients', icon: Users, accent: 'text-indigo-600 bg-indigo-50', sub: '4 shown in demo' },
    { label: 'Avg. Completion Rate', value: `${metrics.completion}%`, icon: Gauge, accent: 'text-emerald-600 bg-emerald-50', bar: metrics.completion },
    { label: 'Missing / Blocked Slips', value: `${metrics.missing}`, unit: 'pending', icon: AlertTriangle, accent: 'text-amber-600 bg-amber-50', sub: 'Across all engagements' },
    { label: 'Time Saved This Month', value: `${metrics.hours}`, unit: 'hours', icon: Zap, accent: 'text-violet-600 bg-violet-50', sub: 'vs. manual email chasing' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 text-sm font-bold text-white shadow-sm">OB</div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{FIRM} · 2025 tax season</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Document collection</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button onClick={onSwitchToPortal} className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:flex">
            <Smartphone className="h-4 w-4" /> Preview client link
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-slate-500 sm:text-sm">{m.label}</p>
                <div className={`rounded-lg p-1.5 ${m.accent}`}><Icon className="h-4 w-4" /></div>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-slate-900 sm:text-3xl">
                {m.value}
                {m.unit && <span className="ml-1 text-sm font-normal text-slate-500">{m.unit}</span>}
              </p>
              {m.bar != null ? <ProgressBar pct={m.bar} tone="emerald" className="mt-3 h-1.5" /> : <p className="mt-2 text-xs text-slate-400">{m.sub}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Client list */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Client engagements</h2>
              <p className="text-xs text-slate-500">Click a client to open the document inspector</p>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
              {[['all', 'All'], ['action', 'Needs action'], ['ready', 'Ready']].map(([id, label]) => (
                <button key={id} onClick={() => setFilter(id)} className={`rounded-md px-2.5 py-1.5 transition ${filter === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {filtered.map((c) => <ClientRow key={c.id} client={c} onOpen={onOpen} onRemind={onRemind} onZip={onZip} />)}
            {filtered.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-500">No clients match.</li>}
          </ul>
        </section>

        {/* Right column */}
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Automated reminder sequence</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Active
              </span>
            </div>
            <ol className="mt-4 space-y-3">
              {REMINDER_STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.day} className="relative flex gap-3">
                    {i < REMINDER_STEPS.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-slate-200" />}
                    <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white"><Icon className="h-3.5 w-3.5 text-indigo-600" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">Day {s.day} · {s.title}</p>
                      <p className="text-xs text-slate-500">{s.channels.join(' + ')} · stops automatically when all slips verify</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Live activity</h2>
            </div>
            <ul className="mt-3 space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="sc-in flex gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[a.tone]}`} />
                  <div>
                    <p className="text-sm leading-snug text-slate-700">{a.text}</p>
                    <p className="text-xs text-slate-400">{a.at}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function ClientRow({ client, onOpen, onRemind, onZip }) {
  const p = progressOf(client);
  const st = clientState(client);
  const Icon = client.kind === 'Corporation' ? Building2 : User;
  return (
    <li
      onClick={() => onOpen(client.id)}
      className="group flex cursor-pointer flex-col gap-3 px-4 py-4 transition hover:bg-slate-50 md:flex-row md:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
          {client.initials}
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5"><Icon className="h-3 w-3 text-slate-400" /></span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-700">{client.name}</p>
          <p className="truncate text-xs text-slate-500">{client.engagement}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:w-[340px]">
        <div className="w-28 shrink-0">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium tabular-nums text-slate-700">{p.done}/{p.total}</span>
            <span className="tabular-nums text-slate-400">{p.pct}%</span>
          </div>
          <ProgressBar pct={p.pct} tone={st.tone} />
        </div>
        <div className="min-w-0 flex-1">
          <ToneChip tone={st.tone}>{st.label}</ToneChip>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{st.detail} · {client.lastActivity}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onRemind(client.id)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700 md:flex-none"
        >
          <Send className="h-3.5 w-3.5" /> 1-Click Reminder
        </button>
        <button
          onClick={() => onZip(client.id)}
          title="Download verified ZIP"
          disabled={p.verified === 0}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40"
        >
          <FolderArchive className="h-4 w-4" />
        </button>
        <ChevronRight className="hidden h-4 w-4 text-slate-300 group-hover:text-slate-500 md:block" />
      </div>
    </li>
  );
}

/* ---------- Drawer / inspector ---------- */

function ClientDrawer({ client, onClose, onRemind, onZip, pushToast }) {
  const [tab, setTab] = useState('docs');
  const [openDoc, setOpenDoc] = useState(() => (client.docs.find(isProblem) || client.docs.find((d) => d.status === 'verified') || client.docs[0]).id);
  const p = progressOf(client);
  const st = clientState(client);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copyLink = () => {
    const link = `https://upload.slipchase.ca/l/${client.id}-${Math.random().toString(36).slice(2, 8)}`;
    try { navigator.clipboard.writeText(link).catch(() => {}); } catch (e) { /* clipboard unavailable */ }
    pushToast({ tone: 'slate', title: 'Magic link copied', body: [link, 'No login required · expires in 14 days'] });
  };

  return (
    <div className="fixed inset-0 z-[65]">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="sc-drawer absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl" role="dialog" aria-label={`${client.name} documents`}>
        <div className="border-b border-slate-200 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600">{client.initials}</div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-slate-900">{client.name}</h2>
                <p className="truncate text-xs text-slate-500">{client.engagement} · {client.city}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{p.done} of {p.total} items complete</span>
              <ToneChip tone={st.tone}>{st.label}</ToneChip>
            </div>
            <ProgressBar pct={p.pct} tone={st.tone} className="mt-2 h-2" />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{p.verified} verified</span>
              {p.missing > 0 && <span>{p.missing} missing</span>}
              {p.problems > 0 && <span className="text-rose-600">{p.problems} flagged</span>}
              <span className="ml-auto">Due {client.due}</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button onClick={() => onRemind(client.id)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 sm:text-sm">
              <Send className="h-4 w-4" /> Remind
            </button>
            <button onClick={() => onZip(client.id)} disabled={p.verified === 0} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 sm:text-sm">
              <Download className="h-4 w-4" /> ZIP
            </button>
            <button onClick={copyLink} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:text-sm">
              <Link2 className="h-4 w-4" /> Link
            </button>
          </div>

          <div className="mt-4 flex gap-4 border-b border-transparent text-sm">
            {[['docs', 'Requested slips', FileText], ['reminders', 'Reminder log', History]].map(([id, label, I]) => (
              <button key={id} onClick={() => setTab(id)} className={`-mb-4 flex items-center gap-1.5 border-b-2 pb-2 font-medium transition ${tab === id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <I className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/60 px-5 py-4">
          {tab === 'docs' ? (
            <ul className="space-y-2">
              {client.docs.map((d) => (
                <DocInspectorRow key={d.id} d={d} open={openDoc === d.id} onToggle={() => setOpenDoc(openDoc === d.id ? null : d.id)} client={client} />
              ))}
            </ul>
          ) : (
            <ReminderLog client={client} />
          )}
        </div>
      </aside>
    </div>
  );
}

function DocInspectorRow({ d, open, onToggle, client }) {
  const S = STATUS[d.status];
  const Icon = S.icon;
  return (
    <li className={`overflow-hidden rounded-xl border bg-white transition ${open ? 'border-indigo-200 shadow-sm' : 'border-slate-200'}`}>
      <button onClick={onToggle} className="flex w-full items-start gap-3 p-3 text-left">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${S.ic}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{d.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {d.status === 'verified' && <>AI verified {d.verifiedAt} · {d.file}</>}
            {d.status === 'pending' && <>Not uploaded yet{d.blocking && <span className="font-medium text-amber-700"> · blocking year-end</span>}</>}
            {isProblem(d) && <>Uploaded {d.uploadedAt} · {d.file}</>}
            {d.status === 'na' && <>Marked not applicable by client</>}
          </p>
        </div>
        <StatusChip status={d.status} className="hidden sm:inline-flex" />
        <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <AnalysisPanel d={d} client={client} />}
    </li>
  );
}

function AnalysisPanel({ d, client }) {
  if (d.status === 'pending' || d.status === 'na' || !d.ai) {
    const last = client.reminders[client.reminders.length - 1];
    return (
      <div className="border-t border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-600">
        {d.status === 'na' ? (
          <p className="flex items-center gap-2"><Info className="h-4 w-4 text-slate-400" /> Client confirmed this item does not apply. Optional item — not required to file.</p>
        ) : (
          <div className="space-y-1.5">
            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> Waiting on client — no file received yet.</p>
            {last && <p className="pl-6 text-xs text-slate-500">Last reminder: {last.step} ({last.at})</p>}
            <p className="pl-6 text-xs text-slate-500">AI will check slip type, tax year ({client.year}) and client name the moment it arrives.</p>
          </div>
        )}
      </div>
    );
  }

  const ok = d.status === 'verified';
  const checks = [
    { label: `Document type matches “${d.code}” request`, pass: d.status !== 'flagged' },
    { label: `Tax year is ${client.year}${d.code === 'NOA' ? ' (NOA: prior year)' : ''}`, pass: d.status !== 'wrongyear' },
    { label: 'Name matches client file', pass: true },
    { label: 'All pages legible', pass: true },
  ];

  return (
    <div className="border-t border-slate-100 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> AI vision analysis
      </div>
      <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
        <SlipPreview d={d} ok={ok} />
        <div className="min-w-0 space-y-3">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div className="col-span-2"><dt className="text-slate-500">Detected document</dt><dd className="font-medium text-slate-900">{d.ai.docType}</dd></div>
            <div><dt className="text-slate-500">Tax year</dt><dd className="font-medium text-slate-900">{d.ai.year}</dd></div>
            <div><dt className="text-slate-500">Issuer</dt><dd className="truncate font-medium text-slate-900">{d.ai.issuer}</dd></div>
          </dl>
          <div>
            <div className="mb-1 flex justify-between text-xs"><span className="text-slate-500">Model confidence</span><span className="font-medium tabular-nums text-slate-700">{d.ai.confidence}%</span></div>
            <ProgressBar pct={d.ai.confidence} tone={ok ? 'emerald' : d.status === 'wrongyear' ? 'amber' : 'rose'} />
          </div>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-100">
              {d.ai.fields.map(([k, v]) => (
                <tr key={k}><td className="py-1 pr-2 text-slate-500">{k}</td><td className="py-1 text-right font-medium tabular-nums text-slate-900">{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ul className="mt-3 grid gap-1 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            {c.pass ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className={`h-3.5 w-3.5 ${d.status === 'wrongyear' ? 'text-amber-600' : 'text-rose-600'}`} />}
            {c.label}
          </li>
        ))}
      </ul>
      {d.ai.note && (
        <p className={`mt-3 rounded-lg p-2.5 text-xs leading-relaxed ${d.status === 'wrongyear' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-700'}`}>{d.ai.note}</p>
      )}
      <p className="mt-3 text-[11px] text-slate-400">Uploaded {d.uploadedAt}{d.verifiedAt ? ` · Verified ${d.verifiedAt}` : ''} · {d.file} · {(d.sizeKb / 1024).toFixed(1)} MB</p>
    </div>
  );
}

function SlipPreview({ d, ok }) {
  const box = ok ? 'border-emerald-500 bg-emerald-400/10' : d.status === 'wrongyear' ? 'border-amber-500 bg-amber-400/10' : 'border-rose-500 bg-rose-400/10';
  return (
    <div className="relative mx-auto aspect-[3/4] w-[150px] overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-2.5 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="h-2 w-10 rounded bg-slate-300" />
        <span className="rounded bg-slate-800 px-1 text-[8px] font-bold text-white">{d.code.slice(0, 5)}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-16 rounded bg-slate-200" />
      <div className={`relative mt-2 rounded border-2 border-dashed p-1 ${box}`}>
        <div className="h-1.5 w-12 rounded bg-slate-300" />
        <div className="mt-1 h-1.5 w-8 rounded bg-slate-200" />
        <span className="absolute -top-2 right-1 rounded bg-white px-0.5 text-[7px] font-semibold text-slate-500">YEAR {d.ai.year}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-4 rounded border ${i === 0 ? box : 'border-slate-200 bg-white'}`} />
        ))}
      </div>
      <div className="mt-2 space-y-1">
        <div className="h-1 w-full rounded bg-slate-200" />
        <div className="h-1 w-5/6 rounded bg-slate-200" />
        <div className="h-1 w-4/6 rounded bg-slate-200" />
      </div>
      <div className={`absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-center gap-1 rounded py-0.5 text-[8px] font-semibold text-white ${ok ? 'bg-emerald-600' : d.status === 'wrongyear' ? 'bg-amber-500' : 'bg-rose-600'}`}>
        {ok ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
        {ok ? 'FIELDS EXTRACTED' : 'REJECTED'}
      </div>
    </div>
  );
}

function ReminderLog({ client }) {
  const p = progressOf(client);
  const next = REMINDER_STEPS[Math.min(client.reminders.length, REMINDER_STEPS.length - 1)];
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next automated step</p>
        {p.done === p.total ? (
          <p className="mt-1 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Sequence stopped — all items complete.</p>
        ) : (
          <p className="mt-1 text-sm text-slate-800">Day {next.day} · {next.title} <span className="text-slate-500">({next.channels.join(' + ')})</span></p>
        )}
      </div>
      <ol className="space-y-2">
        {[...client.reminders].reverse().map((r, i) => (
          <li key={i} className="sc-in flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600"><Send className="h-3.5 w-3.5" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">{r.step}</p>
              <p className="text-xs text-slate-500">{r.at} · {r.channels.join(' + ')}{r.manual ? ' · sent manually' : ' · automatic'}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- ZIP packaging modal ---------- */

const ZIP_STEPS = ['Collecting AI-verified documents', 'Converting images to searchable PDF', 'Renaming to firm naming convention', 'Building client folder structure', 'Writing verification audit log'];

function ZipModal({ client, onClose, pushToast, logActivity }) {
  const [step, setStep] = useState(0);
  const verified = client.docs.filter((d) => d.status === 'verified');
  const excluded = client.docs.filter((d) => d.status !== 'verified' && d.status !== 'na');
  const [last, first] = [client.name.split(' ').slice(-1)[0], client.name.split(' ')[0]];
  const root = client.kind === 'Corporation'
    ? `${client.year}_${slug(client.name.replace(/Ltd\.?/, 'Ltd'))}_${client.code}`
    : `${client.year}_${last}-${first}_${client.code}`;
  const done = step >= ZIP_STEPS.length;

  useEffect(() => {
    if (done) return undefined;
    const t = setTimeout(() => setStep((s) => s + 1), 420);
    return () => clearTimeout(t);
  }, [step, done]);

  const tree = useMemo(() => {
    const groups = {};
    verified.forEach((d) => {
      // Generic issuers ("Foreign employer", "Multiple providers") add noise to the file name.
      const issuer = d.ai && !/foreign|landlord|multiple|self|software|chartered/i.test(d.ai.issuer) ? `_${slug(d.ai.issuer)}` : '';
      (groups[d.folder] = groups[d.folder] || []).push(`${d.code}${issuer}_${d.ai ? d.ai.year : client.year}.pdf`);
    });
    return Object.keys(groups).sort().map((f) => [f, groups[f]]);
  }, [verified, client.year]);

  const totalMb = (verified.reduce((n, d) => n + d.sizeKb, 0) * 0.62 / 1024).toFixed(1);

  const save = () => {
    pushToast({ tone: 'emerald', title: 'Verified ZIP downloaded', body: [`${root}.zip · ${verified.length} PDFs · ${totalMb} MB`, 'Includes _Verification-Log.csv for your working papers'] });
    logActivity(`Verified ZIP exported for ${client.name} (${verified.length} files).`, 'emerald');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="sc-in relative w-full max-w-lg rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" role="dialog" aria-label="Download verified ZIP">
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><FolderArchive className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Download verified ZIP</h3>
              <p className="text-xs text-slate-500">{client.name} · {client.engagement}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
          <ol className="space-y-1.5">
            {ZIP_STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2 text-sm">
                {i < step ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                <span className={i <= step ? 'text-slate-800' : 'text-slate-400'}>{s}</span>
              </li>
            ))}
          </ol>

          {done && (
            <div className="sc-in rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[12px] leading-6 text-slate-700">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900"><Folder className="h-4 w-4 text-indigo-500" /> {root}/</div>
              {tree.map(([folder, files]) => (
                <div key={folder} className="pl-4">
                  <div className="flex items-center gap-1.5"><Folder className="h-3.5 w-3.5 text-amber-500" /> {folder}/</div>
                  {files.map((f) => <div key={f} className="flex items-center gap-1.5 truncate pl-5 text-slate-600"><File className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {f}</div>)}
                </div>
              ))}
              <div className="flex items-center gap-1.5 pl-4 text-slate-600"><File className="h-3.5 w-3.5 text-emerald-500" /> _Verification-Log.csv</div>
            </div>
          )}

          {done && excluded.length > 0 && (
            <p className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {excluded.length} item{excluded.length > 1 ? 's' : ''} not yet verified and excluded: {excluded.map((d) => d.code).join(', ')}.
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-slate-200 p-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={!done} className="inline-flex flex-[2] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">
            {done ? <><Download className="h-4 w-4" /> Save ZIP</> : <><Loader2 className="h-4 w-4 animate-spin" /> Packaging…</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   Client magic-link portal (David Chen)
   ========================================================================== */

// What a correct upload looks like for each checklist item.
const VALID_RESULTS = {
  t4: {
    msg: 'AI Verified: Valid 2025 T4 (Employer: Metro Tech, Box 14: $74,200). Matched to checklist item.',
    file: 'T4_MetroTech_2025.jpg',
    ai: ai('T4 Statement of Remuneration Paid', '2025', 'Metro Tech', [['Box 14 — Employment income', '$74,200.00'], ['Box 22 — Income tax deducted', '$13,486.50']], 99),
  },
  t5: {
    msg: 'AI Verified: Valid 2025 T5 (Payer: Harbourline Credit Union, Box 13: $1,184.22). Matched to checklist item.',
    file: 'T5_Harbourline_2025.pdf',
    ai: ai('T5 Statement of Investment Income', '2025', 'Harbourline Credit Union', [['Box 13 — Interest from Canadian sources', '$1,184.22']], 98),
  },
  t2202: {
    msg: 'AI Verified: Valid 2025 T2202 (Institution: Langara College, Box 23: $1,860). Matched to checklist item.',
    file: 'T2202_2025.pdf',
    ai: ai('T2202 Tuition and Enrolment Certificate', '2025', 'Langara College', [['Box 23 — Eligible tuition fees', '$1,860.00']], 97),
  },
  rrsp: {
    msg: 'AI Verified: Valid RRSP Contribution Receipt (Issuer: Harbourline Credit Union, $6,500 contributed Feb 14, 2026 — first-60-days period). Matched to checklist item.',
    file: 'RRSP_receipt_Feb2026.pdf',
    ai: ai('RRSP Contribution Receipt', '2025', 'Harbourline Credit Union', [['Contribution amount', '$6,500.00'], ['Contribution date', 'Feb 14, 2026'], ['Period', 'First 60 days of 2026']], 98),
  },
  noa: {
    msg: 'AI Verified: Valid 2024 Notice of Assessment (Issued by CRA, 2025 RRSP deduction limit found). Matched to checklist item.',
    file: 'NOA_2024.pdf',
    ai: ai('Notice of Assessment', '2024', 'Canada Revenue Agency', [['Tax year assessed', '2024'], ['RRSP deduction limit statement', 'Present']], 99),
  },
};

const MISMATCH_MSG = 'Mismatch Detected: The uploaded file is a T5 (Investment Income), but was uploaded under RRSP Receipts. Please upload your official financial institution RRSP contribution receipt.';
const WRONG_YEAR_MSG = 'Incorrect Tax Year: This slip is dated tax year 2023. Your accountant requires documents for the 2025 tax year.';
const SCAN_STEPS = ['Enhancing image & reading text…', 'Identifying slip type…', 'Checking tax year & your name…'];

function ClientPortal({ client, updateDoc, logActivity }) {
  const firstOpen = client.docs.find((d) => d.status === 'pending') || client.docs.find(isProblem) || client.docs[0];
  const [targetId, setTargetId] = useState(firstOpen.id);
  const [scanning, setScanning] = useState(null); // { itemId, step }
  const [result, setResult] = useState(null); // { tone, msg, itemId }
  const [dragOver, setDragOver] = useState(false);
  const timers = useRef([]);
  const uploadRef = useRef(null);
  const fileRef = useRef(null);
  const camRef = useRef(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const p = progressOf(client);
  const target = client.docs.find((d) => d.id === targetId);
  const allDone = p.done === p.total;

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const runScan = (itemId, outcome, fileName) => {
    if (scanning) return;
    setResult(null);
    setScanning({ itemId, step: 0 });
    later(() => setScanning((s) => s && { ...s, step: 1 }), SCAN_MS / 3);
    later(() => setScanning((s) => s && { ...s, step: 2 }), (SCAN_MS * 2) / 3);
    later(() => {
      const item = client.docs.find((d) => d.id === itemId);
      const keepVerified = item.status === 'verified';
      const at = stamp();
      if (outcome === 'valid') {
        const v = VALID_RESULTS[itemId];
        updateDoc(itemId, { status: 'verified', file: fileName || v.file, uploadedAt: at, verifiedAt: at, ai: v.ai, sizeKb: 1180 });
        setResult({ tone: 'success', msg: v.msg, itemId });
        logActivity(`David Chen uploaded ${item.code} — AI verified and filed automatically.`, 'emerald');
      } else if (outcome === 'mismatch') {
        if (!keepVerified) {
          updateDoc(itemId, {
            status: 'flagged', file: 'T5_upload.jpg', uploadedAt: at, verifiedAt: null, sizeKb: 1020,
            ai: ai('T5 Statement of Investment Income', '2025', 'Harbourline Credit Union', [['Detected form', 'T5'], ['Expected form', 'RRSP contribution receipt']], 97, MISMATCH_MSG),
          });
        }
        setResult({ tone: 'error', msg: MISMATCH_MSG, itemId, kept: keepVerified });
        logActivity(`David Chen — AI rejected upload under RRSP (T5 detected). Client asked to re-upload.`, 'rose');
      } else {
        if (!keepVerified) {
          updateDoc(itemId, {
            status: 'wrongyear', file: 'slip_2023.jpg', uploadedAt: at, verifiedAt: null, sizeKb: 990,
            ai: ai(`${item.code} (prior year)`, '2023', 'Detected from slip header', [['Tax year on slip', '2023'], ['Required tax year', item.id === 'noa' ? '2024' : '2025']], 98, WRONG_YEAR_MSG),
          });
        }
        setResult({ tone: 'warning', msg: WRONG_YEAR_MSG, itemId, kept: keepVerified });
        logActivity(`David Chen — AI caught a 2023 slip uploaded under ${item.code}.`, 'amber');
      }
      setScanning(null);
    }, SCAN_MS);
  };

  const chooseTarget = (id) => {
    setTargetId(id);
    setResult(null);
    if (uploadRef.current && window.innerWidth < 1024) uploadRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onFiles = (files) => {
    if (files && files[0]) runScan(targetId, 'valid', files[0].name);
  };

  const selectable = client.docs.filter((d) => d.status !== 'na');
  const testBtnBase = 'group flex w-full items-start gap-2.5 rounded-lg border bg-white p-2.5 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      {/* Firm header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-600 text-xs font-bold text-white">OB</div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">{FIRM}</p>
            <p className="text-[11px] text-slate-500">Secure document request</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <Lock className="h-3 w-3" /> Secure link
        </span>
      </div>

      {/* Welcome + progress */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-indigo-700 px-5 py-6 text-white sm:px-7">
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">2025 tax season</p>
          <h1 className="mt-1 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
            Welcome David Chen — Let's collect your 2025 tax slips for {FIRM}.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-indigo-100">
            No account or password needed. Snap a photo or upload a PDF — our AI checks each slip instantly, so you won't get a "wrong document" email later.
          </p>
        </div>
        <div className="px-5 py-4 sm:px-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{p.done} <span className="text-base font-normal text-slate-500">of {p.total} Slips Verified</span></p>
              <p className="text-xs text-slate-500">{p.verified} verified · {client.docs.filter((d) => d.status === 'na').length} not applicable{p.problems ? ` · ${p.problems} need attention` : ''}</p>
            </div>
            <p className="hidden items-center gap-1 text-xs text-slate-500 sm:flex"><Calendar className="h-3.5 w-3.5" /> Requested by Mar 31, 2026</p>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={p.pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out" style={{ width: `${p.pct}%` }} />
          </div>
        </div>
      </div>

      {allDone && (
        <div className="sc-in mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <PartyPopper className="h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-900">You're all set, David!</p>
            <p className="text-sm text-emerald-800">Every slip is verified. {FIRM} has been notified and reminders have stopped.</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Checklist */}
        <section className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Your checklist</h2>
          <ul className="space-y-2.5">
            {client.docs.map((d, i) => (
              <ChecklistItem
                key={d.id}
                index={i + 1}
                d={scanning && scanning.itemId === d.id ? { ...d, status: 'scanning' } : d}
                selected={targetId === d.id}
                onUpload={() => chooseTarget(d.id)}
                onToggleNA={() => {
                  updateDoc(d.id, { status: d.status === 'na' ? 'pending' : 'na' });
                  if (d.status === 'na') chooseTarget(d.id);
                }}
              />
            ))}
          </ul>
        </section>

        {/* Upload panel */}
        <section ref={uploadRef} className="scroll-mt-24 lg:col-span-2">
          <div className="space-y-3 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Upload a document</h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600"><Sparkles className="h-3.5 w-3.5" /> AI check in ~1 sec</span>
              </div>

              <label className="mt-3 block text-xs font-medium text-slate-500" htmlFor="sc-target">This file is for</label>
              <select
                id="sc-target"
                value={targetId}
                onChange={(e) => { setTargetId(e.target.value); setResult(null); }}
                disabled={!!scanning}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {selectable.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} — {STATUS[d.status].label}</option>
                ))}
              </select>

              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
                className={`relative mt-3 overflow-hidden rounded-xl border-2 border-dashed p-5 text-center transition ${scanning ? 'border-indigo-300 bg-indigo-50/60' : dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50/60'}`}
              >
                {scanning ? (
                  <div className="py-2">
                    <div className="relative mx-auto h-20 w-16 rounded-md border border-indigo-200 bg-white shadow-sm">
                      <div className="space-y-1.5 p-2">
                        <div className="h-1.5 w-8 rounded bg-slate-200" /><div className="h-1.5 w-10 rounded bg-slate-200" />
                        <div className="h-1.5 w-6 rounded bg-slate-200" /><div className="h-1.5 w-9 rounded bg-slate-200" />
                      </div>
                      <div className="absolute inset-x-0 h-0.5 bg-indigo-500 shadow-[0_0_12px_2px_rgba(99,102,241,0.6)]" style={{ animation: `sc-scan ${SCAN_MS}ms ease-in-out infinite` }} />
                    </div>
                    <p className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-indigo-700">
                      <Loader2 className="h-4 w-4 animate-spin" /> Scanning with AI vision…
                    </p>
                    <p className="mt-1 text-xs text-indigo-500">{SCAN_STEPS[scanning.step]}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-7 w-7 text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {target && target.status === 'verified' ? `Replace your ${target.code}` : `Add your ${target ? target.code : 'slip'}`}
                    </p>
                    <p className="text-xs text-slate-500">Photo, PDF or screenshot · drag & drop on desktop</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={() => camRef.current && camRef.current.click()} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                        <Camera className="h-4 w-4" /> Take photo
                      </button>
                      <button onClick={() => fileRef.current && fileRef.current.click()} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <FileText className="h-4 w-4" /> Choose file
                      </button>
                    </div>
                    <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
                    <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
                  </>
                )}
              </div>

              {result && <ResultBanner result={result} client={client} />}
            </div>

            {/* Demo tester */}
            <div className="rounded-2xl border border-dashed border-violet-300 bg-violet-50/50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700">
                <Zap className="h-3.5 w-3.5" /> Demo: test the AI verifier
              </p>
              <p className="mt-1 text-xs text-violet-700/80">Simulates a {SCAN_MS / 1000}s scan. Uploads go to the item selected above (test 2 always targets RRSP).</p>
              <div className="mt-3 space-y-2">
                <button disabled={!!scanning} onClick={() => runScan(targetId, 'valid')} className={`${testBtnBase} border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50`}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span><span className="block font-semibold text-slate-800">Upload Valid Slip ({target ? target.code : 'T4'})</span><span className="text-slate-500">Correct type & year → auto-verified, progress increases</span></span>
                </button>
                <button disabled={!!scanning} onClick={() => { setTargetId('rrsp'); runScan('rrsp', 'mismatch'); }} className={`${testBtnBase} border-rose-200 hover:border-rose-400 hover:bg-rose-50`}>
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span><span className="block font-semibold text-slate-800">Upload Mismatched Document (T5 instead of RRSP)</span><span className="text-slate-500">Wrong slip type → rejected with fix instructions</span></span>
                </button>
                <button disabled={!!scanning} onClick={() => runScan(targetId, 'wrongyear')} className={`${testBtnBase} border-amber-200 hover:border-amber-400 hover:bg-amber-50`}>
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span><span className="block font-semibold text-slate-800">Upload Outdated Year Document (2023 Slip)</span><span className="text-slate-500">Prior-year slip → caught before your accountant sees it</span></span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-10 flex flex-col items-center gap-1 text-center text-[11px] text-slate-400">
        <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Encrypted upload · link expires in 14 days · powered by SlipChase</p>
        <p>Questions? Reply to the text from {FIRM}.</p>
      </footer>
    </div>
  );
}

function ChecklistItem({ index, d, selected, onUpload, onToggleNA }) {
  const S = STATUS[d.status];
  const Icon = S.icon;
  const needsAction = d.status === 'pending' || isProblem(d);
  const border = isProblem(d)
    ? d.status === 'wrongyear' ? 'border-amber-200' : 'border-rose-200'
    : selected ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200';
  return (
    <li className={`rounded-xl border bg-white p-3.5 shadow-sm transition sm:p-4 ${border}`}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center">
          <Icon className={`h-6 w-6 ${S.ic}`} />
          <span className="mt-1 text-[10px] font-medium tabular-nums text-slate-400">{index}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className={`text-sm font-semibold leading-snug ${d.status === 'na' ? 'text-slate-500' : 'text-slate-900'}`}>{d.name}</p>
          </div>
          {d.desc && <p className="mt-0.5 text-xs text-slate-500">{d.desc}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusChip status={d.status} />
            {d.optional && <span className="text-[11px] text-slate-400">Optional</span>}
            {d.status === 'verified' && d.file && <span className="truncate text-[11px] text-slate-400">{d.file} · {d.verifiedAt}</span>}
          </div>
          {isProblem(d) && d.ai && d.ai.note && (
            <p className={`mt-2 rounded-lg p-2 text-xs leading-relaxed ${d.status === 'wrongyear' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-700'}`}>{d.ai.note}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {needsAction && (
              <button onClick={onUpload} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium shadow-sm ${isProblem(d) ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                <Upload className="h-3.5 w-3.5" /> {isProblem(d) ? 'Re-upload' : 'Upload'}
              </button>
            )}
            {d.status === 'verified' && (
              <button onClick={onUpload} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                <RotateCcw className="h-3.5 w-3.5" /> Replace
              </button>
            )}
            {d.optional && d.status !== 'scanning' && d.status !== 'verified' && (
              <button onClick={onToggleNA} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                {d.status === 'na' ? 'Actually, I have one' : "Doesn't apply to me"}
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function ResultBanner({ result, client }) {
  const item = client.docs.find((d) => d.id === result.itemId);
  const cfg = {
    success: { wrap: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: CheckCircle2, ic: 'text-emerald-600', title: 'Verified' },
    error: { wrap: 'border-rose-200 bg-rose-50 text-rose-900', icon: XCircle, ic: 'text-rose-600', title: 'Upload rejected' },
    warning: { wrap: 'border-amber-200 bg-amber-50 text-amber-900', icon: AlertTriangle, ic: 'text-amber-600', title: 'Check the year' },
  }[result.tone];
  const Icon = cfg.icon;
  return (
    <div className={`sc-in mt-3 rounded-xl border p-3 ${cfg.wrap}`} role="status">
      <div className="flex gap-2.5">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.ic}`} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{cfg.title} · {item ? item.code : ''}</p>
          <p className="mt-0.5 text-sm leading-relaxed">{result.msg}</p>
          {result.kept && <p className="mt-1 text-xs opacity-75">Your previously verified file was kept.</p>}
          {result.tone === 'success' && <p className="mt-1 text-xs opacity-75">Sent securely to {FIRM}. Nothing else needed for this item.</p>}
        </div>
      </div>
    </div>
  );
}
