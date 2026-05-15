import { useState, useEffect, useRef } from 'react'

const API = 'https://steam-recommender-qscb.onrender.com'
const THUMB = (appid) =>
  `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`

export default function SearchBar({ onSelect, selectedIds }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&n=8`)
        const data = await res.json()
        setSuggestions(data.results || [])
        setOpen(true)
        setActiveIdx(-1)
      } catch { setSuggestions([]) }
    }, 280)
    return () => clearTimeout(timerRef.current)
  }, [query])

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (game) => {
    onSelect(game)
    setQuery('')
    setSuggestions([])
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && activeIdx >= 0) select(suggestions[activeIdx])
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="search-wrapper" ref={wrapRef}>
      <div className="search-input-row">
        <svg className="search-icon" viewBox="0 0 24 24">
          <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
        <input
          className="search-input"
          type="text"
          placeholder="Search for a game…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="dropdown">
          {suggestions.map((g, i) => {
            const already = selectedIds.has(g.appid)
            return (
              <div
                key={g.appid}
                className={`dropdown-item${i === activeIdx ? ' active' : ''}${already ? ' already' : ''}`}
                onMouseDown={() => !already && select(g)}
                style={already ? { opacity: 0.45, cursor: 'default' } : {}}
              >
                <img
                  className="dropdown-thumb"
                  src={THUMB(g.appid)}
                  alt=""
                  onError={e => { e.target.style.display = 'none' }}
                />
                <div>
                  <div className="dropdown-name">{g.name}</div>
                  {g.developer && <div className="dropdown-dev">{g.developer}</div>}
                </div>
                {already && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#66c0f4' }}>Added</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
