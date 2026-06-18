import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import { apiRequest, clearSession, getStoredSession, openProtectedFile, storeSession } from './api'
import { emptyCompany, emptyJobForm, emptyProfile } from './constants'
import AppLayout from './components/AppLayout'
import AdminPage from './pages/AdminPage'
import ApplicationsPage from './pages/ApplicationsPage'
import DashboardPage from './pages/DashboardPage'
import EmployerJobsPage from './pages/EmployerJobsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import JobSearchPage from './pages/JobSearchPage'
import LoginPage from './pages/LoginPage'
import NotificationsPage from './pages/NotificationsPage'
import OtpVerificationPage from './pages/OtpVerificationPage'
import RegistrationPage from './pages/RegistrationPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SeekerProfilePage from './pages/SeekerProfilePage'

function App() {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => getStoredSession())
  const user = session?.user || null
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'Job Seeker' })
  const [verification, setVerification] = useState({ email: '', code: '', newPassword: '', confirmNewPassword: '' })
  const [profile, setProfile] = useState({ ...emptyProfile })
  const [company, setCompany] = useState({ ...emptyCompany })
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState([])
  const [adminUsers, setAdminUsers] = useState([])
  const [status, setStatus] = useState(null)
  const [isBusy, setIsBusy] = useState(false)
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(() => Boolean(getStoredSession()))
  const [filters, setFilters] = useState({ keyword: '', location: '', salary: '', type: '' })
  const [jobForm, setJobForm] = useState({ ...emptyJobForm })
  const [editingJobId, setEditingJobId] = useState(null)
  const [quickAdd, setQuickAdd] = useState({ skills: '', education: '', experience: '' })

  const trackedApplications = applications.map((application) => ({
    ...application,
    job: jobs.find((job) => job.id === application.jobId),
  }))
  const employerJobs = jobs.filter((job) => Number(job.employerId) === Number(user?.id))
  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const keywordMatch = `${job.title} ${job.company} ${job.description}`.toLowerCase().includes(filters.keyword.toLowerCase())
    const locationMatch = job.location.toLowerCase().includes(filters.location.toLowerCase())
    const salaryMatch = !filters.salary || job.salary >= Number(filters.salary)
    const typeMatch = !filters.type || job.type === filters.type
    return keywordMatch && locationMatch && salaryMatch && typeMatch
  }), [filters, jobs])

  useEffect(() => {
    if (user) refreshWorkspace(user)
    else loadJobs().catch((error) => showStatus(error.message))

    const handleUnauthorized = () => {
      resetUserState()
      setSession(null)
      setStatus({ type: 'error', message: 'Your session expired. Please login again.' })
      navigate('/login')
    }
    window.addEventListener('careerlink:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('careerlink:unauthorized', handleUnauthorized)
    // Initial hydration and session listener run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function showStatus(message, type = 'error') {
    setStatus({ message, type })
  }

  function resetUserState() {
    setProfile({ ...emptyProfile })
    setCompany({ ...emptyCompany })
    setJobs([])
    setApplications([])
    setNotifications([])
    setAdminUsers([])
    setFilters({ keyword: '', location: '', salary: '', type: '' })
    setJobForm({ ...emptyJobForm })
    setEditingJobId(null)
    setQuickAdd({ skills: '', education: '', experience: '' })
    setIsWorkspaceLoading(false)
  }

  async function withBusy(action) {
    if (isBusy) return
    setIsBusy(true)
    try {
      await action()
    } finally {
      setIsBusy(false)
    }
  }

  async function loadJobs() {
    const data = await apiRequest('/jobs')
    setJobs(data)
    return data
  }

  async function loadApplications() {
    const data = await apiRequest('/applications')
    setApplications(data)
  }

  async function loadNotifications() {
    const data = await apiRequest('/notifications')
    setNotifications(data)
  }

  async function loadProfile(currentUser) {
    if (currentUser.role === 'Employer') {
      setCompany(await apiRequest(`/profiles/employer/${currentUser.id}`))
    } else if (currentUser.role === 'Job Seeker') {
      setProfile(await apiRequest(`/profiles/seeker/${currentUser.id}`))
    }
  }

  async function loadAdminUsers() {
    setAdminUsers(await apiRequest('/admin/users'))
  }

  async function refreshWorkspace(currentUser) {
    setIsWorkspaceLoading(true)
    try {
      await Promise.all([
        loadJobs(),
        loadApplications(),
        loadNotifications(),
        loadProfile(currentUser),
        currentUser.role === 'Admin' ? loadAdminUsers() : Promise.resolve(),
      ])
    } catch (error) {
      showStatus(error.message)
    } finally {
      setIsWorkspaceLoading(false)
    }
  }

  async function addNotification(message) {
    setNotifications((items) => [message, ...items])
    await apiRequest('/notifications', { method: 'POST', body: JSON.stringify({ message }) })
  }

  async function handleLogin(event) {
    event.preventDefault()
    if (!authForm.email.trim() || !authForm.password) return showStatus('Please enter your email address and password.')
    await withBusy(async () => {
      try {
        const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email: authForm.email.trim(), password: authForm.password }) })
        const nextSession = { user: data.user, token: data.token }
        storeSession(nextSession)
        setSession(nextSession)
        await refreshWorkspace(data.user)
        setStatus(null)
        navigate('/dashboard')
      } catch (error) {
        showStatus(error.message)
      }
    })
  }

  async function handleRegister(event) {
    event.preventDefault()
    if (!authForm.name.trim() || !authForm.email.trim() || !authForm.password || !authForm.confirmPassword) return showStatus('Please complete all registration fields.')
    if (authForm.password.length < 6) return showStatus('Password must be at least 6 characters long.')
    if (authForm.password !== authForm.confirmPassword) return showStatus('Password and confirm password do not match.')
    await withBusy(async () => {
      try {
        const data = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ ...authForm, name: authForm.name.trim(), email: authForm.email.trim() }) })
        setVerification((current) => ({ ...current, email: data.email || authForm.email.trim(), code: '' }))
        showStatus('Verification code sent. Please check your email.', 'success')
        navigate('/verify-registration')
      } catch (error) {
        showStatus(error.message)
      }
    })
  }

  async function handleVerifyRegistration(event) {
    event.preventDefault()
    if (verification.code.length !== 6) return showStatus('Please enter the 6-digit verification code.')
    await withBusy(async () => {
      try {
        const data = await apiRequest('/auth/register/verify', { method: 'POST', body: JSON.stringify({ email: verification.email, code: verification.code }) })
        const nextSession = { user: data.user, token: data.token }
        storeSession(nextSession)
        setSession(nextSession)
        await refreshWorkspace(data.user)
        setStatus(null)
        navigate('/dashboard')
      } catch (error) {
        showStatus(error.message)
      }
    })
  }

  async function handleSendPasswordCode(event) {
    event.preventDefault()
    const email = (verification.email || authForm.email).trim()
    if (!email) return showStatus('Please enter your email address.')
    await withBusy(async () => {
      try {
        const data = await apiRequest('/auth/password/send-code', { method: 'POST', body: JSON.stringify({ email }) })
        setVerification((current) => ({ ...current, email: data.email || email, code: '' }))
        showStatus('Recovery code sent. Please check your email.', 'success')
        navigate('/reset-password')
      } catch (error) {
        showStatus(error.message)
      }
    })
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    if (verification.code.length !== 6) return showStatus('Please enter the 6-digit recovery code.')
    if (verification.newPassword.length < 6) return showStatus('New password must be at least 6 characters long.')
    if (verification.newPassword !== verification.confirmNewPassword) return showStatus('New password and confirm password do not match.')
    await withBusy(async () => {
      try {
        await apiRequest('/auth/password/reset', { method: 'POST', body: JSON.stringify({ email: verification.email, code: verification.code, password: verification.newPassword }) })
        showStatus('Password reset successful. Please login with your new password.', 'success')
        navigate('/login')
      } catch (error) {
        showStatus(error.message)
      }
    })
  }

  function handleLogout() {
    clearSession()
    resetUserState()
    setSession(null)
    setStatus(null)
    navigate('/login')
  }

  async function saveProfile(event) {
    event.preventDefault()
    try {
      await apiRequest(`/profiles/seeker/${user.id}`, { method: 'PUT', body: JSON.stringify(profile) })
      await addNotification('Job seeker profile updated.')
      showStatus('Profile saved successfully.', 'success')
    } catch (error) {
      showStatus(error.message)
    }
  }

  async function saveCompany(event) {
    event.preventDefault()
    try {
      await apiRequest(`/profiles/employer/${user.id}`, { method: 'PUT', body: JSON.stringify(company) })
      await addNotification('Employer profile updated.')
      showStatus('Company profile saved successfully.', 'success')
    } catch (error) {
      showStatus(error.message)
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
    if (file.type !== 'application/pdf') return showStatus('Resume upload requires a PDF file.')
    if (file.size > 5 * 1024 * 1024) return showStatus('Resume must be smaller than 5 MB.')
    const body = new FormData()
    body.append('resume', file)
    try {
      const data = await apiRequest(`/profiles/seeker/${user.id}/resume`, { method: 'POST', body })
      setProfile((current) => ({ ...current, resume: data.resume }))
      showStatus('Resume uploaded successfully.', 'success')
    } catch (error) {
      showStatus(error.message)
    }
  }

  async function submitJob(event) {
    event.preventDefault()
    try {
      const payload = { ...jobForm, salary: Number(jobForm.salary) }
      const savedJob = await apiRequest(editingJobId ? `/jobs/${editingJobId}` : '/jobs', { method: editingJobId ? 'PUT' : 'POST', body: JSON.stringify(payload) })
      setJobs((items) => editingJobId ? items.map((job) => job.id === editingJobId ? savedJob : job) : [savedJob, ...items])
      showStatus(editingJobId ? 'Job updated successfully.' : 'Job created successfully.', 'success')
      setJobForm({ ...emptyJobForm })
      setEditingJobId(null)
    } catch (error) {
      showStatus(error.message)
    }
  }

  function editJob(job) {
    setEditingJobId(job.id)
    setJobForm({ title: job.title, location: job.location, salary: job.salary, type: job.type, description: job.description })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteJob(jobId) {
    try {
      await apiRequest(`/jobs/${jobId}`, { method: 'DELETE' })
      setJobs((items) => items.filter((job) => job.id !== jobId))
      setApplications((items) => items.filter((application) => application.jobId !== jobId))
      showStatus('Job deleted successfully.', 'success')
    } catch (error) {
      showStatus(error.message)
    }
  }

  async function closeJob(jobId) {
    try {
      await apiRequest(`/jobs/${jobId}/close`, { method: 'PATCH' })
      setJobs((items) => items.map((job) => job.id === jobId ? { ...job, status: 'Closed' } : job))
      showStatus('Job posting closed.', 'success')
    } catch (error) {
      showStatus(error.message)
    }
  }

  async function applyForJob(job) {
    try {
      const application = await apiRequest('/applications', { method: 'POST', body: JSON.stringify({ jobId: job.id }) })
      setApplications((items) => [application, ...items])
      showStatus(`Application submitted for ${job.title}.`, 'success')
    } catch (error) {
      showStatus(error.message)
    }
  }

  async function updateApplicationStatus(applicationId, nextStatus) {
    try {
      await apiRequest(`/applications/${applicationId}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) })
      setApplications((items) => items.map((application) => application.id === applicationId ? { ...application, status: nextStatus } : application))
      showStatus(`Applicant status changed to ${nextStatus}.`, 'success')
    } catch (error) {
      showStatus(error.message)
    }
  }

  async function viewResume(filename) {
    try {
      await openProtectedFile(`/profiles/resumes/${encodeURIComponent(filename)}`)
    } catch (error) {
      showStatus(error.message)
    }
  }

  async function toggleUserSuspension(account) {
    try {
      await apiRequest(`/admin/users/${account.id}/suspension`, { method: 'PATCH', body: JSON.stringify({ suspended: !account.suspended }) })
      setAdminUsers((items) => items.map((item) => item.id === account.id ? { ...item, suspended: !item.suspended } : item))
      showStatus(account.suspended ? 'User reactivated.' : 'User suspended.', 'success')
    } catch (error) {
      showStatus(error.message)
    }
  }

  async function adminDeleteJob(jobId) {
    try {
      await apiRequest(`/admin/jobs/${jobId}`, { method: 'DELETE' })
      setJobs((items) => items.filter((job) => job.id !== jobId))
      setApplications((items) => items.filter((application) => application.jobId !== jobId))
      showStatus('Job posting removed.', 'success')
    } catch (error) {
      showStatus(error.message)
    }
  }

  const authStatusProps = { status, onDismissStatus: () => setStatus(null) }
  const hasApplied = (jobId) => applications.some((application) => application.jobId === jobId)

  return (
    <Routes>
      <Route path="/" element={<Navigate replace to={user ? '/dashboard' : '/login'} />} />
      <Route path="/login" element={user ? <Navigate replace to="/dashboard" /> : <LoginPage authForm={authForm} setAuthForm={setAuthForm} isBusy={isBusy} onSubmit={handleLogin} onRegister={() => navigate('/register')} onForgotPassword={() => navigate('/forgot-password')} {...authStatusProps} />} />
      <Route path="/register" element={user ? <Navigate replace to="/dashboard" /> : <RegistrationPage authForm={authForm} setAuthForm={setAuthForm} isBusy={isBusy} onSubmit={handleRegister} onLogin={() => navigate('/login')} {...authStatusProps} />} />
      <Route path="/verify-registration" element={<OtpVerificationPage email={verification.email} code={verification.code} setCode={(code) => setVerification({ ...verification, code })} isBusy={isBusy} onSubmit={handleVerifyRegistration} onBack={() => navigate('/register')} {...authStatusProps} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage email={verification.email || authForm.email} setEmail={(email) => setVerification({ ...verification, email })} isBusy={isBusy} onSubmit={handleSendPasswordCode} onBack={() => navigate('/login')} {...authStatusProps} />} />
      <Route path="/reset-password" element={<ResetPasswordPage verification={verification} setVerification={setVerification} isBusy={isBusy} onSubmit={handleResetPassword} onBack={() => navigate('/forgot-password')} {...authStatusProps} />} />

      <Route element={user ? <AppLayout user={user} status={status} isLoading={isWorkspaceLoading} onDismissStatus={() => setStatus(null)} onLogout={handleLogout} /> : <Navigate replace to="/login" />}>
        <Route path="/dashboard" element={<DashboardPage user={user} jobs={jobs} applications={trackedApplications} notifications={notifications} profile={profile} company={company} adminUsers={adminUsers} />} />
        <Route path="/profile" element={<RoleRoute user={user} roles={['Job Seeker']}><SeekerProfilePage profile={profile} setProfile={setProfile} quickAdd={quickAdd} setQuickAdd={setQuickAdd} onAddItem={addProfileItem} onSave={saveProfile} onResumeUpload={saveResume} /></RoleRoute>} />
        <Route path="/employer" element={<RoleRoute user={user} roles={['Employer']}><EmployerJobsPage company={company} setCompany={setCompany} jobForm={jobForm} setJobForm={setJobForm} editingJobId={editingJobId} jobs={employerJobs} onSaveCompany={saveCompany} onSubmitJob={submitJob} onEditJob={editJob} onCloseJob={closeJob} onDeleteJob={deleteJob} /></RoleRoute>} />
        <Route path="/jobs" element={<RoleRoute user={user} roles={['Job Seeker']}><JobSearchPage filters={filters} setFilters={setFilters} jobs={filteredJobs} hasApplied={hasApplied} onApply={applyForJob} /></RoleRoute>} />
        <Route path="/applications" element={<RoleRoute user={user} roles={['Job Seeker', 'Employer']}><ApplicationsPage isEmployer={user?.role === 'Employer'} applications={trackedApplications} onStatusChange={updateApplicationStatus} onViewResume={viewResume} /></RoleRoute>} />
        <Route path="/notifications" element={<NotificationsPage notifications={notifications} />} />
        <Route path="/admin" element={<RoleRoute user={user} roles={['Admin']}><AdminPage users={adminUsers} jobs={jobs} onToggleSuspension={toggleUserSuspension} onDeleteJob={adminDeleteJob} /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate replace to={user ? '/dashboard' : '/login'} />} />
    </Routes>
  )
}

function RoleRoute({ user, roles, children }) {
  return roles.includes(user?.role) ? children : <Navigate replace to="/dashboard" />
}

export default App
