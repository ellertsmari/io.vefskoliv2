import {
  Layout,
  Placeholder,
  Textwrapped,
  Button,
  TodoText,
  TaskItem,
  HiddenCheckbox,
} from "./style";
import { useState } from "react";
import Image from "next/image";
import Trash from "../../../public/trash.svg";

const TodoList = () => {
  const [todos, setTodos] = useState<{ text: string; completed: boolean }[]>(
    []
  );
  const [newNote, setNewNote] = useState<string>("");

  // 📝 Dodawanie nowego zadania
  const handleAddNote = () => {
    if (newNote.trim() === "") return;
    setTodos((prevTodos) => [
      ...prevTodos,
      { text: newNote, completed: false },
    ]);
    setNewNote("");
  };

  // ✅ Zmiana statusu zadania (checkbox)
  const handleToggleComplete = (index: number) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo, i) =>
        i === index ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // 🗑️ Usuwanie zadania
  const handleDelete = (index: number) => {
    setTodos((prevTodos) => prevTodos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Layout>
        <h1>To do:</h1>
      </Layout>
      <Placeholder>
        {todos.length === 0 ? (
          <p style={{ textAlign: "center", color: "gray" }}>Brak notatek</p>
        ) : (
          todos.map((todo, index) => (
            <TaskItem key={index}>
              <div style={{ gap: 10 }}>
              <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => handleDelete(index)}
                >
                  <Image style={{}} src={Trash} alt="Delete" />
                </button>
                <HiddenCheckbox
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleComplete(index)}
                />
              
              </div>
              <TodoText
                style={{
                  textDecoration: todo.completed ? "line-through" : "none",
                  color: todo.completed ? "#888" : "#333",
                }}
              >
                {todo.text}
              </TodoText>
            </TaskItem>
          ))
        )}
      </Placeholder>

      {/* 🔹 Pole do wpisywania nowego zadania */}
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <Textwrapped
          type="text"
          name="todo"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddNote();
            }
          }}
        />
        <Button onClick={handleAddNote}>Add note</Button>
      </div>
    </div>
  );
};

export default TodoList;
