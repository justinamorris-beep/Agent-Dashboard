'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Category = { id: string; name: string; sort_order: number }
type Resource = { id: string; name: string; description: string; url: string; category_id: string; is_featured: boolean; sort_order: number }
type Announcement = { id: string; message: string; is_active: boolean }
type Event = { id: string; title: string; description: string; event_date: string; event_time: string; location: string; rsvp_url: string; is_active: boolean }
type Partner = { id: string; name: string; description: string; category: string; phone: string; website_url: string; sort_order: number }
type UserRole = { id: string; user_id: string; role: string }

type Tab = 'resources' | 'categories' | 'announcements' | 'events' | 'partners' | 'users'

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [tab, setTab] = useState<Tab>('resources')
  const [categories, setCategories] = useState<Category[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [users, setUsers] = useState<UserRole[]>([])
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Form states
  const [resForm, setResForm] = useState<Partial<Resource>>({})
  const [catForm, setCatForm] = useState<Partial<Category>>({})
  const [annForm, setAnnForm] = useState<Partial<Announcement>>({})
  const [evtForm, setEvtForm] = useState<Partial<Event>>({})
  const [partForm, setPartForm] = useState<Partial<Partner>>({})
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('agent')

  const loadAll = useCallback(async () => {
    const [cats, res, ann, evts, parts, uroles] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('resources').select('*').order('sort_order'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('event_date'),
      supabase.from('partners').select('*').order('sort_order'),
      supabase.from('user_roles').select('*'),
    ])
    if (cats.data) setCategories(cats.data)
    if (res.data) setResources(res.data)
    if (ann.data) setAnnouncements(ann.data)
    if (evts.data) setEvents(evts.data)
    if (parts.data) setPartners(parts.data)
    if (uroles.data) setUsers(uroles.data)
  }, [supabase])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
      if (role?.role !== 'admin') { router.push('/'); return }
      setAuthorized(true)
      await loadAll()
    }
    init()
  }, [router, supabase, loadAll])

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  // ---- RESOURCES ----
  async function saveResource() {
    if (!resForm.name) return
    if (resForm.id) {
      await supabase.from('resources').update(resForm).eq('id', resForm.id)
    } else {
      await supabase.from('resources').insert(resForm)
    }
    setResForm({})
    await loadAll()
    flash('Resource saved!')
  }
  async function deleteResource(id: string) {
    if (!confirm('Delete this resource?')) return
    await supabase.from('resources').delete().eq('id', id)
    await loadAll()
    flash('Deleted.')
  }

  // ---- CATEGORIES ----
  async function saveCategory() {
    if (!catForm.name) return
    if (catForm.id) {
      await supabase.from('categories').update(catForm).eq('id', catForm.id)
    } else {
      await supabase.from('categories').insert(catForm)
    }
    setCatForm({})
    await loadAll()
    flash('Category saved!')
  }
  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Resources in it will become uncategorized.')) return
    await supabase.from('categories').delete().eq('id', id)
    await loadAll()
    flash('Deleted.')
  }

  // ---- ANNOUNCEMENTS ----
  async function saveAnnouncement() {
    if (!annForm.message) return
    if (annForm.id) {
      await supabase.from('announcements').update(annForm).eq('id', annForm.id)
    } else {
      await supabase.from('announcements').insert({ ...annForm, is_active: true })
    }
    setAnnForm({})
    await loadAll()
    flash('Announcement saved!')
  }
  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete?')) return
    await supabase.from('announcements').delete().eq('id', id)
    await loadAll()
  }

  // ---- EVENTS ----
  async function saveEvent() {
    if (!evtForm.title || !evtForm.event_date) return
    if (evtForm.id) {
      await supabase.from('events').update(evtForm).eq('id', evtForm.id)
    } else {
      await supabase.from('events').insert({ ...evtForm, is_active: true })
    }
    setEvtForm({})
    await loadAll()
    flash('Event saved!')
  }
  async function deleteEvent(id: string) {
    if (!confirm('Delete?')) return
    await supabase.from('events').delete().eq('id', id)
    await loadAll()
  }

  // ---- PARTNERS ----
  async function savePartner() {
    if (!partForm.name) return
    if (partForm.id) {
      await supabase.from('partners').update(partForm).eq('id', partForm.id)
    } else {
      await supabase.from('partners').insert(partForm)
    }
    setPartForm({})
    await loadAll()
    flash('Partner saved!')
  }
  async function deletePartner(id: string) {
    if (!confirm('Delete?')) return
    await supabase.from('partners').delete().eq('id', id)
    await loadAll()
  }

  // ---- USERS ----
  async function addUser() {
    if (!newUserEmail) return
    // Look up user_id from email via auth (requires service role in production)
    // For now, admin can manually add by email using the Supabase dashboard.
    // This form shows existing roles and lets admin promote/demote.
    flash('To add a new agent, have them sign up first, then promote them here.')
    setNewUserEmail('')
  }
  async function updateUserRole(userId: string, role: string) {
    await supabase.from('user_roles').update({ role }).eq('user_id', userId)
    await loadAll()
    flash('Role updated.')
  }
  async function removeUser(userId: string) {
    if (!confirm('Remove this user\'s access?')) return
    await supabase.from('user_roles').delete().eq('user_id', userId)
    // Also sign them out by deleting their auth user via Supabase dashboard
    await loadAll()
    flash('User removed. To fully revoke access, delete them from Supabase Auth too.')
  }

  if (!authorized) return <div className="min-h-screen bg-kw-black flex items-center justify-center"><p className="text-white">Checking access…</p></div>

  const tabs: { key: Tab; label: string }[] = [
    { key: 'resources', label: 'Resources' },
    { key: 'categories', label: 'Categories' },
    { key: 'announcements', label: 'Bulletins' },
    { key: 'events', label: 'Events' },
    { key: 'partners', label: 'Partners' },
    { key: 'users', label: 'Users' },
  ]

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-kw-red transition-colors"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1"

  return (
    <div className="min-h-screen bg-[#f4f4f2]">
      {/* Header */}
      <header className="bg-kw-black py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-condensed text-4xl font-black text-kw-red italic">kw</span>
          <div>
            <p className="text-white font-condensed font-bold text-base leading-tight">ADMIN PANEL</p>
            <p className="text-gray-500 font-condensed text-xs tracking-widest">ARIZONA LIVING REALTY</p>
          </div>
        </div>
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to dashboard</Link>
      </header>

      {msg && (
        <div className="bg-green-600 text-white text-sm text-center py-2 font-medium">{msg}</div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-8 bg-white rounded-xl p-1 border border-gray-200 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.key ? 'bg-kw-red text-white' : 'text-gray-600 hover:text-kw-black'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== RESOURCES ===== */}
        {tab === 'resources' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-condensed font-bold text-lg mb-4">{resForm.id ? 'Edit Resource' : 'Add Resource'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Name *</label><input className={inputCls} value={resForm.name || ''} onChange={e => setResForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className={labelCls}>URL</label><input className={inputCls} value={resForm.url || ''} onChange={e => setResForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…" /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Description</label><input className={inputCls} value={resForm.description || ''} onChange={e => setResForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={resForm.category_id || ''} onChange={e => setResForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">— Select category —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="featured" checked={!!resForm.is_featured} onChange={e => setResForm(f => ({ ...f, is_featured: e.target.checked }))} className="accent-kw-red" />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">Mark as featured</label>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={saveResource} className="btn-kw px-5 py-2 rounded-lg text-sm">Save resource</button>
                {resForm.id && <button onClick={() => setResForm({})} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">URL</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resources.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{categories.find(c => c.id === r.category_id)?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 truncate max-w-[200px] hidden md:table-cell">{r.url || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setResForm(r)} className="text-kw-red text-xs font-semibold mr-3 hover:underline">Edit</button>
                        <button onClick={() => deleteResource(r.id)} className="text-gray-400 text-xs hover:text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== CATEGORIES ===== */}
        {tab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-condensed font-bold text-lg mb-4">{catForm.id ? 'Edit Category' : 'Add Category'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Name *</label><input className={inputCls} value={catForm.name || ''} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className={labelCls}>Sort order</label><input type="number" className={inputCls} value={catForm.sort_order || 0} onChange={e => setCatForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))} /></div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={saveCategory} className="btn-kw px-5 py-2 rounded-lg text-sm">Save category</button>
                {catForm.id && <button onClick={() => setCatForm({})} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Order</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.sort_order}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setCatForm(c)} className="text-kw-red text-xs font-semibold mr-3 hover:underline">Edit</button>
                        <button onClick={() => deleteCategory(c.id)} className="text-gray-400 text-xs hover:text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== ANNOUNCEMENTS ===== */}
        {tab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-condensed font-bold text-lg mb-4">{annForm.id ? 'Edit Bulletin' : 'Add Broker Bulletin'}</h2>
              <div>
                <label className={labelCls}>Message *</label>
                <textarea className={`${inputCls} h-24 resize-none`} value={annForm.message || ''} onChange={e => setAnnForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              {annForm.id && (
                <div className="flex items-center gap-2 mt-3">
                  <input type="checkbox" id="ann-active" checked={!!annForm.is_active} onChange={e => setAnnForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-kw-red" />
                  <label htmlFor="ann-active" className="text-sm font-medium text-gray-700">Active (shown on dashboard)</label>
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={saveAnnouncement} className="btn-kw px-5 py-2 rounded-lg text-sm">Save bulletin</button>
                {annForm.id && <button onClick={() => setAnnForm({})} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>}
              </div>
            </div>
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className={`bg-white rounded-xl border p-4 flex items-start justify-between gap-4 ${a.is_active ? 'border-kw-red' : 'border-gray-200 opacity-60'}`}>
                  <p className="text-sm flex-1">{a.message}</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setAnnForm(a)} className="text-kw-red text-xs font-semibold hover:underline">Edit</button>
                    <button onClick={() => deleteAnnouncement(a.id)} className="text-gray-400 text-xs hover:text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== EVENTS ===== */}
        {tab === 'events' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-condensed font-bold text-lg mb-4">{evtForm.id ? 'Edit Event' : 'Add Event'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Title *</label><input className={inputCls} value={evtForm.title || ''} onChange={e => setEvtForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><label className={labelCls}>Date *</label><input type="date" className={inputCls} value={evtForm.event_date || ''} onChange={e => setEvtForm(f => ({ ...f, event_date: e.target.value }))} /></div>
                <div><label className={labelCls}>Time</label><input className={inputCls} value={evtForm.event_time || ''} onChange={e => setEvtForm(f => ({ ...f, event_time: e.target.value }))} placeholder="11AM–2PM" /></div>
                <div><label className={labelCls}>Location</label><input className={inputCls} value={evtForm.location || ''} onChange={e => setEvtForm(f => ({ ...f, location: e.target.value }))} placeholder="Shugrue's, Lake Havasu City" /></div>
                <div><label className={labelCls}>RSVP URL</label><input className={inputCls} value={evtForm.rsvp_url || ''} onChange={e => setEvtForm(f => ({ ...f, rsvp_url: e.target.value }))} placeholder="https://…" /></div>
                <div><label className={labelCls}>Description</label><input className={inputCls} value={evtForm.description || ''} onChange={e => setEvtForm(f => ({ ...f, description: e.target.value }))} /></div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={saveEvent} className="btn-kw px-5 py-2 rounded-lg text-sm">Save event</button>
                {evtForm.id && <button onClick={() => setEvtForm({})} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>}
              </div>
            </div>
            <div className="space-y-3">
              {events.map(ev => (
                <div key={ev.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{ev.title}</p>
                    <p className="text-sm text-gray-500">{ev.event_date}{ev.event_time && ` · ${ev.event_time}`}{ev.location && ` · ${ev.location}`}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEvtForm(ev)} className="text-kw-red text-xs font-semibold hover:underline">Edit</button>
                    <button onClick={() => deleteEvent(ev.id)} className="text-gray-400 text-xs hover:text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== PARTNERS ===== */}
        {tab === 'partners' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-condensed font-bold text-lg mb-4">{partForm.id ? 'Edit Partner' : 'Add Preferred Partner'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Name *</label><input className={inputCls} value={partForm.name || ''} onChange={e => setPartForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><label className={labelCls}>Category (e.g. Mortgage)</label><input className={inputCls} value={partForm.category || ''} onChange={e => setPartForm(f => ({ ...f, category: e.target.value }))} /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Description</label><input className={inputCls} value={partForm.description || ''} onChange={e => setPartForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div><label className={labelCls}>Phone</label><input className={inputCls} value={partForm.phone || ''} onChange={e => setPartForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div><label className={labelCls}>Website URL</label><input className={inputCls} value={partForm.website_url || ''} onChange={e => setPartForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://…" /></div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={savePartner} className="btn-kw px-5 py-2 rounded-lg text-sm">Save partner</button>
                {partForm.id && <button onClick={() => setPartForm({})} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>}
              </div>
            </div>
            <div className="space-y-3">
              {partners.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.category}{p.phone && ` · ${p.phone}`}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setPartForm(p)} className="text-kw-red text-xs font-semibold hover:underline">Edit</button>
                    <button onClick={() => deletePartner(p.id)} className="text-gray-400 text-xs hover:text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== USERS ===== */}
        {tab === 'users' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
              <p className="font-semibold mb-1">How user management works</p>
              <p>Agents sign up themselves at <code className="bg-amber-100 px-1 rounded">/auth</code>. Once they've signed up, they appear here. Promote them to <strong>admin</strong> to grant panel access. To fully revoke access for a departed agent, set them to <em>agent</em> here, then delete their account in your <a href="https://supabase.com/dashboard" target="_blank" className="underline font-semibold">Supabase Auth dashboard</a>.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">User ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 truncate max-w-[200px]">{u.user_id}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={e => updateUserRole(u.user_id, e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-kw-red"
                        >
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeUser(u.user_id)} className="text-gray-400 text-xs hover:text-red-600">Remove</button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No users yet. Agents appear here once they sign up.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
