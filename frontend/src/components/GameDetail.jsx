import { useState, useEffect } from 'react'

const API = 'http://localhost:8000'
const HEADER_IMG = (appid) => `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`

export default function GameDetail({ game, onRemove }) {
  const [tags, setTags] = useState(null)

  useEffect(() => {
    fetch(`${API}/games/${game.appid}`)
      .then(r => r.json())
      .then(d => setTags(d.tags))
      .catch(() => setTags({}))
  }, [game.appid])

  const allTags = tags ? Object.entries(tags).sort((a, b) => b[1] - a[1]) : []
  const featured = allTags.slice(0, 6)
  const secondary = allTags.slice(6, 20)
  const maxVotes = featured.length ? featured[0][1] : 1

  return (
    <div className="detail-card">

      {/* ── Left: cover ── */}
      <div className="detail-cover">
        <img
          className="detail-cover-img"
          src={HEADER_IMG(game.appid)}
          alt={game.name}
          onError={e => { e.target.style.opacity = 0 }}
        />
        <div className="detail-cover-fade" />
        <div className="detail-cover-info">
          <div className="detail-cover-name">{game.name}</div>
          {game.developer && <div className="detail-cover-dev">{game.developer}</div>}
        </div>
        <button className="detail-remove" onClick={() => onRemove(game.appid)} title="Remove">×</button>
      </div>

      {/* ── Right: tags panel ── */}
      <div className="detail-tags-panel">
        <div className="dna-heading">
          <span className="dna-dot" />
          Game DNA
        </div>

        {tags === null && (
          <div className="dna-loading">Loading…</div>
        )}

        {/* Featured tags with bar */}
        {featured.length > 0 && (
          <div className="featured-tags">
            {featured.map(([tag, votes]) => {
              const pct = Math.round((votes / maxVotes) * 100)
              return (
                <div key={tag} className="featured-tag">
                  <span className="featured-tag-name">{tag}</span>
                  <div className="featured-tag-track">
                    <div className="featured-tag-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="featured-tag-pct">{pct}%</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Secondary tags */}
        {secondary.length > 0 && (
          <div className="secondary-tags">
            {secondary.map(([tag]) => (
              <span key={tag} className="secondary-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
