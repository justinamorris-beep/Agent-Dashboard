'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────
type Recruit = {
  id: string
  name: string
  phone: string
  email: string
  license_status: 'new_licensee' | 'already_licensed'
  created_at: string
  is_complete: boolean
}
type Progress = { recruit_id: string; step_key: string; checked: boolean; checked_at: string | null }

// ── Onboarding steps definition ────────────────────────
const PHASES = [
  {
    id: 'phase1',
    label: 'Phase 1 — Pre-licensing & hire',
    steps: [
      { key: 'pre_licensing_hiring', label: 'Pre-licensing to hiring', note: 'Review requirements and start paperwork', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'new_recruit_form', label: 'New recruit form completed', note: 'Collect all recruit information', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
    ],
  },
  {
    id: 'phase2',
    label: 'Phase 2 — Pre-onboarding',
    steps: [
      { key: 'pre_onboarding_checklist', label: 'Pre-onboarding checklist sent to recruit', note: 'Items to complete before Day 1', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'onboarding_packet', label: 'Onboarding packet prepared', note: 'Welcome materials and forms ready', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
    ],
  },
  {
    id: 'phase3',
    label: 'Phase 3 — Onboarding (Day 1)',
    steps: [
      { key: 'onboarding_checklist_staff', label: 'Onboarding checklist completed (staff)', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'welcome_orientation', label: 'Welcome orientation completed', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'broker_orientation', label: 'Broker orientation completed', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'tech_orientation', label: 'Tech orientation completed', note: 'KW Command, Canva, Docusign setup', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'logins_setup', label: 'Logins set up', note: 'Command, Canva, KW email confirmed', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'alarm_codes', label: 'Alarm codes issued — KGM', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
    ],
  },
  {
    id: 'phase4',
    label: 'Phase 4 — Post-onboarding (recruit tasks)',
    steps: [
      { key: 'post_onboarding_checklist', label: 'Post-onboarding checklist completed (recruit)', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'post_onboarding_actions', label: 'Post-onboarding actions completed (recruit)', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'post_onboarding_survey', label: 'Post-onboarding survey sent to recruit', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'associate_post_email', label: 'Associate post-onboarding email sent', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
    ],
  },
  {
    id: 'phase5',
    label: 'Phase 5 — Post-onboarding (staff tasks)',
    steps: [
      { key: 'onboarding_completed_form', label: 'Onboarding completed form submitted (staff)', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'onboarding_completed_responses', label: 'Onboarding completed responses reviewed', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'survey_responses_filed', label: 'Post-onboarding survey responses reviewed', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'employee_post_email', label: 'Employee post-onboarding email sent', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'new_recruit_responses', label: 'New recruit responses filed', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
    ],
  },
  {
    id: 'phase6',
    label: 'Phase 6 — Ongoing & follow-up',
    steps: [
      { key: 'onboarding_sops', label: 'Onboarding SOPs reviewed with recruit', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
      { key: 'offboarding_on_file', label: 'Offboarding checklist on file (if applicable)', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRap3WB3h75E1Iu5FznC_Ri32voqhNlzlrtyR0T3ZAIXQTncWC0JqqyQzZbwNZVBjYDDFcfs9Xu6OP1/pubhtml' },
    ],
  },
]

const ALL_STEPS = PHASES.flatMap(p => p.steps)
const TOTAL_STEPS = ALL_STEPS.length

// ── Component ──────────────────────────────────────────
export default function OnboardingPage() {
  const [authorized, setAuthorized] = useState(false)
  const [recruits, setRecruits] = useState<Recruit[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set(['phase3']))
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', license_status: 'new_licensee' as const })
  const router = useRouter()
  const supabase = createClient()

  const selected = recruits.find(r => r.id === selectedId) ?? null
  const myProgress = progress.filter(p => p.recruit_id === selectedId)

  const loadData = useCallback(async () => {
    const [recs, prog] = await Promise.all([
      supabase.from('recruits').select('*').order('created_at', { ascending: false }),
      supabase.from('onboarding_progress').select('*'),
    ])
    if (recs.data) { setRecruits(recs.data); if (!selectedId && recs.data.length > 0) setSelectedId(recs.data[0].id) }
    if (prog.data) setProgress(prog.data)
  }, [supabase, selectedId])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
      if (role?.role !== 'admin') { router.push('/'); return }
      setAuthorized(true)
      await loadData()
    }
    init()
  }, [router, supabase, loadData])

  // ── Toggle a step ──
  async function toggleStep(stepKey: string) {
    if (!selectedId) return
    const existing = myProgress.find(p => p.step_key === stepKey)
    const newChecked = !existing?.checked

    // Optimistic update
    setProgress(prev => {
      const without = prev.filter(p => !(p.recruit_id === selectedId && p.step_key === stepKey))
      return [...without, { recruit_id: selectedId, step_key: stepKey, checked: newChecked, checked_at: newChecked ? new Date().toISOString() : null }]
    })

    await supabase.from('onboarding_progress').upsert({
      recruit_id: selectedId,
      step_key: stepKey,
      checked: newChecked,
      checked_at: newChecked ? new Date().toISOString() : null,
    }, { onConflict: 'recruit_id,step_key' })

    // Check if all steps done → mark complete
    const updatedProgress = progress.map(p =>
      p.recruit_id === selectedId && p.step_key === stepKey ? { ...p, checked: newChecked } : p
    )
    const recruitsProgress = updatedProgress.filter(p => p.recruit_id === selectedId && p.checked)
    if (recruitsProgress.length === TOTAL_STEPS) {
      await supabase.from('recruits').update({ is_complete: true, completed_at: new Date().toISOString() }).eq('id', selectedId)
      await loadData()
      // Email notification is handled by Supabase Edge Function webhook on is_complete = true
    }
  }

  // ── Create recruit ──
  async function createRecruit() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('recruits').insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      license_status: form.license_status,
      created_by: user?.id,
    }).select().single()
    if (!error && data) {
      setSelectedId(data.id)
      setForm({ name: '', phone: '', email: '', license_status: 'new_licensee' })
      setShowForm(false)
      await loadData()
    }
    setSaving(false)
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/auth') }

  // ── Helpers ──
  function isChecked(stepKey: string) {
    return myProgress.find(p => p.step_key === stepKey)?.checked ?? false
  }
  function phaseProgress(phaseId: string) {
    const phase = PHASES.find(p => p.id === phaseId)!
    const done = phase.steps.filter(s => isChecked(s.key)).length
    return { done, total: phase.steps.length }
  }
  function phaseDot(phaseId: string): 'done' | 'active' | 'todo' {
    const { done, total } = phaseProgress(phaseId)
    if (done === total) return 'done'
    if (done > 0) return 'active'
    return 'todo'
  }
  function overallPct() {
    if (!selectedId) return 0
    const done = myProgress.filter(p => p.checked).length
    return Math.round((done / TOTAL_STEPS) * 100)
  }
  function togglePhase(phaseId: string) {
    setOpenPhases(prev => {
      const next = new Set(prev)
      if (next.has(phaseId)) next.delete(phaseId)
      else next.add(phaseId)
      return next
    })
  }
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  function recruitCompletedSteps(recruitId: string) {
    return progress.filter(p => p.recruit_id === recruitId && p.checked).length
  }
  function recruitPct(recruitId: string) {
    return Math.round((recruitCompletedSteps(recruitId) / TOTAL_STEPS) * 100)
  }

  if (!authorized) return (
    <div className="min-h-screen bg-kw-black flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse tracking-widest">Checking access…</p>
    </div>
  )

  const pct = overallPct()
  const circumference = 2 * Math.PI * 18
  const strokeDash = (pct / 100) * circumference

  return (
    <div className="min-h-screen bg-[#f4f4f2]">

      {/* Header */}
      <header className="bg-kw-black py-5 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-condensed text-5xl font-black text-kw-red italic leading-none">kw</span>
            <div>
              <p className="text-white font-condensed font-bold text-lg leading-tight tracking-wide">KELLER WILLIAMS</p>
              <p className="text-gray-400 font-condensed text-xs tracking-widest">ARIZONA LIVING REALTY</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">← Admin dashboard</Link>
            <button onClick={signOut} className="text-gray-400 hover:text-white text-sm transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <div className="bg-kw-black pb-8 px-6">
        <div className="max-w-5xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="font-condensed text-4xl font-black text-white tracking-wide">MC Onboarding Tracker</h1>
            <p className="text-gray-500 text-sm mt-1">Track every recruit from pre-licensing to post-onboarding</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-kw px-5 py-2.5 rounded-lg text-sm font-semibold mb-1"
          >
            + New recruit
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* New recruit form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="bg-kw-black rounded-t-2xl px-6 py-4 flex items-center justify-between">
                <h2 className="font-condensed font-bold text-white text-lg">New recruit</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full name *</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-kw-red transition-colors"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sarah Mitchell" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-kw-red transition-colors"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(928) 555-0100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                  <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-kw-red transition-colors"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="recruit@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">License status *</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 border rounded-xl p-3 cursor-pointer transition-colors text-center ${form.license_status === 'new_licensee' ? 'border-kw-red bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" className="sr-only" value="new_licensee" checked={form.license_status === 'new_licensee'} onChange={() => setForm(f => ({ ...f, license_status: 'new_licensee' }))} />
                      <span className="block text-sm font-semibold text-kw-black">New licensee</span>
                      <span className="block text-xs text-gray-500 mt-1">Getting license now</span>
                    </label>
                    <label className={`flex-1 border rounded-xl p-3 cursor-pointer transition-colors text-center ${form.license_status === 'already_licensed' ? 'border-kw-red bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" className="sr-only" value="already_licensed" checked={form.license_status === 'already_licensed'} onChange={() => setForm(f => ({ ...f, license_status: 'already_licensed' }))} />
                      <span className="block text-sm font-semibold text-kw-black">Already licensed</span>
                      <span className="block text-xs text-gray-500 mt-1">Has active license</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={createRecruit} disabled={!form.name.trim() || saving}
                    className="flex-1 btn-kw py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
                    {saving ? 'Creating…' : 'Create recruit'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recruit list */}
        {recruits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 mb-4">No recruits yet.</p>
            <button onClick={() => setShowForm(true)} className="btn-kw px-6 py-2.5 rounded-lg text-sm font-semibold">
              + Add your first recruit
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Active recruits</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recruits.map(r => {
                  const pct = recruitPct(r.id)
                  const barColor = r.is_complete ? '#1D9E75' : pct > 50 ? '#EF9F27' : '#e24b4a'
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`flex-shrink-0 text-left bg-white border rounded-xl p-3 min-w-[160px] max-w-[180px] transition-all ${selectedId === r.id ? 'border-kw-red shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-kw-black truncate">{r.name}</span>
                        {r.is_complete && <span className="text-xs text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full shrink-0">✓</span>}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">{fmtDate(r.created_at)}</div>
                      <div className="text-xs text-gray-400 mb-1.5">{r.license_status === 'new_licensee' ? 'New licensee' : 'Already licensed'}</div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{pct}% complete</div>
                    </button>
                  )
                })}
                <button onClick={() => setShowForm(true)}
                  className="flex-shrink-0 min-w-[140px] border border-dashed border-gray-300 rounded-xl p-3 text-gray-400 hover:border-kw-red hover:text-kw-red transition-colors flex flex-col items-center justify-center gap-1">
                  <span className="text-xl font-light">+</span>
                  <span className="text-xs">New recruit</span>
                </button>
              </div>
            </div>

            {/* Selected recruit detail */}
            {selected && (
              <div className="space-y-5">
                {/* Recruit info + progress ring */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start">
                  {/* Progress ring */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="relative w-16 h-16">
                      <svg width="64" height="64" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="22" cy="22" r="18" fill="none" stroke="#f0f0ee" strokeWidth="4" />
                        <circle cx="22" cy="22" r="18" fill="none"
                          stroke={selected.is_complete ? '#1D9E75' : pct > 50 ? '#EF9F27' : '#e24b4a'}
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${strokeDash} ${circumference}`} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-semibold text-xs text-kw-black">{pct}%</div>
                    </div>
                    <div>
                      <p className="font-bold text-kw-black text-base">{selected.name}</p>
                      <p className="text-xs text-gray-500">{selected.license_status === 'new_licensee' ? 'New licensee' : 'Already licensed'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Started {fmtDate(selected.created_at)}</p>
                    </div>
                  </div>

                  {/* Recruit info grid */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1 text-sm border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-5">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                      <p className="font-medium text-kw-black">{selected.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Email</p>
                      <p className="font-medium text-kw-black truncate">{selected.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Steps done</p>
                      <p className="font-medium text-kw-black">{myProgress.filter(p => p.checked).length} of {TOTAL_STEPS}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Status</p>
                      {selected.is_complete
                        ? <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Complete ✓</span>
                        : <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">In progress</span>}
                    </div>
                  </div>
                </div>

                {/* Phases & steps */}
                <div className="space-y-3">
                  {PHASES.map(phase => {
                    const { done, total } = phaseProgress(phase.id)
                    const dot = phaseDot(phase.id)
                    const isOpen = openPhases.has(phase.id)
                    return (
                      <div key={phase.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => togglePhase(phase.id)}
                          className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          {/* Phase dot */}
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot === 'done' ? 'bg-green-500' : dot === 'active' ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                          <span className="font-semibold text-sm text-kw-black flex-1">{phase.label}</span>
                          <span className="text-xs text-gray-400">{done} / {total}</span>
                          {done === total && <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-semibold">Done</span>}
                          <span className={`text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ display: 'inline-block' }}>▾</span>
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-100">
                            {phase.steps.map((step, i) => {
                              const checked = isChecked(step.key)
                              return (
                                <div
                                  key={step.key}
                                  className={`flex items-center gap-3 px-5 py-3 ${i < phase.steps.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}
                                >
                                  {/* Checkbox */}
                                  <button
                                    onClick={() => toggleStep(step.key)}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-kw-red'}`}
                                  >
                                    {checked && <span className="text-white text-xs font-bold">✓</span>}
                                  </button>
                                  {/* Label */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${checked ? 'line-through text-gray-400' : 'text-kw-black'}`}>{step.label}</p>
                                    {'note' in step && step.note && <p className="text-xs text-gray-400 mt-0.5">{step.note as string}</p>}
                                  </div>
                                  {/* Open link */}
                                  <a
                                    href={step.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-kw-red font-semibold hover:underline shrink-0 ml-2"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    Open ↗
                                  </a>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-kw-black mt-16 py-8 px-6 text-center">
        <span className="font-condensed text-3xl font-black text-kw-red italic">kw</span>
        <p className="text-gray-600 text-xs mt-2">© {new Date().getFullYear()} KW Arizona Living Realty — MC 788</p>
      </footer>
    </div>
  )
}
