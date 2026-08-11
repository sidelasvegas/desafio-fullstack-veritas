package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

type TaskStatus string

const (
	StatusTodo       TaskStatus = "todo"
	StatusInProgress TaskStatus = "in_progress"
	StatusDone       TaskStatus = "done"
)

type Task struct {
	ID          int        `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      TaskStatus `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Store struct {
	sync.RWMutex
	tasks  map[int]Task
	nextID int
}

var store = Store{
	tasks: map[int]Task{
		1: {ID: 1, Title: "Criar layout no React", Description: "Estruturar as 3 colunas", Status: StatusTodo, CreatedAt: time.Now()},
		2: {ID: 2, Title: "Desenvolver API Go", Description: "Criar endpoints REST", Status: StatusInProgress, CreatedAt: time.Now()},
		3: {ID: 3, Title: "Desenhar User Flow", Description: "Exportar imagem e salvar em /docs", Status: StatusDone, CreatedAt: time.Now()},
	},
	nextID: 4,
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func tasksHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		store.RLock()
		tasksList := make([]Task, 0, len(store.tasks))
		for _, task := range store.tasks {
			tasksList = append(tasksList, task)
		}
		store.RUnlock()
		json.NewEncoder(w).Encode(tasksList)

	case http.MethodPost:
		var t Task
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil || strings.TrimSpace(t.Title) == "" {
			http.Error(w, `{"error":"O título da tarefa é obrigatório"}`, http.StatusBadRequest)
			return
		}

		if t.Status != StatusTodo && t.Status != StatusInProgress && t.Status != StatusDone {
			t.Status = StatusTodo
		}

		store.Lock()
		t.ID = store.nextID
		t.CreatedAt = time.Now()
		store.nextID++
		store.tasks[t.ID] = t
		store.Unlock()

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(t)

	default:
		http.Error(w, `{"error":"Método não permitido"}`, http.StatusMethodNotAllowed)
	}
}

func taskDetailHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 2 {
		http.Error(w, `{"error":"ID não informado"}`, http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[1])
	if err != nil {
		http.Error(w, `{"error":"ID inválido"}`, http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodPut:
		var updated Task
		if err := json.NewDecoder(r.Body).Decode(&updated); err != nil || strings.TrimSpace(updated.Title) == "" {
			http.Error(w, `{"error":"Dados inválidos"}`, http.StatusBadRequest)
			return
		}

		store.Lock()
		existing, exists := store.tasks[id]
		if !exists {
			store.Unlock()
			http.Error(w, `{"error":"Tarefa não encontrada"}`, http.StatusNotFound)
			return
		}

		existing.Title = updated.Title
		existing.Description = updated.Description
		existing.Status = updated.Status
		store.tasks[id] = existing
		store.Unlock()

		json.NewEncoder(w).Encode(existing)

	case http.MethodDelete:
		store.Lock()
		if _, exists := store.tasks[id]; !exists {
			store.Unlock()
			http.Error(w, `{"error":"Tarefa não encontrada"}`, http.StatusNotFound)
			return
		}
		delete(store.tasks, id)
		store.Unlock()

		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, `{"error":"Método não permitido"}`, http.StatusMethodNotAllowed)
	}
}

func main() {
	http.HandleFunc("/tasks", enableCORS(tasksHandler))
	http.HandleFunc("/tasks/", enableCORS(taskDetailHandler))

	fmt.Println("Servidor Go rodando em http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}