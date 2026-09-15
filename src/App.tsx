import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import {
  clearPendingSupports,
  formatAmount,
  formatDate,
  getDashboard,
  getErrorMessage,
  getUser,
  statuses,
  updateSupportStatus,
} from './api'
import type { Stats, Status, Support, User, UserDetails } from './types'

type Pagination = { page: number; total: number; totalPages: number }

type DashboardData = {
  stats: Stats | null
  users: User[]
  pagination: Pagination
}

function Login({ onLogin }: { onLogin: (key: string) => Promise<void> }) {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!key.trim()) {
      setError('Enter the admin key to continue.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onLogin(key.trim())
    } catch (loginError) {
      setError(getErrorMessage(loginError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <div className="login-art" aria-hidden="true">
        <span className="art-mark">BMS</span>
        <span className="art-line" />
        <p>Quiet control<br />for a generous platform.</p>
      </div>
      <section className="login-card">
        <div className="brand-mark">BM<span>•</span>S</div>
        <p className="eyebrow">Operations console</p>
        <h1>Welcome back.</h1>
        <p className="login-copy">Sign in with your admin key to monitor creators and support activity.</p>
        <form onSubmit={submit}>
          <label htmlFor="admin-key">Admin API key</label>
          <input id="admin-key" type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="Enter your key" autoFocus />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button full-width" type="submit" disabled={loading}>{loading ? 'Checking key...' : 'Enter dashboard'} <span aria-hidden="true">→</span></button>
        </form>
        <p className="security-note"><span aria-hidden="true">◈</span> Your key is used only for this session and is never stored.</p>
      </section>
    </main>
  )
}

function StatCard({ label, value, detail, icon, warning = false }: { label: string; value: string; detail: string; icon: string; warning?: boolean }) {
  return <article className={`stat-card ${warning ? 'warning' : ''}`}><div className="stat-icon">{icon}</div><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div></article>
}

function StatsGrid({ stats }: { stats: Stats | null }) {
  return <section className="stats-grid" aria-label="Platform statistics">
    <StatCard label="Total users" value={stats ? stats.total_users.toLocaleString() : '—'} detail="Creators on the platform" icon="◌" />
    <StatCard label="Successful supports" value={stats ? stats.total_successful_supports.toLocaleString() : '—'} detail="All-time completed" icon="✦" />
    <StatCard label="Support volume" value={stats ? formatAmount(stats.total_volume) : '—'} detail="Total successfully sent" icon="₦" />
    <StatCard label="Pending supports" value={stats ? stats.total_pending_supports.toLocaleString() : '—'} detail="Awaiting resolution" icon="◷" warning />
  </section>
}

function UserTable({ users, pagination, loading, page, onPageChange, onUserOpen, search, onSearchChange, onSearch }: { users: User[]; pagination: Pagination; loading: boolean; page: number; onPageChange: (page: number) => void; onUserOpen: (user: User) => void; search: string; onSearchChange: (value: string) => void; onSearch: (event: FormEvent) => void }) {
  return <section className="users-section">
    <div className="section-heading"><div><p className="eyebrow">Directory</p><h2>Creators</h2></div><form className="search-form" onSubmit={onSearch}><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search username or email" /><button type="submit">Search</button></form></div>
    <div className="table-wrap"><table><thead><tr><th>Creator</th><th>Status</th><th>Bank</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
      {loading ? <tr><td colSpan={5}><div className="table-state"><span className="spinner" />Loading creators...</div></td></tr> : users.length === 0 ? <tr><td colSpan={5}><div className="table-state"><span className="empty-icon">○</span><strong>No creators found</strong><span>Try a different search term.</span></div></td></tr> : users.map((user) => <UserRow key={user.id} user={user} onOpen={onUserOpen} />)}
    </tbody></table></div>
    <div className="pagination"><span>Showing {users.length ? (pagination.page - 1) * 50 + 1 : 0}–{Math.min(pagination.page * 50, pagination.total)} of {pagination.total.toLocaleString()}</span><div><button className="page-button" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>←</button><span>Page {pagination.page} of {pagination.totalPages}</span><button className="page-button" disabled={page >= pagination.totalPages || loading} onClick={() => onPageChange(page + 1)}>→</button></div></div>
  </section>
}

function UserRow({ user, onOpen }: { user: User; onOpen: (user: User) => void }) {
  return <tr onClick={() => onOpen(user)}><td><div className="creator-cell"><div className="avatar">{user.display_name?.charAt(0) || user.username.charAt(0)}</div><div><strong>{user.display_name || user.username}</strong><span>@{user.username} · {user.email}</span></div></div></td><td><span className={`status-pill ${user.is_verified ? 'verified' : 'unverified'}`}><i />{user.is_verified ? 'Verified' : 'Unverified'}</span></td><td>{user.bank_name || 'Not connected'}</td><td>{formatDate(user.created_at)}</td><td><button className="icon-button" onClick={(event) => { event.stopPropagation(); onOpen(user) }} aria-label={`View ${user.username}`}>→</button></td></tr>
}

function UserDrawer({ user, supports, loading, actionLoading, onClose, onStatusChange }: { user: UserDetails; supports: Support[]; loading: boolean; actionLoading: boolean; onClose: () => void; onStatusChange: (support: Support, status: Status) => void }) {
  return <div className="modal-backdrop" onClick={onClose}><aside className="detail-drawer" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={onClose} aria-label="Close user details">×</button>{loading ? <div className="drawer-loading"><span className="spinner" /></div> : <><div className="drawer-profile"><div className="avatar large">{user.display_name?.charAt(0) || user.username.charAt(0)}</div><p className="eyebrow">Creator profile</p><h2>{user.display_name}</h2><p>@{user.username} · {user.email}</p><span className={`status-pill ${user.is_verified ? 'verified' : 'unverified'}`}><i />{user.is_verified ? 'Verified' : 'Unverified'}</span></div><div className="detail-list"><div><span>Bank account</span><strong>{user.bank_name || 'Not connected'}</strong></div><div><span>Account name</span><strong>{user.bank_account_name || '—'}</strong></div><div><span>Joined</span><strong>{formatDate(user.created_at)}</strong></div></div><div className="supports-heading"><h3>Recent supports</h3><span>{supports.length} records</span></div><div className="support-list">{supports.length === 0 ? <p className="muted">No support activity yet.</p> : supports.map((support) => <SupportRow key={support.id} support={support} disabled={actionLoading} onStatusChange={onStatusChange} />)}</div></>}</aside></div>
}

function SupportRow({ support, disabled, onStatusChange }: { support: Support; disabled: boolean; onStatusChange: (support: Support, status: Status) => void }) {
  return <div className="support-row"><div><strong>{support.fan_name}</strong><span>{support.tx_ref}</span></div><div className="support-right"><strong>{formatAmount(support.amount)}</strong><select value={support.status} disabled={disabled} onChange={(event) => onStatusChange(support, event.target.value as Status)} aria-label={`Status for support ${support.id}`}>{statuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select></div></div>
}

function App() {
    const [adminKey, setAdminKey] = useState('')
    const [data, setData] = useState<DashboardData>({ stats: null, users: [], pagination: { page: 1, total: 0, totalPages: 1 } })
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [notice, setNotice] = useState('')
    const [error, setError] = useState('')
    const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
    const [supports, setSupports] = useState<Support[]>([])
    const [detailLoading, setDetailLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    async function loadDashboard(key: string, currentPage: number, currentQuery: string) {
        setLoading(true)
        setError('')
        try {
        const [statsResponse, usersResponse] = await getDashboard(key, currentPage, currentQuery)
        setData({ stats: statsResponse.stats, users: usersResponse.users, pagination: usersResponse.pagination })
        } catch (loadError) {
        if ((loadError as { status?: number }).status === 401) setAdminKey('')
        setError(getErrorMessage(loadError))
        throw loadError
        } finally {
        setLoading(false)
        }
    }

    async function login(key: string) {
        await loadDashboard(key, 1, '')
        setAdminKey(key)
    }

    async function openUser(user: User) {
        setSelectedUser({ ...user, updated_at: user.created_at })
        setDetailLoading(true)
        try {
        const response = await getUser(adminKey, user.id)
        setSelectedUser(response.user)
        setSupports(response.recent_supports)
        } catch (detailError) {
        setError(getErrorMessage(detailError))
        } finally {
        setDetailLoading(false)
        }
    }

    async function clearPending() {
        if (!window.confirm('Clear pending supports older than 30 minutes? They will be marked expired.')) return
        setActionLoading(true)
        try {
        const response = await clearPendingSupports(adminKey)
        setNotice(`${response.cleared_count} pending support${response.cleared_count === 1 ? '' : 's'} marked expired.`)
        await loadDashboard(adminKey, page, query)
        } catch (actionError) {
        setError(getErrorMessage(actionError))
        } finally {
        setActionLoading(false)
        }
    }

    async function changeStatus(support: Support, status: Status) {
        if (status === support.status || !window.confirm(`Change support #${support.id} to ${status.replace('_', ' ')}?`)) return
        setActionLoading(true)
        try {
        const response = await updateSupportStatus(adminKey, support.id, status)
        setSupports((current) => current.map((item) => item.id === support.id ? response.support : item))
        setNotice(`Support #${support.id} updated.`)
        await loadDashboard(adminKey, page, query)
        } catch (actionError) {
        setError(getErrorMessage(actionError))
        } finally {
        setActionLoading(false)
        }
    }

    function submitSearch(event: FormEvent) {
        event.preventDefault()
        const nextQuery = search.trim()
        setQuery(nextQuery)
        setPage(1)
        if (adminKey) void loadDashboard(adminKey, 1, nextQuery)
    }

    function changePage(nextPage: number) {
        setPage(nextPage)
        if (adminKey) void loadDashboard(adminKey, nextPage, query)
    }

    if (!adminKey) return <Login onLogin={login} />

    return (
        <div className="app-shell">
            <header className="topbar">
            <div className="brand-mark">
                BM<span>•</span>S
            </div>
            <div className="topbar-right">
                <span className="live-dot">Live</span>
                <button className="text-button" onClick={() => setAdminKey('')}>
                Sign out
                </button>
            </div>
            </header>

            <main className="dashboard">
            <div className="page-heading">
                <div>
                <p className="eyebrow">{new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <h1>Good morning, operator.</h1>
                <p className="subtitle">Here’s the pulse of BuyMeSuya today.</p>
                </div>
                <button className="primary-button" onClick={clearPending} disabled={actionLoading}>
                ⌁ <span>Clear stale pending</span>
                </button>
            </div>

            {error && (
                <div className="alert error" role="alert">
                <strong>Couldn’t complete that request.</strong> {error}
                <button onClick={() => setError('')} aria-label="Dismiss error">
                    ×
                </button>
                </div>
            )}

            {notice && (
                <div className="alert success" role="status">
                {notice}
                <button onClick={() => setNotice('')} aria-label="Dismiss notice">
                    ×
                </button>
                </div>
            )}

            <StatsGrid stats={data.stats} />

            <UserTable
                users={data.users}
                pagination={data.pagination}
                loading={loading}
                page={page}
                onPageChange={changePage}
                onUserOpen={openUser}
                search={search}
                onSearchChange={setSearch}
                onSearch={submitSearch}
            />
            </main>

            {selectedUser && (
            <UserDrawer
                user={selectedUser}
                supports={supports}
                loading={detailLoading}
                actionLoading={actionLoading}
                onClose={() => setSelectedUser(null)}
                onStatusChange={changeStatus}
            />
            )}
        </div>
    );
}

export default App
