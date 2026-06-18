import ProfileBuilder from '../components/ProfileBuilder'

export default function SeekerProfilePage({ profile, setProfile, quickAdd, setQuickAdd, onAddItem, onSave, onResumeUpload }) {
  return (
    <section className="page-grid two-column">
      <form className="panel form-panel" onSubmit={onSave}>
        <h2>Edit job seeker profile</h2>
        <label>Headline<input required value={profile.headline} onChange={(event) => setProfile({ ...profile, headline: event.target.value })} /></label>
        <label>Location<input required value={profile.location} onChange={(event) => setProfile({ ...profile, location: event.target.value })} /></label>
        <label>Upload resume PDF<input accept="application/pdf" type="file" onChange={onResumeUpload} /></label>
        {profile.resume && <p className="file-note">Current resume: {profile.resume}</p>}
        <button type="submit">Save profile</button>
      </form>
      <ProfileBuilder title="Skills" type="skills" items={profile.skills} quickAdd={quickAdd} setQuickAdd={setQuickAdd} onAdd={onAddItem} />
      <ProfileBuilder title="Education" type="education" items={profile.education} quickAdd={quickAdd} setQuickAdd={setQuickAdd} onAdd={onAddItem} />
      <ProfileBuilder title="Work experience" type="experience" items={profile.experience} quickAdd={quickAdd} setQuickAdd={setQuickAdd} onAdd={onAddItem} />
    </section>
  )
}
