// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, { data: any; timestamp: number }>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pendingRequests = new Map<string, Promise<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchWithCache(url: string, options?: RequestInit): Promise<any> {
  const cacheKey = `${url}${JSON.stringify(options || {})}`;
  
  // Check if request is already pending (deduplication)
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return Promise.resolve(cached.data);
  }
  
  // Create new request
  const request = fetch(url, options)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Store in cache
      cache.set(cacheKey, { data, timestamp: Date.now() });
      pendingRequests.delete(cacheKey);
      return data;
    })
    .catch(error => {
      pendingRequests.delete(cacheKey);
      throw error;
    });
  
  pendingRequests.set(cacheKey, request);
  return request;
}

export function clearCache() {
  cache.clear();
  pendingRequests.clear();
}