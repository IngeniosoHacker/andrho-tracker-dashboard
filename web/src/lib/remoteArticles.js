// The articles uploaded from the dashboard, read from andrho-api's public
// endpoints for this site (VITE_ANDRHO_SITE_ID, the tracker's site id).
// Any failure just means "no uploaded articles": the built ones still show.
import { useEffect, useState } from 'react'
import { ARTICLES, fromApi, mergeArticles } from './articles.js'

const API_URL = (import.meta.env.VITE_ANDRHO_API_URL || '').replace(/\/+$/, '')
export const SITE_ID = import.meta.env.VITE_ANDRHO_SITE_ID || 'andrho'

const base = () => `${API_URL}/public/sites/${encodeURIComponent(SITE_ID)}/articles`

export async function fetchRemoteArticles() {
  if (!API_URL) return []
  try {
    const res = await fetch(base())
    if (!res.ok) return []
    const data = await res.json()
    return (data.articles || []).map(fromApi)
  } catch {
    return []
  }
}

export async function fetchRemoteArticle(slug) {
  if (!API_URL || !slug) return null
  try {
    const res = await fetch(`${base()}/${encodeURIComponent(slug)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.article ? fromApi(data.article) : null
  } catch {
    return null
  }
}

// Every article (built + uploaded), newest first. Starts with the built ones
// so the first paint never waits on the network.
export function useArticles() {
  const [articles, setArticles] = useState(() => mergeArticles([]))
  useEffect(() => {
    let alive = true
    fetchRemoteArticles().then((remote) => {
      if (alive && remote.length) setArticles(mergeArticles(remote))
    })
    return () => {
      alive = false
    }
  }, [])
  return articles
}

export { ARTICLES }
