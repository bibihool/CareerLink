import AuthShell from '../components/AuthShell'
import { AuthStatus } from './LoginPage'

export default function ForgotPasswordPage({ email, setEmail, isBusy, onSubmit, onBack, status, onDismissStatus }) {
  return (
    <AuthShell>
      <AuthStatus status={status} onDismiss={onDismissStatus} />
      <form className="login-card" onSubmit={onSubmit}>
        <h2>Password recovery</h2>
        <p>Enter your email address and CareerLink will send a 6-digit recovery code.</p>
        <div className="form-field">
          <label htmlFor="recovery-email">Email address</label>
          <input autoComplete="email" id="recovery-email" placeholder="Enter your email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <button className="login-submit" disabled={isBusy} type="submit">{isBusy ? 'Sending...' : 'Send code'}</button>
        <div className="login-secondary-actions single-action"><button type="button" onClick={onBack}>Back to login</button></div>
      </form>
    </AuthShell>
  )
}
