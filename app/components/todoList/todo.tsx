"use client"

import {
  Layout,
  Placeholder,
  Textwrapped,
  Button,
  TodoText,
  TaskItem,
  Checkbox,
  HiddenTrashButton,
} from "./style";
import { useState } from "react";
import Image from "next/image";
import Trash from "../../../public/trash.svg";

const TodoList = () => {
  const [todos, setTodos] = useState<{ text: string; completed: boolean }[]>(
    []
  );
  const [newNote, setNewNote] = useState<string>("");

  // adding new task
  const handleAddNote = () => {
    if (newNote.trim() === "") return;
    setTodos((prevTodos) => [
      ...prevTodos,
      { text: newNote, completed: false },
    ]);
    setNewNote("");
  };

  // change status of task (checkbox)
  const handleToggleComplete = (index: number) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo, i) =>
        i === index ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // delete task
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
          <p style={{ textAlign: "center", color: "gray" }}>Nothing in here</p>
        ) : (
          todos.map((todo, index) => (
            <TaskItem key={index}>
              <div style={{ display: "flex", gap: "4px", padding: 4 }}>
                <HiddenTrashButton
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                   
                  }}
                  onClick={() => handleDelete(index)}
                >
                  <Image style={{width:"12px", height:"15px"}} src={Trash} alt="Delete" />
                </HiddenTrashButton>
                <Checkbox
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleComplete(index)}
                />
              </div>
              <TodoText
                style={{
                  textDecoration: todo.completed ? "line-through" : "none",
                  color: todo.completed
                    ? "var(--main-Color)"
                    : "var(--main-Color)",
                }}
              >
                {todo.text}
              </TodoText>
            </TaskItem>
          ))
        )}
      </Placeholder>

      {/* space for tipping new task text  */}
      <div style={{ display: "flex", gap: "10px" }}>
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
