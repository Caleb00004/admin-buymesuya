export type Status = 'pending' | 'successful' | 'failed' | 'init_failed' | 'expired'

export type User = {
  id: number
  username: string
  email: string
  display_name: string
  is_verified: boolean
  bank_name?: string
  created_at: string
}

export type Support = {
  id: number
  tx_ref: string
  fan_name: string
  amount: string
  status: Status
  created_at: string
}

export type UserDetails = User & {
  bio?: string
  avatar_url?: string
  bank_code?: string
  bank_account_number?: string
  bank_account_name?: string
  updated_at: string
}

export type Stats = {
  total_users: number
  total_successful_supports: number
  total_volume: string
  total_pending_supports: number
}

export type Pagination = {
  page: number
  total: number
  totalPages: number
}

export type ApiError = Error & { status?: number }