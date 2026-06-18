import EmptyState from '../components/EmptyState'
import JobCard from '../components/JobCard'
import { employmentTypes } from '../constants'

export default function JobSearchPage({ filters, setFilters, jobs, hasApplied, onApply }) {
  return (
    <section className="page-grid">
      <div className="panel search-panel">
        <h2>Job search</h2>
        <input aria-label="Keyword" placeholder="Keyword" value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} />
        <input aria-label="Location" placeholder="Location" value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} />
        <input aria-label="Minimum salary" placeholder="Minimum salary" type="number" value={filters.salary} onChange={(event) => setFilters({ ...filters, salary: event.target.value })} />
        <select aria-label="Employment type" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">All employment types</option>{employmentTypes.map((type) => <option key={type}>{type}</option>)}</select>
        <button className="subtle-button" type="button" onClick={() => setFilters({ keyword: '', location: '', salary: '', type: '' })}>Clear filters</button>
      </div>
      <div className="job-list">
        {jobs.length ? jobs.map((job) => <JobCard key={job.id} job={job} actions={<button disabled={job.status === 'Closed' || hasApplied(job.id)} onClick={() => onApply(job)}>{hasApplied(job.id) ? 'Applied' : 'Apply'}</button>} />) : <EmptyState title="No matching jobs" message="Try removing a filter or searching for a broader keyword." />}
      </div>
    </section>
  )
}
