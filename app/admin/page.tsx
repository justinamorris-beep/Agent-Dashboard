'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Category = { id: string; name: string; sort_order: number; admin_only: boolean }
type Resource = { id: string; name: string; description: string; url: string; category_id: string; is_featured: boolean }
type Announcement = { id: string; message: string }
type Event = { id: string; title: string; event_date: string; event_time: string; location: string; rsvp_url: string }
type Partner = { id: string; name: string; description: string; category: string; phone: string; website_url: string }

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
      if (role?.role !== 'admin') { router.push('/'); return }
      setAuthorized(true)

      const [cats, res, ann, evts, parts] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('resources').select('*').order('sort_order'),
        supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('is_active', true).gte('event_date', new Date().toISOString().split('T')[0]).order('event_date'),
        supabase.from('partners').select('*').order('sort_order'),
      ])
      if (cats.data) setCategories(cats.data)
      if (res.data) setResources(res.data)
      if (ann.data) setAnnouncements(ann.data)
      if (evts.data) setEvents(evts.data)
      if (parts.data) setPartners(parts.data)
    }
    init()
  }, [router, supabase])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const filtered = resources.filter(r => {
    const matchCat = activeCategory === 'all' || r.category_id === activeCategory
    const q = search.toLowerCase()
    return matchCat && (!q || r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
  })

  const agentCats = categories.filter(c => !c.admin_only)
  const adminCats = categories.filter(c => c.admin_only)

  const agentGrouped = agentCats
    .map(cat => ({ ...cat, items: filtered.filter(r => r.category_id === cat.id) }))
    .filter(c => c.items.length > 0)

  const adminGrouped = adminCats
    .map(cat => ({ ...cat, items: filtered.filter(r => r.category_id === cat.id) }))
    .filter(c => c.items.length > 0)

  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  if (!authorized) return (
    <div className="min-h-screen bg-kw-black flex items-center justify-center">
      <p className="text-gray-400 text-sm animate-pulse tracking-widest">Checking access…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f4f4f2]">

      {/* Announcements banner */}
      {announcements.length > 0 && (
        <div className="bg-kw-red text-white text-center py-2.5 px-4 text-sm font-medium leading-snug">
          <span className="font-semibold">BROKER BULLETIN:</span> {announcements[0].message}
        </div>
      )}

      {/* Header */}
      <header className="bg-kw-black py-5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-condensed text-5xl font-black text-kw-red italic leading-none">kw</span>
            <div>
              <p className="text-white font-condensed font-bold text-lg leading-tight tracking-wide">KELLER WILLIAMS</p>
              <p className="text-gray-400 font-condensed text-xs tracking-widest">ARIZONA LIVING REALTY</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold bg-kw-red text-white px-3 py-1 rounded-full">Admin View</span>
            <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Agent Dashboard</Link>
            <button onClick={signOut} className="text-gray-400 hover:text-white text-sm transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      {/* Title */}
      <div className="bg-kw-black pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-condensed text-4xl font-black text-white tracking-wide">Agent Dashboard</h1>
        </div>
      </div>

      {/* Events bar */}
      {events.length > 0 && (
        <div className="bg-yellow-500 px-6 py-3">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-yellow-900 font-condensed font-bold text-sm tracking-widest uppercase">Upcoming</span>
            {events.map(ev => (
              <div key={ev.id} className="flex items-center gap-2 text-sm text-yellow-900">
                <span className="font-semibold">{ev.title}</span>
                <span>— {fmt(ev.event_date)}{ev.event_time && `, ${ev.event_time}`}{ev.location && ` @ ${ev.location}`}</span>
                {ev.rsvp_url && <a href={ev.rsvp_url} target="_blank" rel="noopener noreferrer" className="underline font-semibold ml-1">RSVP</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* Search + filters */}
        <div className="space-y-4">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search all resources…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kw-red transition-colors shadow-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveCategory('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeCategory === 'all' ? 'bg-kw-red text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-kw-red'}`}>
              All
            </button>
            {agentCats.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeCategory === cat.id ? 'bg-kw-red text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-kw-red'}`}>
                {cat.name}
              </button>
            ))}
            <span className="w-px h-6 bg-gray-300 self-center" />
            {adminCats.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeCategory === cat.id ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 border border-purple-200 hover:border-purple-500'}`}>
                {cat.name.replace('MC — ', '')}
              </button>
            ))}
          </div>
        </div>

        {/* ── AGENT RESOURCES ── */}
        {agentGrouped.length > 0 && (
          <div className="space-y-8">
            {agentGrouped.map(cat => (
              <section key={cat.id}>
                <h2 className="font-condensed text-xl font-bold text-kw-black tracking-wide uppercase mb-4 border-b-2 border-kw-red pb-2 inline-block">{cat.name}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {cat.items.map(r => r.url ? (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="resource-card bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                      <span className="font-semibold text-sm text-kw-black leading-tight">{r.name}</span>
                      {r.description && <span className="text-xs text-gray-500 leading-snug">{r.description}</span>}
                    </a>
                  ) : (
                    <div key={r.id} className="resource-card bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                      <span className="font-semibold text-sm text-kw-black leading-tight">{r.name}</span>
                      {r.description && <span className="text-xs text-gray-500 leading-snug">{r.description}</span>}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ── PREFERRED PARTNERS ── */}
        {partners.length > 0 && (
          <section>
            <h2 className="font-condensed text-xl font-bold text-kw-black tracking-wide uppercase mb-4 border-b-2 border-kw-red pb-2 inline-block">Preferred Partners</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {partners.map(p => (
                <div key={p.id} className="bg-white border-2 border-kw-red rounded-xl p-5 flex flex-col gap-2">
                  <div>
                    <p className="font-bold text-kw-black">{p.name}</p>
                    {p.category && <p className="text-xs text-kw-red font-semibold uppercase tracking-wider">{p.category}</p>}
                  </div>
                  {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                  <div className="flex flex-wrap gap-3 text-sm">
                    {p.phone && <a href={`tel:${p.phone}`} className="text-kw-red font-medium hover:underline">{p.phone}</a>}
                    {p.website_url && <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="text-kw-red font-medium hover:underline">Website →</a>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── MARKET CENTER STAFF RESOURCES ── */}
        {adminGrouped.length > 0 && (
          <div className="space-y-8">
            <div className="border-t-4 border-purple-600 pt-8">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="font-condensed text-2xl font-black tracking-wide uppercase" style={{ color: '#6d28d9' }}>
                  Market Center Dashboard
                </h2>
                <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Staff Only</span>
              </div>
              <div className="space-y-8">
                {adminGrouped.map(cat => (
                  <section key={cat.id}>
                    <h3 className="font-condensed text-lg font-bold tracking-wide uppercase mb-4 pb-2 inline-block border-b-2"
                      style={{ color: '#6d28d9', borderColor: '#6d28d9' }}>
                      {cat.name.replace('MC — ', '')}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {cat.items.map(r => (
                        <a key={r.id} href={r.url || '#'} target="_blank" rel="noopener noreferrer"
                          className="resource-card bg-white border border-purple-200 rounded-xl p-4 flex flex-col gap-1 hover:border-purple-500">
                          <span className="font-semibold text-sm text-kw-black leading-tight">{r.name}</span>
                          {r.description && <span className="text-xs text-gray-500 leading-snug">{r.description}</span>}
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="bg-kw-black mt-16 py-8 px-6 text-center">
        <span className="font-condensed text-3xl font-black text-kw-red italic">kw</span>
        <p className="text-gray-600 text-xs mt-2">© {new Date().getFullYear()} KW Arizona Living Realty — MC 788</p>
      </footer>
    </div>
  )
}
