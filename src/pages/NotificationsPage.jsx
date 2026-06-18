import EmptyState from '../components/EmptyState'

export default function NotificationsPage({ notifications }) {
  return (
    <section className="page-grid"><div className="panel wide"><h2>Notifications</h2><div className="notification-list">
      {notifications.length ? notifications.map((notification, index) => <div className="notification" key={`${notification}-${index}`}><span>{index + 1}</span><p>{notification}</p></div>) : <EmptyState title="No notifications" message="Important account and application updates will appear here." />}
    </div></div></section>
  )
}
