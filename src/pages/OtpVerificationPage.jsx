import AuthShell from '../components/AuthShell'
import { AuthStatus } from './LoginPage'

export default function OtpVerificationPage({ email, code, setCode, isBusy, onSubmit, onBack, status, onDismissStatus }) {
  return (
    <AuthShell>
      <AuthStatus status={status} onDismiss={onDismissStatus} />
      <form className="login-card otp-card" onSubmit={onSubmit}>
        <h2>Verify your email</h2>
        <p>We sent a 6-digit code to {email}. Enter it below to create your account.</p>
        <div className="form-field">
          <label htmlFor="otp-code">6-digit code</label>
          <input id="otp-code" inputMode="numeric" maxLength="6" placeholder="Enter 6-digit code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} />
        </div>
        <button className="login-submit" disabled={isBusy} type="submit">{isBusy ? 'Checking...' : 'Verify account'}</button>
        <div className="login-secondary-actions single-action"><button type="button" onClick={onBack}>Back to registration</button></div>
      </form>
    </AuthShell>
  )
}
