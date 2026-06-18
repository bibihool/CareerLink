export default function LoadingSkeleton() {
  return (
    <section className="loading-skeleton" aria-busy="true" aria-label="Loading workspace">
      <div className="skeleton skeleton-hero" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-stat" />
        <div className="skeleton skeleton-stat" />
        <div className="skeleton skeleton-stat" />
      </div>
      <div className="skeleton-grid skeleton-content-grid">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
      </div>
      <span className="sr-only">Loading your CareerLink workspace</span>
    </section>
  )
}
