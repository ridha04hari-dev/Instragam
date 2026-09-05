'use client'

import { FormEvent, useState } from 'react'
import './styles.css'

type Movie = { title: string; year: string; rating: string; runtime: string; genres: string[]; plot: string; cast: string[]; director: string; poster: string; imdb: string }
type Stage = 'idle' | 'scanning' | 'confirm' | 'matching' | 'result'

export default function Page() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [movie, setMovie] = useState<Movie | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null)

  async function analyze(urlOverride = url, confirmedTitle = '') {
    setError('')
    setMovie(null)
    setStage(confirmedTitle ? 'matching' : 'scanning')
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: urlOverride, title: confirmedTitle }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analysis failed.')
      if (data.needsTitle) { setStage('confirm'); setTitle(''); return }
      setConfidence(typeof data.confidence === 'number' ? data.confidence : null)
      setMovie(data.movie)
      setStage('result')
    } catch (caught) {
      setStage('idle')
      setError(caught instanceof Error ? caught.message : 'Analysis failed.')
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); void analyze() }
  function lookup(event: FormEvent) { event.preventDefault(); if (title.trim()) void analyze(url, title.trim()) }

  return <main><nav><div className="brand"><span className="brand-mark">F</span><span>FRAMEFIND</span></div><span className="nav-note">INSTAGRAM → MOVIE INTELLIGENCE</span></nav>
    <section className="hero"><div className="eyebrow"><span className="pulse" /> PUBLIC REEL ANALYZER</div><h1>Find the film<br /><em>inside the frame.</em></h1><p className="intro">Paste a public Instagram post or reel. FrameFind sends it through your connected analysis and movie-data services, then returns verified details.</p>
      <form onSubmit={submit} className="url-form"><input value={url} onChange={event => setUrl(event.target.value)} placeholder="Paste an Instagram post, reel, or IGTV link" aria-label="Instagram URL" type="url" required /><button type="submit" disabled={stage === 'scanning' || stage === 'matching'}>Analyze link <span>↗</span></button></form><p className="fine">Public Instagram links only · No account connection required</p></section>
    {stage !== 'idle' && <section className="workspace">{(stage === 'scanning' || stage === 'matching') && <div className="status"><div className="spinner" /><h2>{stage === 'scanning' ? 'Reading the frame…' : 'Building your movie profile…'}</h2><p>{stage === 'scanning' ? 'Fetching public media and looking for titles, captions, and cinematic clues.' : 'Matching credits, ratings, and release details.'}</p></div>}
      {stage === 'confirm' && <form onSubmit={lookup} className="confirm"><div className="section-label">IDENTIFICATION CANDIDATE</div><h2>Tell us the title.</h2><p>We could not confidently identify the movie from the public media. Correct or enter the title to continue.</p><div className="title-input"><input value={title} onChange={event => setTitle(event.target.value)} aria-label="Movie title" placeholder="Movie title" required /><button>Get details <span>→</span></button></div></form>}
      {stage === 'result' && movie && <article className="result">{movie.poster ? <div className="poster-wrap"><img src={movie.poster} alt={`${movie.title} poster`} /><div className="poster-caption">{confidence ? <>MATCH CONFIDENCE <strong>{Math.round(confidence * 100)}%</strong></> : 'CONNECTED SOURCE RESULT'}</div></div> : <div className="poster-wrap poster-empty">NO POSTER RETURNED</div>}<div className="details"><div className="section-label">MOVIE IDENTIFIED</div><h2>{movie.title}</h2><div className="meta"><b>★ {movie.rating}</b><span>{movie.year}</span><span>{movie.runtime}</span><span>{movie.genres.join(' · ')}</span></div><p className="plot">{movie.plot}</p><dl><div><dt>DIRECTOR</dt><dd>{movie.director}</dd></div><div><dt>CAST</dt><dd>{movie.cast.join(' · ') || '—'}</dd></div></dl>{movie.imdb && <a className="imdb" href={movie.imdb} target="_blank" rel="noreferrer">View on IMDb <span>↗</span></a>}</div></article>}</section>}
    {error && <p className="error" role="alert">{error}</p>}<footer><span>FRAMEFIND / 2026</span><span>Connected analysis only · No fabricated results</span></footer></main>
}
