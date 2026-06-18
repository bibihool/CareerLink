export default function ProfileBuilder({ title, type, items, quickAdd, setQuickAdd, onAdd }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      <div className="tag-row">
        {items.length > 0 ? items.map((item) => <span key={item}>{item}</span>) : (
          <span className="muted-tag">Add your first {title.toLowerCase()} item</span>
        )}
      </div>
      <div className="inline-add">
        <input
          value={quickAdd[type]}
          onChange={(event) => setQuickAdd({ ...quickAdd, [type]: event.target.value })}
          placeholder={`Add ${title.toLowerCase()}`}
        />
        <button type="button" onClick={() => onAdd(type)}>Add</button>
      </div>
    </div>
  )
}
