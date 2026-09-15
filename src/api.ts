import type { ApiError, Pagination, Stats, Support, User, UserDetails } from './types'

export const statuses = ['pending', 'successful', 'failed', 'init_failed', 'expired'] as const

export async function request<T>(key: string, path: string, options: RequestInit = {}) {
  const response = await fetch(`https://backend-buymesuya-1.onrender.com/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': key,
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(body.message || `Request failed with status ${response.status}`) as ApiError
    error.status = response.status
    throw error
  }

  return body as T
}

export async function getDashboard(key: string, page: number, search: string) {
  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)

  return Promise.all([
    request<{ stats: Stats }>(key, '/stats'),
    request<{ users: User[]; pagination: Pagination }>(key, `/users?${params}`),
  ])
}

export function getUser(key: string, id: number) {
  return request<{ user: UserDetails; recent_supports: Support[] }>(key, `/users/${id}`)
}

export function clearPendingSupports(key: string) {
  return request<{ cleared_count: number }>(key, '/supports/clear-pending?olderThanMinutes=30', { method: 'DELETE' })
}

export function updateSupportStatus(key: string, id: number, status: Support['status']) {
  return request<{ support: Support }>(key, `/supports/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getErrorMessage(error: unknown) {
  const apiError = error as ApiError
  if (apiError.status === 401) return 'That admin key was rejected. Check it and try again.'
  if (apiError.status === 404) return 'The requested record could not be found.'
  if (apiError.status === 400) return apiError.message || 'The request was invalid.'
  if (apiError.status === 429) return 'Too many requests. Give the API a moment, then retry.'
  return apiError.message || 'Something went wrong. Please try again.'
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export function formatAmount(value: string | number) {
  return `₦${Number(value).toLocaleString('en-NG')}`
}