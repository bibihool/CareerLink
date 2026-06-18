import { NavLink, Outlet } from 'react-router-dom'
import { Bell, BriefcaseBusiness, Building2, FileSearch, LayoutDashboard, LogOut, Search, ShieldCheck, UserRound } from 'lucide-react'
import LoadingSkeleton from './LoadingSkeleton'

const navigationByRole = {
  Employer: [
    ['/dashboard', 'Overview', LayoutDashboard],
    ['/employer', 'Company & Jobs', Building2],
    ['/applications', 'Applicant Tracking', FileSearch],
    ['/notifications', 'Notifications', Bell],
  ],
  'Job Seeker': [
    ['/dashboard', 'Overview', LayoutDashboard],
    ['/profile', 'My Profile', UserRound],
    ['/jobs', 'Find Jobs', Search],
    ['/applications', 'My Applications', BriefcaseBusiness],
    ['/notifications', 'Notifications', Bell],
  ],
  Admin: [
    ['/dashboard', 'Overview', LayoutDashboard],
    ['/admin', 'Administration', ShieldCheck],
    ['/notifications', 'Notifications', Bell],
  ],
}

export default function AppLayout({ user, status, isLoading, onDismissStatus, onLogout }) {
  const navigation = navigationByRole[user.role] || []

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-icon"><BriefcaseBusiness aria-hidden="true" size={22} /></span>
          <div>
          <p className="eyebrow">CareerLink Malaysia</p>
          <h1>CareerLink</h1>
          </div>
        </div>
        <div className="user-pill">
          <UserRound aria-hidden="true" size={18} />
          <span>{`${user.name} - ${user.role}`}</span>
          <button type="button" onClick={onLogout}><LogOut aria-hidden="true" size={17} />Logout</button>
        </div>
      </header>

      <nav className="nav-tabs" aria-label="CareerLink modules">
        {navigation.map(([path, label, Icon]) => (
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} key={path} to={path}>
            <Icon aria-hidden="true" size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <main>
        {status?.message && (
          <div className={`system-message ${status.type}`} role="status">
            <span>{status.message}</span>
            <button type="button" onClick={onDismissStatus}>Dismiss</button>
          </div>
        )}
        {isLoading ? <LoadingSkeleton /> : <Outlet />}
      </main>
    </div>
  )
}
