import AuthShell from '../components/AuthShell'

export default function LoginPage({ authForm, setAuthForm, isBusy, onSubmit, onRegister, onForgotPassword, status, onDismissStatus }) {
  return (
    <AuthShell>
      {status?.message && <AuthStatus status={status} onDismiss={onDismissStatus} />}
      <form className="login-card" onSubmit={onSubmit}>
        <h2>Find the right job for you</h2>
        <div className="form-field">
          <label htmlFor="login-email">Email address</label>
          <input autoComplete="email" id="login-email" placeholder="Enter your email address" type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
        </div>
        <div className="form-field">
          <label htmlFor="login-password">Password</label>
          <input autoComplete="current-password" id="login-password" placeholder="Enter your password" type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />
        </div>
        <button className="login-submit" disabled={isBusy} type="submit">{isBusy ? 'Logging in...' : 'Login'}</button>
        <div className="login-secondary-actions">
          <button type="button" onClick={onRegister}>Register</button>
          <button type="button" onClick={onForgotPassword}>Forgot password</button>
        </div>
      </form>
    </AuthShell>
  )
}

export function AuthStatus({ status, onDismiss }) {
  if (!status?.message) return null
  return (
    <div className={`system-message auth-message ${status.type}`} role="status">
      <span>{status.message}</span>
      <button type="button" onClick={onDismiss}>Dismiss</button>
    </div>
  )
}
