import { useEffect, useState } from "react";
import Column from "./components/Column";
import TaskModal from "./components/TaskModal";
import "./App.css";

const API_URL = "http://localhost:8080/tasks";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Erro ao buscar tarefas");
      const data = await res.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSaveTask = async (taskData) => {
    try {
      const isEdit = !!taskData.id;
      const url = isEdit ? `${API_URL}/${taskData.id}` : API_URL;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!res.ok) throw new Error("Falha ao salvar tarefa");
      setIsModalOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMoveStatus = async (task, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status");
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao deletar tarefa");
      fetchTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="kanban-container">
      <header className="kanban-header">
        <h1>Mini Kanban Veritas</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Nova Tarefa
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Carregando quadro...</div>
      ) : (
        <main className="kanban-board">
          <Column
            title="A Fazer"
            status="todo"
            tasks={tasks.filter((t) => t.status === "todo")}
            onEdit={openEditModal}
            onDelete={handleDeleteTask}
            onMove={handleMoveStatus}
          />
          <Column
            title="Em Progresso"
            status="in_progress"
            tasks={tasks.filter((t) => t.status === "in_progress")}
            onEdit={openEditModal}
            onDelete={handleDeleteTask}
            onMove={handleMoveStatus}
          />
          <Column
            title="Concluídas"
            status="done"
            tasks={tasks.filter((t) => t.status === "done")}
            onEdit={openEditModal}
            onDelete={handleDeleteTask}
            onMove={handleMoveStatus}
          />
        </main>
      )}

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}