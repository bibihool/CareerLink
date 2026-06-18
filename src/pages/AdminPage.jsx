import EmptyState from '../components/EmptyState'
import JobCard from '../components/JobCard'

function roleLabel(role) {
  if (role === 'jobseeker') return 'Job Seeker'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export default function AdminPage({ users, jobs, onToggleSuspension, onDeleteJob }) {
  return (
    <section className="page-grid admin-grid">
      <div className="panel wide">
        <div className="section-heading"><div><p className="eyebrow">User management</p><h2>Accounts</h2></div><span className="count-badge">{users.length} users</span></div>
        {users.length ? <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {users.map((account) => <tr key={account.id}><td><strong>{account.name}</strong><span>{account.email}</span></td><td>{roleLabel(account.role)}</td><td><span className={`status ${account.suspended ? 'status-danger' : 'status-success'}`}>{account.suspended ? 'Suspended' : 'Active'}</span></td><td>{account.role === 'admin' ? <span>Protected admin</span> : <button className={account.suspended ? '' : 'danger'} onClick={() => onToggleSuspension(account)}>{account.suspended ? 'Reactivate' : 'Suspend'}</button>}</td></tr>)}
        </tbody></table></div> : <EmptyState title="No users found" message="Registered accounts will appear here." />}
      </div>
      <div className="panel wide">
        <div className="section-heading"><div><p className="eyebrow">Content moderation</p><h2>Job postings</h2></div><span className="count-badge">{jobs.length} jobs</span></div>
        <div className="job-list">{jobs.length ? jobs.map((job) => <JobCard key={job.id} job={job} actions={<button className="danger" onClick={() => onDeleteJob(job.id)}>Delete posting</button>} />) : <EmptyState title="No job postings" message="Published jobs will appear here for moderation." />}</div>
      </div>
    </section>
  )
}
