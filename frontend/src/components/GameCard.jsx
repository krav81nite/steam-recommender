import { useState } from 'react'

const STEAM_IMG = (appid) =>
  `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`

export default function GameCard({ game }) {
  const [imgOk, setImgOk] = useState(true)
  const tags = game.top_tags ? game.top_tags.split(',').slice(0, 4) : []
  const pct = Math.round(game.similarity * 100)

  return (
    <div className="game-card">
      <div className="card-img-wrap">
        {imgOk ? (
          <img
            className="card-img"
            src={STEAM_IMG(game.appid)}
            alt={game.name}
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="card-placeholder">🎮</div>
        )}
        <span className="similarity-badge">{pct}% match</span>
        {tags.length > 0 && (
          <div className="card-tags-overlay">
            {tags.map(t => <span key={t} className="tag-pill">{t.trim()}</span>)}
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-name">{game.name}</div>
        {game.developer && <div className="card-dev">{game.developer}</div>}
      </div>
    </div>
  )
}
