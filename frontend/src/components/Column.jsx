import TaskCard from "./TaskCard";

export default function Column({ title, status, tasks, onEdit, onDelete, onMove }) {
  return (
    <div className={`kanban-column column-${status}`}>
      <div className="column-header">
        <h2>{title}</h2>
        <span className="badge">{tasks.length}</span>
      </div>
      <div className="task-list">
        {tasks.length === 0 ? (
          <p className="empty-state">Nenhuma tarefa</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))
        )}
      </div>
    </div>
  );
}