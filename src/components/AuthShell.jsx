export default function AuthShell({ children, className = '' }) {
  return (
    <main className="auth-main">
      <section className={`login-page ${className}`}>
        <div className="login-logo" aria-label="CareerLink logo">
          <img src="/logo.png" alt="" />
          <span>CareerLink</span>
        </div>
        {children}
      </section>
    </main>
  )
}
