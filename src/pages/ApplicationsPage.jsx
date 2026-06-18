import EmptyState from '../components/EmptyState'
import { applicationStatuses } from '../constants'
import { FileText } from 'lucide-react'

export default function ApplicationsPage({ isEmployer, applications, onStatusChange, onViewResume }) {
  return (
    <section className="page-grid">
      <div className="panel wide">
        <h2>{isEmployer ? 'Applicant tracking' : 'My applications'}</h2>
        {applications.length ? (
          <div className="table-wrap"><table><thead><tr><th>Applicant</th><th>Job</th><th>Resume</th><th>Status</th><th>Tracking action</th></tr></thead><tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td><strong>{application.applicant}</strong><span>{application.email}</span></td>
                <td>{application.job?.title || 'Removed job'}</td>
                <td>{application.resume ? <button className="resume-link" type="button" onClick={() => onViewResume(application.resume)}><FileText aria-hidden="true" size={17} />View Resume</button> : <span>No resume uploaded</span>}</td>
                <td><span className="status">{application.status}</span></td>
                <td>{isEmployer ? <select value={application.status} onChange={(event) => onStatusChange(application.id, event.target.value)}>{applicationStatuses.map((status) => <option key={status}>{status}</option>)}</select> : <span>{application.note}</span>}</td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <EmptyState title={isEmployer ? 'No applicants yet' : 'No applications yet'} message={isEmployer ? 'Applications will appear here when candidates apply.' : 'Apply for a role and track its progress here.'} />}
      </div>
    </section>
  )
}
