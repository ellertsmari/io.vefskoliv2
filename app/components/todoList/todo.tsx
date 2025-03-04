"use client";

import {
  MainContainer,
  PlaceholderTasks,
  Textwrapped,
  Button,
  TodoText,
  TaskContainer,
  Checkbox,
  HiddenTrashButton,
  MainText,
  EmptyText,
  AddTaskContainer,
  StyleList,
} from "./style";
import { useEffect, useState } from "react";
import Image from "next/image";
import Trash from "../../../public/trash.svg";
import { setItem, getItem } from "./localStorage";

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

  useEffect(() => {
    const data = getItem("todos");
    if (data) {
      setTodos(data);
    }
  }, []);

  useEffect(() => {
    setItem("todos", todos);
  }, [todos]);

  const handleToggleComplete = (index: number) => {
    setTodos((prevTodos) => {
      const updatedTodos = prevTodos.map((todo, i) =>
        i === index ? { ...todo, completed: !todo.completed } : todo
      );
      return updatedTodos.sort(
        (a, b) => Number(a.completed) - Number(b.completed)
      );
    });
  };

  // delete task
  const handleDelete = (index: number) => {
    setTodos((prevTodos) => prevTodos.filter((_, i) => i !== index));
  };
  const sortedTodos = [...todos].sort(
    (a, b) => Number(a.completed) - Number(b.completed)
  );
  console.log(todos);

  return (
    <MainContainer>
      <MainText>To do:</MainText>
      <PlaceholderTasks>
        {todos.length === 0 ? (
          <EmptyText style={{ textAlign: "center", color: "gray" }}>
            Nothing in here
          </EmptyText>
        ) : (
          sortedTodos.map((todo, index) => (
            <TaskContainer key={index}>
              <StyleList>
                <HiddenTrashButton
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => handleDelete(index)}
                >
                  <Image
                    style={{ width: "12px", height: "15px" }}
                    src={Trash}
                    alt="Delete"
                  />
                </HiddenTrashButton>
                <Checkbox
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleComplete(index)}
                />
              </StyleList>
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
            </TaskContainer>
          ))
        )}
      </PlaceholderTasks>

      {/* space for tipping new task text  */}
      <AddTaskContainer>
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
      </AddTaskContainer>
    </MainContainer>
  );
};

export default TodoList;
