export default function TaskCard({ task, onEdit, onDelete, onMove }) {
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      
      <div className="card-actions">
        <div className="move-buttons">
          {task.status !== "todo" && (
            <button
              onClick={() => onMove(task, task.status === "done" ? "in_progress" : "todo")}
              title="Mover para esquerda"
            >
              ←
            </button>
          )}
          {task.status !== "done" && (
            <button
              onClick={() => onMove(task, task.status === "todo" ? "in_progress" : "done")}
              title="Mover para direita"
            >
              →
            </button>
          )}
        </div>
        <div className="manage-buttons">
          <button className="btn-icon" onClick={() => onEdit(task)}>✏️</button>
          <button className="btn-icon btn-danger" onClick={() => onDelete(task.id)}>🗑️</button>
        </div>
      </div>
    </div>
  );
}