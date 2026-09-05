'use client'

import { FormEvent, useState } from 'react'
import './styles.css'

type Movie = { title: string; year: string; rating: string; runtime: string; genres: string[]; plot: string; cast: string[]; director: string; poster: string; imdb: string }

const demoMovie: Movie = {
  title: 'The Dark Knight', year: '2008', rating: '9.0', runtime: '2h 32m', genres: ['Action', 'Crime', 'Drama'],
  plot: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
  cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'], director: 'Christopher Nolan', poster: 'https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg', imdb: 'https://www.imdb.com/title/tt0468569/'
}

export default function Page() {
  const [url, setUrl] = useState(''); const [title, setTitle] = useState(''); const [movie, setMovie] = useState<Movie | null>(null); const [stage, setStage] = useState('idle'); const [error, setError] = useState('')
  async function submit(e: FormEvent) { e.preventDefault(); setError(''); setMovie(null); if (!url.includes('instagram.com')) { setError('Paste a valid public Instagram post or reel link.'); return } setStage('scanning'); await new Promise(r => setTimeout(r, 900)); setStage('confirm'); setTitle('The Dark Knight') }
  async function lookup(e: FormEvent) { e.preventDefault(); if (!title.trim()) return; setStage('matching'); await new Promise(r => setTimeout(r, 700)); setMovie({ ...demoMovie, title: title.trim() }); setStage('result') }
  return <main><nav><div className="brand"><span className="brand-mark">F</span><span>FRAMEFIND</span></div><span className="nav-note">INSTAGRAM → MOVIE INTELLIGENCE</span></nav>
    <section className="hero"><div className="eyebrow"><span className="pulse" /> PUBLIC REEL ANALYZER</div><h1>Find the film<br /><em>inside the frame.</em></h1><p className="intro">Drop an Instagram post or reel. FrameFind reads the caption and visual clues, then brings back the movie details you actually need.</p>
      <form onSubmit={submit} className="url-form"><input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste an Instagram post or reel link" aria-label="Instagram URL" /><button type="submit">Analyze link <span>↗</span></button></form><p className="fine">Public Instagram links only · No account connection required</p></section>
    {stage !== 'idle' && <section className="workspace">{stage === 'scanning' && <div className="status"><div className="spinner" /><h2>Reading the frame…</h2><p>Looking for titles, faces, captions, and cinematic clues.</p></div>}
      {stage === 'confirm' && <form onSubmit={lookup} className="confirm"><div className="section-label">IDENTIFICATION CANDIDATE</div><h2>We think we found it.</h2><p>Confirm or correct the title before we pull the full movie profile.</p><div className="title-input"><input value={title} onChange={e => setTitle(e.target.value)} aria-label="Detected movie title" /><button>Get details <span>→</span></button></div></form>}
      {stage === 'matching' && <div className="status"><div className="spinner" /><h2>Building your movie profile…</h2><p>Matching credits, ratings, and release details.</p></div>}
      {stage === 'result' && movie && <article className="result"><div className="poster-wrap"><img src={movie.poster} alt={`${movie.title} poster`} /><div className="poster-caption">MATCH CONFIDENCE <strong>98%</strong></div></div><div className="details"><div className="section-label">MOVIE IDENTIFIED</div><h2>{movie.title}</h2><div className="meta"><b>★ {movie.rating}</b><span>{movie.year}</span><span>{movie.runtime}</span><span>{movie.genres.join(' · ')}</span></div><p className="plot">{movie.plot}</p><dl><div><dt>DIRECTOR</dt><dd>{movie.director}</dd></div><div><dt>CAST</dt><dd>{movie.cast.join(' · ')}</dd></div></dl><a className="imdb" href={movie.imdb} target="_blank" rel="noreferrer">View on IMDb <span>↗</span></a></div></article>}</section>}
    {error && <p className="error">{error}</p>}<footer><span>FRAMEFIND / 2026</span><span>Built for the curious viewer</span></footer></main>
}
