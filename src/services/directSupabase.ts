// 직접 fetch로 Supabase API 호출하는 유틸리티
export const directSupabaseCall = async (
  endpoint: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
  } = {}
) => {
  const url = `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/${endpoint}`
  const apiKey = process.env.REACT_APP_SUPABASE_ANON_KEY
  
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'apikey': apiKey!,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    },
    body: options.body
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}
