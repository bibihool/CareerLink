import AuthShell from '../components/AuthShell'
import { AuthStatus } from './LoginPage'

export default function RegistrationPage({ authForm, setAuthForm, isBusy, onSubmit, onLogin, status, onDismissStatus }) {
  return (
    <AuthShell className="registration-page">
      <AuthStatus status={status} onDismiss={onDismissStatus} />
      <form className="login-card registration-card" onSubmit={onSubmit}>
        <h2>Create Account</h2>
        <div className="form-field">
          <label htmlFor="register-name">Full name</label>
          <input autoComplete="name" id="register-name" placeholder="Enter your full name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} />
        </div>
        <div className="form-field">
          <label htmlFor="register-email">Email address</label>
          <input autoComplete="email" id="register-email" placeholder="Enter your email address" type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
        </div>
        <div className="form-field">
          <label htmlFor="register-password">Password</label>
          <input autoComplete="new-password" id="register-password" placeholder="Create a password" type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />
          <small>Use at least 6 characters.</small>
        </div>
        <div className="form-field">
          <label htmlFor="register-confirm-password">Confirm password</label>
          <input autoComplete="new-password" id="register-confirm-password" placeholder="Confirm your password" type="password" value={authForm.confirmPassword} onChange={(event) => setAuthForm({ ...authForm, confirmPassword: event.target.value })} />
        </div>
        <div className="form-field">
          <label htmlFor="register-role">Account role</label>
          <select id="register-role" value={authForm.role} onChange={(event) => setAuthForm({ ...authForm, role: event.target.value })}>
            <option>Job Seeker</option>
            <option>Employer</option>
          </select>
        </div>
        <button className="login-submit" disabled={isBusy} type="submit">{isBusy ? 'Sending code...' : 'Register'}</button>
        <div className="login-secondary-actions single-action"><button type="button" onClick={onLogin}>Back to login</button></div>
      </form>
    </AuthShell>
  )
}
