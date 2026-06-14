import { useEffect, useMemo, useState } from 'react'
import './App.css'

const SERVER_BASE = import.meta.env.VITE_SERVER_BASE || 'http://localhost:5000'
const API_BASE = `${SERVER_BASE}/api`
const FILE_BASE = `${SERVER_BASE}/uploads`
const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship']
const applicationStatuses = ['Submitted', 'Under Review', 'Interview', 'Offered', 'Rejected']

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

function App() {
  const [activePage, setActivePage] = useState('login')
  const [user, setUser] = useState(null)
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Job Seeker',
  })
  const [profile, setProfile] = useState({
    headline: 'Fresh graduate seeking frontend opportunities',
    location: 'Kuala Lumpur',
    resume: 'Aina_Rahman_Resume.pdf',
    skills: ['React', 'JavaScript', 'UI Testing'],
    education: ['BSc Software Engineering, MMU'],
    experience: ['Frontend Intern, Bright Labs'],
  })
  const [company, setCompany] = useState({
    name: 'BrightTech Malaysia',
    industry: 'Information Technology',
    description: 'A software studio hiring fresh graduates for product and client delivery teams.',
  })
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [verification, setVerification] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [filters, setFilters] = useState({ keyword: '', location: '', salary: '', type: '' })
  const [jobForm, setJobForm] = useState({
    title: '',
    location: '',
    salary: '',
    type: 'Full-time',
    description: '',
  })
  const [editingJobId, setEditingJobId] = useState(null)
  const [quickAdd, setQuickAdd] = useState({ skills: '', education: '', experience: '' })

  const openJobs = jobs.filter((job) => job.status === 'Open').length
  const isEmployer = user?.role === 'Employer'
  const isJobSeeker = user?.role === 'Job Seeker'
  const trackedApplications = applications.map((application) => ({
    ...application,
    job: jobs.find((job) => job.id === application.jobId),
  }))
  const seekerApplications = trackedApplications.filter((application) => application.email === user?.email)
  const navigationItems = isEmployer
    ? [
        ['dashboard', 'Overview'],
        ['employer', 'Company & Jobs'],
        ['applications', 'Applicant Tracking'],
        ['notifications', 'Notifications'],
      ]
    : [
        ['dashboard', 'Overview'],
        ['seeker', 'My Profile'],
        ['search', 'Find Jobs'],
        ['applications', 'My Applications'],
        ['notifications', 'Notifications'],
      ]

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const keywordMatch = `${job.title} ${job.company} ${job.description}`
        .toLowerCase()
        .includes(filters.keyword.toLowerCase())
      const locationMatch = job.location.toLowerCase().includes(filters.location.toLowerCase())
      const salaryMatch = !filters.salary || job.salary >= Number(filters.salary)
      const typeMatch = !filters.type || job.type === filters.type
      return keywordMatch && locationMatch && salaryMatch && typeMatch
    })
  }, [filters, jobs])

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    try {
      const data = await apiRequest('/jobs')
      setJobs(data)
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function loadApplications() {
    try {
      const data = await apiRequest('/applications')
      setApplications(data)
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function loadNotifications(userId) {
    try {
      const data = await apiRequest(`/notifications?userId=${userId}`)
      setNotifications(data)
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function loadProfile(currentUser) {
    try {
      if (currentUser.role === 'Employer') {
        const data = await apiRequest(`/profiles/employer/${currentUser.id}`)
        setCompany(data)
      } else {
        const data = await apiRequest(`/profiles/seeker/${currentUser.id}`)
        setProfile(data)
      }
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function refreshWorkspace(currentUser) {
    await Promise.all([
      loadJobs(),
      loadApplications(),
      loadNotifications(currentUser.id),
      loadProfile(currentUser),
    ])
  }

  async function addNotification(message, userId = user?.id) {
    setNotifications((items) => [message, ...items])
    try {
      await apiRequest('/notifications', {
        method: 'POST',
        body: JSON.stringify({ userId, message }),
      })
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
      })
      setUser(data.user)
      await refreshWorkspace(data.user)
      await addNotification(`${data.user.name} logged in as ${data.user.role}.`, data.user.id)
      setActivePage('dashboard')
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    if (authForm.password !== authForm.confirmPassword) {
      setStatusMessage('Password and confirm password do not match')
      return
    }

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(authForm),
      })
      setVerification((current) => ({ ...current, email: data.email || authForm.email, code: '' }))
      setActivePage('verify-registration')
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function handleVerifyRegistration(event) {
    event.preventDefault()
    try {
      const data = await apiRequest('/auth/register/verify', {
        method: 'POST',
        body: JSON.stringify({ email: verification.email, code: verification.code }),
      })
      setUser(data.user)
      await refreshWorkspace(data.user)
      await addNotification(`Registration complete for ${data.user.name}.`, data.user.id)
      setActivePage('dashboard')
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function handleSendPasswordCode(event) {
    event.preventDefault()
    try {
      const data = await apiRequest('/auth/password/send-code', {
        method: 'POST',
        body: JSON.stringify({ email: verification.email || authForm.email }),
      })
      setVerification((current) => ({ ...current, email: data.email || authForm.email, code: '' }))
      setActivePage('reset-password')
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    if (verification.newPassword !== verification.confirmNewPassword) {
      setStatusMessage('New password and confirm password do not match')
      return
    }

    try {
      await apiRequest('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({
          email: verification.email,
          code: verification.code,
          password: verification.newPassword,
        }),
      })
      setStatusMessage('Password reset successful. Please login with your new password.')
      setActivePage('login')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  function handleLogout() {
    addNotification('You have logged out successfully.')
    setUser(null)
    setActivePage('login')
  }

  async function saveProfile(event) {
    event.preventDefault()
    try {
      await apiRequest(`/profiles/seeker/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(profile),
      })
      await addNotification('Job seeker profile updated.')
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function saveCompany(event) {
    event.preventDefault()
    try {
      await apiRequest(`/profiles/employer/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(company),
      })
      await addNotification('Employer profile updated.')
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  function addProfileItem(type) {
    const value = quickAdd[type].trim()
    if (!value) return
    setProfile((current) => ({ ...current, [type]: [...current[type], value] }))
    setQuickAdd((current) => ({ ...current, [type]: '' }))
  }

  async function saveResume(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      addNotification('Resume upload requires a PDF file.')
      return
    }

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const data = await apiRequest(`/profiles/seeker/${user.id}/resume`, {
        method: 'POST',
        body: formData,
      })
      setProfile((current) => ({ ...current, resume: data.resume }))
      await addNotification(`Resume uploaded: ${file.name}.`)
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function submitJob(event) {
    event.preventDefault()
    const payload = {
      title: jobForm.title,
      company: company.name,
      location: jobForm.location,
      salary: Number(jobForm.salary),
      type: jobForm.type,
      description: jobForm.description,
      status: 'Open',
      employerId: user.id,
    }

    try {
      if (editingJobId) {
        const updatedJob = await apiRequest(`/jobs/${editingJobId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setJobs((items) => items.map((job) => (job.id === editingJobId ? updatedJob : job)))
        await addNotification(`${payload.title} updated.`)
      } else {
        const createdJob = await apiRequest('/jobs', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setJobs((items) => [createdJob, ...items])
        await addNotification(`${payload.title} created.`)
      }

      setJobForm({ title: '', location: '', salary: '', type: 'Full-time', description: '' })
      setEditingJobId(null)
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  function editJob(job) {
    setEditingJobId(job.id)
    setJobForm({
      title: job.title,
      location: job.location,
      salary: job.salary,
      type: job.type,
      description: job.description,
    })
    setActivePage('employer')
  }

  async function deleteJob(jobId) {
    const job = jobs.find((item) => item.id === jobId)
    try {
      await apiRequest(`/jobs/${jobId}`, { method: 'DELETE' })
      setJobs((items) => items.filter((item) => item.id !== jobId))
      setApplications((items) => items.filter((item) => item.jobId !== jobId))
      await addNotification(`${job?.title || 'Job'} deleted.`)
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function closeJob(jobId) {
    try {
      await apiRequest(`/jobs/${jobId}/close`, { method: 'PATCH' })
      setJobs((items) => items.map((job) => (job.id === jobId ? { ...job, status: 'Closed' } : job)))
      await addNotification('Job posting closed.')
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function applyForJob(job) {
    if (!user) {
      setActivePage('login')
      return
    }

    const exists = applications.some(
      (application) => application.jobId === job.id && application.email === user.email,
    )
    if (exists) {
      addNotification(`You already applied for ${job.title}.`)
      return
    }

    try {
      const application = await apiRequest('/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobId: job.id,
          userId: user.id,
          resume: profile.resume,
          note: profile.headline,
        }),
      })
      setApplications((items) => [application, ...items])
      await addNotification(`Application submitted for ${job.title}.`)
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  async function updateApplicationStatus(applicationId, status) {
    try {
      await apiRequest(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setApplications((items) =>
        items.map((application) => (application.id === applicationId ? { ...application, status } : application)),
      )
      await addNotification(`Applicant status changed to ${status}.`)
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(error.message)
    }
  }

  return (
    <div className="app-shell">
      {user && (
        <header className="topbar">
          <div>
            <p className="eyebrow">CareerLink Malaysia</p>
            <h1>CareerLink</h1>
          </div>
          <div className="user-pill">
            <span>{`${user.name} - ${user.role}`}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </header>
      )}

      {user && (
        <nav className="nav-tabs" aria-label="CareerLink modules">
          {navigationItems.map(([page, label]) => (
            <button className={activePage === page ? 'active' : ''} key={page} onClick={() => setActivePage(page)}>
              {label}
            </button>
          ))}
        </nav>
      )}

      <main className={!user ? 'auth-main' : ''}>
        {statusMessage && <div className="system-message">{statusMessage}</div>}

        {activePage === 'dashboard' && (
          <section className="page-grid dashboard-grid">
            <div className="intro-panel">
              <p className="eyebrow">{isEmployer ? 'Employer workspace' : 'Graduate career workspace'}</p>
              <h2>{isEmployer ? 'Manage hiring from job post to shortlist.' : 'Find graduate jobs and track every application.'}</h2>
              <p>
                {isEmployer
                  ? 'Create vacancies, monitor applicants, move candidates through each stage, and keep hiring updates in one place.'
                  : 'Build your profile once, apply with your saved resume, and follow application progress without guessing what happened next.'}
              </p>
              <div className="hero-actions">
                {isEmployer ? (
                  <>
                    <button onClick={() => setActivePage('employer')}>Post a job</button>
                    <button className="secondary" onClick={() => setActivePage('applications')}>Review applicants</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setActivePage('search')}>Search jobs</button>
                    <button className="secondary" onClick={() => setActivePage('seeker')}>Complete profile</button>
                  </>
                )}
              </div>
            </div>
            <StatCard label={isEmployer ? 'Open roles' : 'Open jobs'} value={openJobs} />
            <StatCard label={isEmployer ? 'Total applicants' : 'My applications'} value={isEmployer ? applications.length : seekerApplications.length} />
            <StatCard label="Notifications" value={notifications.length} />
            {isJobSeeker && (
              <>
                <div className="panel">
                  <h3>Profile strength</h3>
                  <p>{profile.headline}</p>
                  <div className="progress-bar"><span style={{ width: '78%' }}></span></div>
                  <p>Resume, skills, education, and experience are ready for one-click applications.</p>
                </div>
                <div className="panel">
                  <h3>Recommended roles</h3>
                  <div className="mini-list">
                    {jobs.filter((job) => job.status === 'Open').slice(0, 2).map((job) => (
                      <button key={job.id} onClick={() => setActivePage('search')}>{job.title} - {job.location}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {isEmployer && (
              <>
                <div className="panel">
                  <h3>Company profile</h3>
                  <p>{company.description}</p>
                  <div className="company-meta">
                    <span>{company.name}</span>
                    <span>{company.industry}</span>
                  </div>
                </div>
                <div className="panel">
                  <h3>Hiring pipeline</h3>
                  <div className="pipeline">
                    {applicationStatuses.slice(0, 4).map((status) => (
                      <span key={status}>{status}<strong>{applications.filter((item) => item.status === status).length}</strong></span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {activePage === 'login' && (
          <LoginPage
            authForm={authForm}
            setAuthForm={setAuthForm}
            onSubmit={handleLogin}
            onRegister={() => setActivePage('register')}
            onForgotPassword={() => setActivePage('forgot-password')}
          />
        )}

        {activePage === 'forgot-password' && (
          <PasswordRecoveryPage
            email={verification.email || authForm.email}
            setEmail={(email) => setVerification({ ...verification, email })}
            onSubmit={handleSendPasswordCode}
            onBack={() => setActivePage('login')}
          />
        )}

        {activePage === 'verify-registration' && (
          <OtpVerificationPage
            title="Verify your email"
            message={`We sent a 6-digit code to ${verification.email}. Enter it below to create your account.`}
            code={verification.code}
            setCode={(code) => setVerification({ ...verification, code })}
            onSubmit={handleVerifyRegistration}
            primaryLabel="Verify account"
            secondaryLabel="Back to registration"
            onSecondary={() => setActivePage('register')}
          />
        )}

        {activePage === 'reset-password' && (
          <ResetPasswordPage
            verification={verification}
            setVerification={setVerification}
            onSubmit={handleResetPassword}
            onBack={() => setActivePage('forgot-password')}
          />
        )}

        {activePage === 'register' && (
          <RegistrationPage
            authForm={authForm}
            setAuthForm={setAuthForm}
            onSubmit={handleRegister}
            onLogin={() => setActivePage('login')}
          />
        )}

        {activePage === 'seeker' && (
          <section className="page-grid two-column">
            <form className="panel form-panel" onSubmit={saveProfile}>
              <h2>Edit job seeker profile</h2>
              <label>
                Headline
                <input value={profile.headline} onChange={(event) => setProfile({ ...profile, headline: event.target.value })} />
              </label>
              <label>
                Location
                <input value={profile.location} onChange={(event) => setProfile({ ...profile, location: event.target.value })} />
              </label>
              <label>
                Upload resume PDF
                <input accept="application/pdf" type="file" onChange={saveResume} />
              </label>
              <button type="submit">Save profile</button>
            </form>
            <ProfileBuilder title="Skills" type="skills" items={profile.skills} quickAdd={quickAdd} setQuickAdd={setQuickAdd} onAdd={addProfileItem} />
            <ProfileBuilder title="Education" type="education" items={profile.education} quickAdd={quickAdd} setQuickAdd={setQuickAdd} onAdd={addProfileItem} />
            <ProfileBuilder title="Work experience" type="experience" items={profile.experience} quickAdd={quickAdd} setQuickAdd={setQuickAdd} onAdd={addProfileItem} />
          </section>
        )}

        {activePage === 'employer' && (
          <section className="page-grid two-column">
            <form className="panel form-panel" onSubmit={saveCompany}>
              <h2>Employer profile</h2>
              <label>
                Company name
                <input value={company.name} onChange={(event) => setCompany({ ...company, name: event.target.value })} />
              </label>
              <label>
                Industry
                <input value={company.industry} onChange={(event) => setCompany({ ...company, industry: event.target.value })} />
              </label>
              <label>
                Company description
                <textarea value={company.description} onChange={(event) => setCompany({ ...company, description: event.target.value })} />
              </label>
              <button type="submit">Save company</button>
            </form>

            <form className="panel form-panel" onSubmit={submitJob}>
              <h2>{editingJobId ? 'Edit job' : 'Create job'}</h2>
              <label>
                Job title
                <input required value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} />
              </label>
              <div className="split">
                <label>
                  Location
                  <input required value={jobForm.location} onChange={(event) => setJobForm({ ...jobForm, location: event.target.value })} />
                </label>
                <label>
                  Salary
                  <input required min="0" type="number" value={jobForm.salary} onChange={(event) => setJobForm({ ...jobForm, salary: event.target.value })} />
                </label>
              </div>
              <label>
                Employment type
                <select value={jobForm.type} onChange={(event) => setJobForm({ ...jobForm, type: event.target.value })}>
                  {employmentTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <label>
                Description
                <textarea required value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} />
              </label>
              <button type="submit">{editingJobId ? 'Update job' : 'Create job'}</button>
            </form>

            <div className="panel wide">
              <h2>Job management</h2>
              <div className="job-list">
                {jobs.map((job) => (
                  <JobCard
                    job={job}
                    key={job.id}
                    actions={
                      <>
                        <button onClick={() => editJob(job)}>Edit</button>
                        <button onClick={() => closeJob(job.id)} disabled={job.status === 'Closed'}>Close</button>
                        <button className="danger" onClick={() => deleteJob(job.id)}>Delete</button>
                      </>
                    }
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {activePage === 'search' && (
          <section className="page-grid">
            <div className="panel search-panel">
              <h2>Job search</h2>
              <input placeholder="Keyword" value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} />
              <input placeholder="Location" value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} />
              <input placeholder="Minimum salary" type="number" value={filters.salary} onChange={(event) => setFilters({ ...filters, salary: event.target.value })} />
              <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
                <option value="">All employment types</option>
                {employmentTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div className="job-list">
              {filteredJobs.map((job) => (
                <JobCard job={job} key={job.id} actions={<button disabled={job.status === 'Closed'} onClick={() => applyForJob(job)}>Apply</button>} />
              ))}
            </div>
          </section>
        )}

        {activePage === 'applications' && (
          <section className="page-grid">
            <div className="panel wide">
              <h2>{isEmployer ? 'Applicant tracking' : 'My applications'}</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Job</th>
                      <th>Resume</th>
                      <th>Status</th>
                      <th>Tracking action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isEmployer ? trackedApplications : seekerApplications).map((application) => (
                      <tr key={application.id}>
                        <td>
                          <strong>{application.applicant}</strong>
                          <span>{application.email}</span>
                        </td>
                        <td>{application.job?.title || 'Removed job'}</td>
                        <td>
                          {application.resume ? (
                            <a
                              className="resume-link"
                              href={`${FILE_BASE}/${application.resume}`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              View resume
                            </a>
                          ) : (
                            <span>No resume uploaded</span>
                          )}
                          {application.resume && <span>{application.resume}</span>}
                        </td>
                        <td><span className="status">{application.status}</span></td>
                        <td>
                          {isEmployer ? (
                            <select value={application.status} onChange={(event) => updateApplicationStatus(application.id, event.target.value)}>
                              {applicationStatuses.map((status) => <option key={status}>{status}</option>)}
                            </select>
                          ) : (
                            <span>{application.note}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activePage === 'notifications' && (
          <section className="page-grid">
            <div className="panel wide">
              <h2>Notifications</h2>
              <div className="notification-list">
                {notifications.map((notification, index) => (
                  <div className="notification" key={`${notification}-${index}`}>
                    <span>{index + 1}</span>
                    <p>{notification}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function LoginPage({ authForm, setAuthForm, onSubmit, onRegister, onForgotPassword }) {
  return (
    <section className="login-page">
      <div className="login-logo" aria-label="CareerLink logo">
        CareerLink
      </div>

      <form className="login-card" onSubmit={onSubmit}>
        <h2>Find the right job for you</h2>
        <div className="form-field">
          <label htmlFor="login-email">Email address</label>
          <input
            autoComplete="email"
            id="login-email"
            placeholder="Enter your email address"
            type="email"
            value={authForm.email}
            onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor="login-password">Password</label>
          <input
            autoComplete="current-password"
            id="login-password"
            placeholder="Enter your password"
            type="password"
            value={authForm.password}
            onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
          />
        </div>
        <button className="login-submit" type="submit">
          Login
        </button>
        <div className="login-secondary-actions">
          <button type="button" onClick={onRegister}>
            Register
          </button>
          <button type="button" onClick={onForgotPassword}>
            Forgot password
          </button>
        </div>
      </form>
    </section>
  )
}

function PasswordRecoveryPage({ email, setEmail, onSubmit, onBack }) {
  return (
    <section className="login-page">
      <div className="login-logo" aria-label="CareerLink logo">
        CareerLink
      </div>
      <form className="login-card" onSubmit={onSubmit}>
        <h2>Password recovery</h2>
        <p>Enter your email address and CareerLink will send a 6-digit recovery code.</p>
        <div className="form-field">
          <label htmlFor="recovery-email">Email address</label>
          <input
            autoComplete="email"
            id="recovery-email"
            placeholder="Enter your email address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <button className="login-submit" type="submit">
          Send code
        </button>
        <div className="login-secondary-actions single-action">
          <button type="button" onClick={onBack}>
            Back to login
          </button>
        </div>
      </form>
    </section>
  )
}

function OtpVerificationPage({
  title,
  message,
  code,
  setCode,
  onSubmit,
  primaryLabel,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <section className="login-page">
      <div className="login-logo" aria-label="CareerLink logo">
        CareerLink
      </div>
      <form className="login-card otp-card" onSubmit={onSubmit}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="form-field">
          <label htmlFor="otp-code">6-digit code</label>
          <input
            id="otp-code"
            inputMode="numeric"
            maxLength="6"
            placeholder="Enter 6-digit code"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </div>
        <button className="login-submit" type="submit">
          {primaryLabel}
        </button>
        <div className="login-secondary-actions single-action">
          <button type="button" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        </div>
      </form>
    </section>
  )
}

function ResetPasswordPage({ verification, setVerification, onSubmit, onBack }) {
  return (
    <section className="login-page">
      <div className="login-logo" aria-label="CareerLink logo">
        CareerLink
      </div>
      <form className="login-card registration-card" onSubmit={onSubmit}>
        <h2>Reset password</h2>
        <p>Enter the 6-digit code sent to {verification.email}, then create a new password.</p>
        <div className="form-field">
          <label htmlFor="reset-code">6-digit code</label>
          <input
            id="reset-code"
            inputMode="numeric"
            maxLength="6"
            placeholder="Enter 6-digit code"
            type="text"
            value={verification.code}
            onChange={(event) =>
              setVerification({ ...verification, code: event.target.value.replace(/\D/g, '').slice(0, 6) })
            }
          />
        </div>
        <div className="form-field">
          <label htmlFor="reset-password">New password</label>
          <input
            autoComplete="new-password"
            id="reset-password"
            placeholder="Create a new password"
            type="password"
            value={verification.newPassword}
            onChange={(event) => setVerification({ ...verification, newPassword: event.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor="reset-confirm-password">Confirm new password</label>
          <input
            autoComplete="new-password"
            id="reset-confirm-password"
            placeholder="Confirm your new password"
            type="password"
            value={verification.confirmNewPassword}
            onChange={(event) => setVerification({ ...verification, confirmNewPassword: event.target.value })}
          />
        </div>
        <button className="login-submit" type="submit">
          Reset password
        </button>
        <div className="login-secondary-actions single-action">
          <button type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </form>
    </section>
  )
}

function RegistrationPage({ authForm, setAuthForm, onSubmit, onLogin }) {
  return (
    <section className="login-page registration-page">
      <div className="login-logo" aria-label="CareerLink logo">
        CareerLink
      </div>

      <form className="login-card registration-card" onSubmit={onSubmit}>
        <h2>Create Account</h2>
        <div className="form-field">
          <label htmlFor="register-name">Full name</label>
          <input
            autoComplete="name"
            id="register-name"
            placeholder="Enter your full name"
            type="text"
            value={authForm.name}
            onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor="register-email">Email address</label>
          <input
            autoComplete="email"
            id="register-email"
            placeholder="Enter your email address"
            type="email"
            value={authForm.email}
            onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor="register-password">Password</label>
          <input
            autoComplete="new-password"
            id="register-password"
            placeholder="Create a password"
            type="password"
            value={authForm.password}
            onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor="register-confirm-password">Confirm password</label>
          <input
            autoComplete="new-password"
            id="register-confirm-password"
            placeholder="Confirm your password"
            type="password"
            value={authForm.confirmPassword}
            onChange={(event) => setAuthForm({ ...authForm, confirmPassword: event.target.value })}
          />
        </div>
        <div className="form-field">
          <label htmlFor="register-role">Account role</label>
          <select
            id="register-role"
            value={authForm.role}
            onChange={(event) => setAuthForm({ ...authForm, role: event.target.value })}
          >
            <option>Job Seeker</option>
            <option>Employer</option>
            <option>Admin</option>
          </select>
        </div>
        <button className="login-submit" type="submit">
          Register
        </button>
        <div className="login-secondary-actions single-action">
          <button type="button" onClick={onLogin}>
            Back to login
          </button>
        </div>
      </form>
    </section>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ProfileBuilder({ title, type, items, quickAdd, setQuickAdd, onAdd }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      <div className="tag-row">{items.map((item) => <span key={item}>{item}</span>)}</div>
      <div className="inline-add">
        <input value={quickAdd[type]} onChange={(event) => setQuickAdd({ ...quickAdd, [type]: event.target.value })} placeholder={`Add ${title.toLowerCase()}`} />
        <button onClick={() => onAdd(type)}>Add</button>
      </div>
    </div>
  )
}

function JobCard({ job, actions }) {
  return (
    <article className="job-card">
      <div>
        <span className="status">{job.status}</span>
        <h3>{job.title}</h3>
        <p>{job.company}</p>
      </div>
      <p>{job.description}</p>
      <div className="job-meta">
        <span>{job.location}</span>
        <span>RM {job.salary.toLocaleString()}</span>
        <span>{job.type}</span>
      </div>
      <div className="actions">{actions}</div>
    </article>
  )
}

export default App
