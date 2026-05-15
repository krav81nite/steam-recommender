import { useState } from 'react'
import './App.css'
import SearchBar from './components/SearchBar'
import GameDetail from './components/GameDetail'
import GameCard from './components/GameCard'

const API = 'http://localhost:8000'

export default function App() {
  const [selected, setSelected] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const selectedIds = new Set(selected.map(g => g.appid))

  const addGame = (game) => {
    if (!selectedIds.has(game.appid)) setSelected(prev => [...prev, game])
  }

  const removeGame = (appid) => {
    setSelected(prev => prev.filter(g => g.appid !== appid))
  }

  const getRecommendations = async () => {
    if (!selected.length) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ games: selected.map(g => g.name), n: 16 }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRecommendations(data.recommendations)
      setSearched(true)
    } catch {
      setError('Could not get recommendations. Make sure the API is running.')
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setSelected([])
    setRecommendations([])
    setSearched(false)
    setError(null)
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <svg className="header-logo" viewBox="0 0 233 233" xmlns="http://www.w3.org/2000/svg">
            <path d="M116.5 0C52.2 0 0 52.2 0 116.5c0 55.4 38.7 101.8 90.7 113.4l33.2-81.4c-1.3.1-2.6.1-3.9.1-28.9 0-52.3-23.4-52.3-52.3S91.1 44 120 44s52.3 23.4 52.3 52.3c0 25.3-17.9 46.4-41.8 51.3l-31.2 76.6c.4 0 .8.1 1.2.1 64.3 0 116.5-52.2 116.5-116.5S180.8 0 116.5 0z"/>
            <circle cx="120" cy="96.3" r="30.3"/>
          </svg>
          <div>
            <div className="header-title">Steam Recommender</div>
            <div className="header-subtitle">Powered by SteamSpy tag data</div>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="hero">
        <h2>Find your next favorite game</h2>
        <p>Search for games you enjoy — we'll show what defines them and recommend what to play next</p>
        <SearchBar onSelect={addGame} selectedIds={selectedIds} />
      </section>

      {/* Selected game detail cards */}
      {selected.length > 0 && (
        <div className="selected-section">
          <div className="selected-label">
            Based on {selected.length} game{selected.length > 1 ? 's' : ''} — tags show their defining features
          </div>
          <div className="selected-grid">
            {selected.map(g => (
              <GameDetail key={g.appid} game={g} onRemove={removeGame} />
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="cta-row">
        <button
          className="cta-btn"
          onClick={getRecommendations}
          disabled={selected.length === 0 || loading}
        >
          {loading ? 'Finding games…' : 'Find Similar Games'}
        </button>
        {selected.length > 0 && (
          <button className="clear-btn" onClick={clear}>Clear all</button>
        )}
        {error && <div className="error-msg">{error}</div>}
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Searching through 5,000 games…</span>
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <section className="results-section">
          <div className="results-header">
            <h2>Recommended for you</h2>
            <span className="results-count">{recommendations.length} games</span>
          </div>
          <div className="results-grid">
            {recommendations.map(game => <GameCard key={game.appid} game={game} />)}
          </div>
        </section>
      )}
    </div>
  )
}
