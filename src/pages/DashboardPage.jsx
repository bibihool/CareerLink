import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import { applicationStatuses } from '../constants'

export default function DashboardPage({ user, jobs, applications, notifications, profile, company, adminUsers }) {
  const navigate = useNavigate()
  const isEmployer = user.role === 'Employer'
  const isAdmin = user.role === 'Admin'
  const openJobs = jobs.filter((job) => job.status === 'Open').length
  const recommendedJobs = jobs.filter((job) => job.status === 'Open').slice(0, 2)

  if (isAdmin) {
    return (
      <section className="page-grid dashboard-grid">
        <div className="intro-panel">
          <p className="eyebrow">Administration workspace</p>
          <h2>Keep CareerLink trustworthy and operational.</h2>
          <p>Review user access, moderate job postings, and monitor platform activity from one controlled workspace.</p>
          <div className="hero-actions"><button onClick={() => navigate('/admin')}>Open administration</button></div>
        </div>
        <StatCard label="Registered users" value={adminUsers.length} />
        <StatCard label="Active jobs" value={openJobs} />
        <StatCard label="Applications" value={applications.length} />
      </section>
    )
  }

  return (
    <section className="page-grid dashboard-grid">
      <div className="intro-panel">
        <p className="eyebrow">{isEmployer ? 'Employer workspace' : 'Graduate career workspace'}</p>
        <h2>{isEmployer ? 'Manage hiring from job post to shortlist.' : 'Find graduate jobs and track every application.'}</h2>
        <p>{isEmployer ? 'Create vacancies, monitor applicants, and move candidates through each stage.' : 'Build your profile once, apply with your saved resume, and follow application progress.'}</p>
        <div className="hero-actions">
          <button onClick={() => navigate(isEmployer ? '/employer' : '/jobs')}>{isEmployer ? 'Post a job' : 'Search jobs'}</button>
          <button className="secondary" onClick={() => navigate(isEmployer ? '/applications' : '/profile')}>{isEmployer ? 'Review applicants' : 'Complete profile'}</button>
        </div>
      </div>
      <StatCard label={isEmployer ? 'Open roles' : 'Open jobs'} value={openJobs} />
      <StatCard label={isEmployer ? 'Total applicants' : 'My applications'} value={applications.length} />
      <StatCard label="Notifications" value={notifications.length} />

      {!isEmployer && (
        <>
          <div className="panel">
            <h3>Profile strength</h3>
            <p>{profile.headline || 'Add a professional headline to improve your profile.'}</p>
            <div className="progress-bar"><span style={{ width: profile.resume ? '78%' : '42%' }} /></div>
            <p>{profile.resume ? 'Your resume and profile details are ready for applications.' : 'Upload a resume and add your experience before applying.'}</p>
          </div>
          <div className="panel">
            <h3>Recommended roles</h3>
            {recommendedJobs.length ? <div className="mini-list">{recommendedJobs.map((job) => <button key={job.id} onClick={() => navigate('/jobs')}>{job.title} - {job.location}</button>)}</div> : <EmptyState title="No open jobs yet" message="New roles will appear here once employers publish them." />}
          </div>
        </>
      )}

      {isEmployer && (
        <>
          <div className="panel">
            <h3>Company profile</h3>
            <p>{company.description || 'Add a company description to introduce candidates to your workplace.'}</p>
            <div className="company-meta"><span>{company.name || user.name}</span><span>{company.industry || 'Industry not set'}</span></div>
          </div>
          <div className="panel">
            <h3>Hiring pipeline</h3>
            <div className="pipeline">{applicationStatuses.slice(0, 4).map((status) => <span key={status}>{status}<strong>{applications.filter((item) => item.status === status).length}</strong></span>)}</div>
          </div>
        </>
      )}
    </section>
  )
}
