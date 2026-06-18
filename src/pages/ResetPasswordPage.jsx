import AuthShell from '../components/AuthShell'
import { AuthStatus } from './LoginPage'

export default function ResetPasswordPage({ verification, setVerification, isBusy, onSubmit, onBack, status, onDismissStatus }) {
  return (
    <AuthShell>
      <AuthStatus status={status} onDismiss={onDismissStatus} />
      <form className="login-card registration-card" onSubmit={onSubmit}>
        <h2>Reset password</h2>
        <p>Enter the 6-digit code sent to {verification.email}, then create a new password.</p>
        <div className="form-field">
          <label htmlFor="reset-code">6-digit code</label>
          <input id="reset-code" inputMode="numeric" maxLength="6" placeholder="Enter 6-digit code" value={verification.code} onChange={(event) => setVerification({ ...verification, code: event.target.value.replace(/\D/g, '').slice(0, 6) })} />
        </div>
        <div className="form-field">
          <label htmlFor="reset-password">New password</label>
          <input autoComplete="new-password" id="reset-password" placeholder="Create a new password" type="password" value={verification.newPassword} onChange={(event) => setVerification({ ...verification, newPassword: event.target.value })} />
        </div>
        <div className="form-field">
          <label htmlFor="reset-confirm-password">Confirm new password</label>
          <input autoComplete="new-password" id="reset-confirm-password" placeholder="Confirm your new password" type="password" value={verification.confirmNewPassword} onChange={(event) => setVerification({ ...verification, confirmNewPassword: event.target.value })} />
        </div>
        <button className="login-submit" disabled={isBusy} type="submit">{isBusy ? 'Resetting...' : 'Reset password'}</button>
        <div className="login-secondary-actions single-action"><button type="button" onClick={onBack}>Back</button></div>
      </form>
    </AuthShell>
  )
}
