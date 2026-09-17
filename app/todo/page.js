"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
const members = ["Hima", "Hunter", "Chinju"];
const memberKeys = {
  Hima: "hima",
  Hunter: "hunter",
  Chinju: "chinju",
};

const getLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekStart = (dateString) => {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return getLocalDate(date);
};

const addDays = (dateString, amount) => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return getLocalDate(date);
};

const formatDate = (dateString, options = {}) =>
  new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", options);

export default function TodoPage() {
  const today = getLocalDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState("day");
  const [tasks, setTasks] = useState(null);
  const [expandedMember, setExpandedMember] = useState(null);
  const [form, setForm] = useState({
    title: "",
    assignee: members[0],
    dueDate: today,
    priority: "Normal",
  });
// Load tasks from Supabase
useEffect(() => {
  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading tasks:", error);
      setTasks([]);
      return;
    }

    const formattedTasks = (data ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      assignee: task.assignee,
      dueDate: task.due_date,
      priority: task.priority,
      completed: task.completed,
    }));

    setTasks(formattedTasks);
  };

  loadTasks();
}, []);
 

  const visibleTasks = useMemo(() => {
    if (view === "day") {
      return (tasks ?? []).filter((task) => task.dueDate === selectedDate);
    }

    const weekStart = getWeekStart(selectedDate);
    const weekEnd = addDays(weekStart, 6);
    return (tasks ?? []).filter(
      (task) => task.dueDate >= weekStart && task.dueDate <= weekEnd
    );
  }, [selectedDate, tasks, view]);

  const completedCount = visibleTasks.filter((task) => task.completed).length;
  const memberStats = members.map((member) => {
    const memberTasks = (tasks ?? []).filter((task) => task.assignee === member);

    return {
      member,
      tasks: memberTasks,
      total: memberTasks.length,
      completed: memberTasks.filter((task) => task.completed).length,
    };
  });
  const periodLabel =
    view === "day"
      ? formatDate(selectedDate, { weekday: "long", month: "long", day: "numeric" })
      : `${formatDate(getWeekStart(selectedDate), { month: "short", day: "numeric" })} - ${formatDate(addDays(getWeekStart(selectedDate), 6), { month: "short", day: "numeric" })}`;

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };
const addTask = async (event) => {
  event.preventDefault();

  const title = form.title.trim();
  if (!title) return;

  const { data, error } = await supabase
    .from("todos")
    .insert({
      title: title,
      assignee: form.assignee,
      due_date: form.dueDate,
      priority: form.priority,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding task:", error);
    return;
  }

  const newTask = {
    id: data.id,
    title: data.title,
    assignee: data.assignee,
    dueDate: data.due_date,
    priority: data.priority,
    completed: data.completed,
  };

  setTasks((current) => [
    ...(current ?? []),
    newTask,
  ]);

  setForm((current) => ({
    ...current,
    title: "",
  }));
};
 
  

 const toggleTask = async (taskId) => {
  const currentTask = (tasks ?? []).find(
    (task) => task.id === taskId
  );

  if (!currentTask) return;

  const newCompleted = !currentTask.completed;

  const { error } = await supabase
    .from("todos")
    .update({
      completed: newCompleted,
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task:", error);
    return;
  }

  setTasks((current) =>
    (current ?? []).map((task) =>
      task.id === taskId
        ? { ...task, completed: newCompleted }
        : task
    )
  );
};

 const deleteTask = async (taskId) => {
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error);
    return;
  }

  setTasks((current) =>
    (current ?? []).filter((task) => task.id !== taskId)
  );
};

  return (
    <main className="todo-page">
      <header className="todo-header">
        <div>
          <p className="eyebrow">Planner / Assignments</p>
          <h1>To-do list</h1>
          <p className="todo-subtitle">Keep the week moving, one clear task at a time.</p>
        </div>
        <Link className="back-link" href="/">
          ← Attendance
        </Link>
      </header>

      <section className="task-summary" aria-label="All task totals by person">
        {memberStats.map(({ member, tasks: memberTasks, total, completed }) => {
          const isExpanded = expandedMember === member;

          return (
            <article className={`task-summary-card ${isExpanded ? "expanded" : ""}`} key={member}>
              <div className="task-summary-top">
                <div className="task-summary-person">
                  <img src={`/powerpuff/${memberKeys[member]}-hap.png`} alt="" />
                  <h2>{member}</h2>
                </div>
                <div className="task-summary-numbers">
                  <button
                    className="task-total-button"
                    onClick={() => setExpandedMember(isExpanded ? null : member)}
                    aria-expanded={isExpanded}
                    aria-label={`Show all tasks assigned to ${member}`}
                  >
                    <strong>{total}</strong>
                    <span>total tasks</span>
                  </button>
                  <span className="task-summary-completed">{completed} completed</span>
                </div>
              </div>
              {isExpanded && (
                <div className="task-summary-details">
                  {memberTasks.length === 0 ? (
                    <span>No tasks assigned</span>
                  ) : (
                    memberTasks.map((task) => (
                      <div className="task-summary-task" key={task.id}>
                        <span className={task.completed ? "summary-task-done" : ""}>{task.title}</span>
                        <time dateTime={task.dueDate}>{formatDate(task.dueDate, { month: "short", day: "numeric", year: "numeric" })}</time>
                      </div>
                    ))
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section className="todo-toolbar" aria-label="Task view controls">
        <div className="view-switcher">
          <button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>
            Day
          </button>
          <button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>
            Week
          </button>
        </div>
        <label className="date-picker">
          <span>Focus date</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
      </section>

      <div className="todo-layout">
        <section className="task-form-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">New assignment</p>
              <h2>Give someone a next step</h2>
            </div>
            <span className="task-count">{completedCount}/{visibleTasks.length} done</span>
          </div>

          <form onSubmit={addTask}>
            <label>
              What needs doing?
              <input name="title" value={form.title} onChange={updateForm} placeholder="e.g. Prepare Monday report" />
            </label>
            <div className="form-grid">
              <label>
                Assign to
                <select name="assignee" value={form.assignee} onChange={updateForm}>
                  {members.map((member) => <option key={member}>{member}</option>)}
                </select>
              </label>
              <label>
                Due date
                <input name="dueDate" type="date" value={form.dueDate} onChange={updateForm} />
              </label>
            </div>
            <fieldset>
              <legend>Priority</legend>
              <div className="priority-options">
                {["Low", "Normal", "High"].map((priority) => (
                  <label className={`priority-option ${priority.toLowerCase()} ${form.priority === priority ? "selected" : ""}`} key={priority}>
                    <input type="radio" name="priority" value={priority} checked={form.priority === priority} onChange={updateForm} />
                    {priority}
                  </label>
                ))}
              </div>
            </fieldset>
            <button className="add-task-button" type="submit">+ Add assignment</button>
          </form>
        </section>

        <section className="task-list-panel">
          <div className="task-list-heading">
            <div>
              <p className="eyebrow">{view === "day" ? "Today" : "This week"}</p>
              <h2>{periodLabel}</h2>
            </div>
            <span>{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}</span>
          </div>

          <div className="task-columns">
            {members.map((member) => {
              const memberTasks = visibleTasks.filter((task) => task.assignee === member);

              return (
                <section className="task-column" key={member}>
                  <header className="task-column-heading">
                    <img src={`/powerpuff/${memberKeys[member]}-hap.png`} alt="" />
                    <div>
                      <h3>{member}</h3>
                      <span>{memberTasks.length} {memberTasks.length === 1 ? "task" : "tasks"}</span>
                    </div>
                  </header>

                  {memberTasks.length === 0 ? (
                    <div className="empty-column">No tasks yet</div>
                  ) : (
                    <div className="task-list">
                      {memberTasks.map((task) => (
                        <article className={`task-item ${task.completed ? "completed" : ""}`} key={task.id}>
                          <button className="task-check" onClick={() => toggleTask(task.id)} aria-label={`Mark ${task.title} ${task.completed ? "not complete" : "complete"}`}>
                            {task.completed ? "✓" : ""}
                          </button>
                          <div className="task-copy">
                            <h3>{task.title}</h3>
                            <div className="task-meta">
                              <span>{formatDate(task.dueDate, { month: "short", day: "numeric" })}</span>
                              <span className={`priority-tag ${task.priority.toLowerCase()}`}>{task.priority}</span>
                            </div>
                          </div>
                          <button className="delete-task" onClick={() => deleteTask(task.id)} aria-label={`Delete ${task.title}`}>×</button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
