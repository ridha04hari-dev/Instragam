import { NextResponse } from 'next/server'

const instagramPattern = /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/[^/?#]+(?:[/?#].*)?$/i

type Movie = {
  title: string
  year: string
  rating: string
  runtime: string
  genres: string[]
  plot: string
  cast: string[]
  director: string
  poster: string
  imdb: string
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function normalizeMovie(value: Record<string, unknown>): Movie | null {
  const title = String(value.title ?? value.name ?? '').trim()
  if (!title) return null
  const imdbId = String(value.imdbId ?? value.imdb_id ?? '').trim()
  return {
    title,
    year: String(value.year ?? value.releaseYear ?? value.release_date ?? '—'),
    rating: String(value.rating ?? value.imdbRating ?? '—'),
    runtime: String(value.runtime ?? value.duration ?? '—'),
    genres: Array.isArray(value.genres) ? value.genres.map(String) : [],
    plot: String(value.plot ?? value.overview ?? 'No plot summary was returned.'),
    cast: Array.isArray(value.cast) ? value.cast.map(String).slice(0, 5) : [],
    director: String(value.director ?? '—'),
    poster: String(value.poster ?? value.posterUrl ?? value.image ?? ''),
    imdb: String(value.imdb ?? (imdbId ? `https://www.imdb.com/title/${imdbId}/` : '')),
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const url = typeof body?.url === 'string' ? body.url.trim() : ''
  const confirmedTitle = typeof body?.title === 'string' ? body.title.trim() : ''

  if (!url || !instagramPattern.test(url)) {
    return errorResponse('Paste a valid public Instagram post, reel, or IGTV URL.')
  }

  const analyzerUrl = process.env.INSTAGRAM_ANALYZER_API_URL
  const movieUrl = process.env.MOVIE_METADATA_API_URL
  if (!analyzerUrl || !movieUrl) {
    return errorResponse('The analysis service is not connected yet. Configure INSTAGRAM_ANALYZER_API_URL and MOVIE_METADATA_API_URL on the server.', 503)
  }

  try {
    const analysisResponse = await fetch(analyzerUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(process.env.INSTAGRAM_ANALYZER_API_KEY ? { authorization: `Bearer ${process.env.INSTAGRAM_ANALYZER_API_KEY}` } : {}) },
      body: JSON.stringify({ url }),
      cache: 'no-store',
    })
    if (!analysisResponse.ok) return errorResponse('The Instagram link could not be read. Confirm it is public and try again.', 422)
    const analysis = await analysisResponse.json()
    const detectedTitle = confirmedTitle || String(analysis.title ?? analysis.movieTitle ?? '').trim()
    if (!detectedTitle) return NextResponse.json({ needsTitle: true, message: 'We could not confidently identify a title from this link.' })

    const metadataResponse = await fetch(movieUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(process.env.MOVIE_METADATA_API_KEY ? { authorization: `Bearer ${process.env.MOVIE_METADATA_API_KEY}` } : {}) },
      body: JSON.stringify({ title: detectedTitle, imdbId: analysis.imdbId ?? analysis.imdb_id }),
      cache: 'no-store',
    })
    if (!metadataResponse.ok) return errorResponse('The movie was identified, but its details could not be loaded.', 422)
    const movie = normalizeMovie(await metadataResponse.json())
    if (!movie) return errorResponse('The movie details response was incomplete.', 502)
    return NextResponse.json({ movie, confidence: analysis.confidence ?? null })
  } catch {
    return errorResponse('The analysis service is unavailable. Try again shortly.', 502)
  }
}
