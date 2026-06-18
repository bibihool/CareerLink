export default function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
      {action}
    </div>
  )
}
