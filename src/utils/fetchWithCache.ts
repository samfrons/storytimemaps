const cache = new Map<string, { data: unknown; timestamp: number }>()
const pendingRequests = new Map<string, Promise<unknown>>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function fetchWithCache<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const cacheKey = `${url}${JSON.stringify(options || {})}`

  // Check if request is already pending (deduplication)
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey) as Promise<T>
  }

  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return Promise.resolve(cached.data as T)
  }

  // Create new request
  const request = fetch(url, options)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      // Store in cache
      cache.set(cacheKey, { data, timestamp: Date.now() })
      pendingRequests.delete(cacheKey)
      return data
    })
    .catch((error) => {
      pendingRequests.delete(cacheKey)
      throw error
    })

  pendingRequests.set(cacheKey, request)
  return request
}

export function clearCache() {
  cache.clear()
  pendingRequests.clear()
}
