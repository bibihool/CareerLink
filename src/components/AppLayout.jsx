import { NavLink, Outlet } from 'react-router-dom'

const navigationByRole = {
  Employer: [
    ['/dashboard', 'Overview'],
    ['/employer', 'Company & Jobs'],
    ['/applications', 'Applicant Tracking'],
    ['/notifications', 'Notifications'],
  ],
  'Job Seeker': [
    ['/dashboard', 'Overview'],
    ['/profile', 'My Profile'],
    ['/jobs', 'Find Jobs'],
    ['/applications', 'My Applications'],
    ['/notifications', 'Notifications'],
  ],
  Admin: [
    ['/dashboard', 'Overview'],
    ['/admin', 'Administration'],
    ['/notifications', 'Notifications'],
  ],
}

export default function AppLayout({ user, status, onDismissStatus, onLogout }) {
  const navigation = navigationByRole[user.role] || []

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">CareerLink Malaysia</p>
          <h1>CareerLink</h1>
        </div>
        <div className="user-pill">
          <span>{`${user.name} - ${user.role}`}</span>
          <button type="button" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <nav className="nav-tabs" aria-label="CareerLink modules">
        {navigation.map(([path, label]) => (
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} key={path} to={path}>
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
        <Outlet />
      </main>
    </div>
  )
}
