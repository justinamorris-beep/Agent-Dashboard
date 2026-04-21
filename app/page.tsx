'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type Category = { id: string; name: string; sort_order: number }
type Resource = { id: string; name: string; description: string; url: string; category_id: string; is_featured: boolean }
type Announcement = { id: string; message: string }
type Event = { id: string; title: string; description: string; event_date: string; event_time: string; location: string; rsvp_url: string }
type Partner = { id: string; name: string; description: string; category: string; phone: string; website_url: string }

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadData = useCallback(async () => {
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
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    async function init() {
      await loadData()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
        if (role?.role === 'admin') setIsAdmin(true)
      }
    }
    init()
  }, [supabase, loadData])

  const filteredResources = resources.filter(r => {
    const matchCat = activeCategory === 'all' || r.category_id === activeCategory
    const q = search.toLowerCase()
    const matchQ = !q || r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
    return matchCat && matchQ
  })

  const resourcesByCategory = categories.map(cat => ({
    ...cat,
    items: filteredResources.filter(r => r.category_id === cat.id),
  })).filter(cat => cat.items.length > 0)

  if (loading) return (
    <div className="min-h-screen bg-kw-black flex items-center justify-center">
      <div className="text-center">
        <span className="font-condensed text-5xl font-black text-kw-red italic">kw</span>
        <p className="text-gray-400 text-sm mt-3 tracking-widest animate-pulse">Loading dashboard…</p>
      </div>
    </div>
  )

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#f4f4f2]">
      {announcements.length > 0 && (
        <div className="bg-kw-red text-white text-center py-2.5 px-4 text-sm font-medium leading-snug">
          <span className="font-semibold">BROKER BULLETIN:</span> {announcements[0].message}
        </div>
      )}

      <header className="bg-kw-black py-5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-condensed text-5xl font-black text-kw-red italic leading-none">kw</span>
            <div>
              <p className="text-white font-condensed font-bold text-lg leading-tight tracking-wide">KELLER WILLIAMS</p>
              <p className="text-gray-400 font-condensed text-xs tracking-widest">ARIZONA LIVING REALTY</p>
            </div>
          </div>
          {isAdmin && (
            <Link href="/admin" className="btn-kw text-xs px-4 py-2 rounded-lg font-semibold tracking-wide">
              Admin Panel
            </Link>
          )}
          {!isAdmin && (
            <Link href="/auth" className="text-gray-400 hover:text-white text-xs transition-colors">
              Admin login
            </Link>
          )}
        </div>
      </header>

      <div className="bg-kw-black pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-condensed text-4xl font-black text-white tracking-wide">Agent Dashboard</h1>
        </div>
      </div>

      {events.length > 0 && (
        <div className="bg-yellow-500 px-6 py-3">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-yellow-900 font-condensed font-bold text-sm tracking-widest uppercase">Upcoming</span>
            {events.map(ev => (
              <div key={ev.id} className="flex items-center gap-2 text-sm text-yellow-900">
                <span className="font-semibold">{ev.title}</span>
                <span>—</span>
                <span>{formatDate(ev.event_date)}{ev.event_time && `, ${ev.event_time}`}{ev.location && ` @ ${ev.location}`}</span>
                {ev.rsvp_url && <a href={ev.rsvp_url} target="_blank" rel="noopener noreferrer" className="underline font-semibold ml-1">RSVP</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        <div className="space-y-4">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Search resources…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-kw-red transition-colors shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveCategory('all')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeCategory === 'all' ? 'bg-kw-red text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-kw-red'}`}>All</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeCategory === cat.id ? 'bg-kw-red text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-kw-red'}`}>{cat.name}</button>
            ))}
          </div>
        </div>

        {resourcesByCategory.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">{resources.length === 0 ? 'No resources added yet. Sign in as admin to add content.' : 'No resources match your search.'}</p>
          </div>
        ) : (
          resourcesByCategory.map(cat => (
            <section key={cat.id}>
              <h2 className="font-condensed text-xl font-bold text-kw-black tracking-wide uppercase mb-4 border-b-2 border-kw-red pb-2 inline-block">{cat.name}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {cat.items.map(r => (
                  r.url ? (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="resource-card bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1 cursor-pointer">
                      <span className="font-semibold text-sm text-kw-black leading-tight">{r.name}</span>
                      {r.description && <span className="text-xs text-gray-500 leading-snug">{r.description}</span>}
                      {r.is_featured && <span className="mt-1 self-start text-xs bg-red-50 text-kw-red font-semibold px-2 py-0.5 rounded-full">Featured</span>}
                    </a>
                  ) : (
                    <div key={r.id} className="resource-card bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                      <span className="font-semibold text-sm text-kw-black leading-tight">{r.name}</span>
                      {r.description && <span className="text-xs text-gray-500 leading-snug">{r.description}</span>}
                    </div>
                  )
                ))}
              </div>
            </section>
          ))
        )}

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
                  <div className="flex flex-wrap gap-3 mt-1 text-sm">
                    {p.phone && <a href={`tel:${p.phone}`} className="text-kw-red font-medium hover:underline">{p.phone}</a>}
                    {p.website_url && <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="text-kw-red font-medium hover:underline">Website →</a>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="bg-kw-black mt-16 py-8 px-6 text-center">
        <span className="font-condensed text-3xl font-black text-kw-red italic">kw</span>
        <p className="text-gray-600 text-xs mt-2">© {new Date().getFullYear()} KW Arizona Living Realty — MC 788</p>
      </footer>
    </div>
  )
}
