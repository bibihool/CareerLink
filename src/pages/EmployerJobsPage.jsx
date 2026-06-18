import EmptyState from '../components/EmptyState'
import JobCard from '../components/JobCard'
import { employmentTypes } from '../constants'

export default function EmployerJobsPage({ company, setCompany, jobForm, setJobForm, editingJobId, jobs, onSaveCompany, onSubmitJob, onEditJob, onCloseJob, onDeleteJob }) {
  return (
    <section className="page-grid two-column">
      <form className="panel form-panel" onSubmit={onSaveCompany}>
        <h2>Employer profile</h2>
        <label>Company name<input required value={company.name} onChange={(event) => setCompany({ ...company, name: event.target.value })} /></label>
        <label>Industry<input required value={company.industry} onChange={(event) => setCompany({ ...company, industry: event.target.value })} /></label>
        <label>Company description<textarea required value={company.description} onChange={(event) => setCompany({ ...company, description: event.target.value })} /></label>
        <button type="submit">Save company</button>
      </form>

      <form className="panel form-panel" onSubmit={onSubmitJob}>
        <h2>{editingJobId ? 'Edit job' : 'Create job'}</h2>
        <label>Job title<input required value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} /></label>
        <div className="split">
          <label>Location<input required value={jobForm.location} onChange={(event) => setJobForm({ ...jobForm, location: event.target.value })} /></label>
          <label>Salary<input required min="1" type="number" value={jobForm.salary} onChange={(event) => setJobForm({ ...jobForm, salary: event.target.value })} /></label>
        </div>
        <label>Employment type<select value={jobForm.type} onChange={(event) => setJobForm({ ...jobForm, type: event.target.value })}>{employmentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>Description<textarea required value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} /></label>
        <button type="submit">{editingJobId ? 'Update job' : 'Create job'}</button>
      </form>

      <div className="panel wide">
        <h2>Job management</h2>
        <div className="job-list">
          {jobs.length ? jobs.map((job) => (
            <JobCard key={job.id} job={job} actions={<><button onClick={() => onEditJob(job)}>Edit</button><button disabled={job.status === 'Closed'} onClick={() => onCloseJob(job.id)}>Close</button><button className="danger" onClick={() => onDeleteJob(job.id)}>Delete</button></>} />
          )) : <EmptyState title="No jobs posted yet" message="Create your first job post to start receiving applications." />}
        </div>
      </div>
    </section>
  )
}
