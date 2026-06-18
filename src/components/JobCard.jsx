export default function JobCard({ job, actions }) {
  return (
    <article className="job-card">
      <div>
        <span className="status">{job.status}</span>
        <h3>{job.title}</h3>
        <p>{job.company}</p>
      </div>
      <p>{job.description}</p>
      <div className="job-meta">
        <span>{job.location}</span>
        <span>RM {Number(job.salary || 0).toLocaleString()}</span>
        <span>{job.type}</span>
      </div>
      <div className="actions">{actions}</div>
    </article>
  )
}
