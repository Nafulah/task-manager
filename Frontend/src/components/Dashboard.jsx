import { useState, useEffect, useRef } from "react";

import { api } from "../session";

export default function Dashboard({ onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");
  const [deadline, setDeadline] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("Pending");
  const [editDeadline, setEditDeadline] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTitle, setSearchTitle] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [errorMsg, setErrorMsg] = useState("");

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const actionLock = useRef(false);
  const editRef = useRef(null);
  const editButton = useRef(null);
  useEffect(() => {
    let active = true;
    api('/api/tasks').then(data => { if (active) setTasks(data); })
      .catch(err => { if (active) setErrorMsg(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (editingTask) editRef.current?.focus(); }, [editingTask]);
  const finishEdit = () => { setEditingTask(null); requestAnimationFrame(() => document.getElementById(`edit-${editButton.current}`)?.focus()); };
  const runAction = async (action) => {
    if (actionLock.current) return;
    actionLock.current = true; setBusy(true); setErrorMsg('');
    try { await action(); } catch (err) { setErrorMsg(err.message); }
    finally { actionLock.current = false; setBusy(false); }
  };

  const fetchAgain = async () => { setTasks(await api('/api/tasks')); };
  const addTask = e => {
    e.preventDefault();
    if (!title.trim()) return setErrorMsg('Enter a task title.');
    runAction(async () => {
      await api('/api/tasks', { method: 'POST', body: JSON.stringify({ title: title.trim(), description, status, deadline: deadline || null }) });
      setTitle(''); setDescription(''); setDeadline(''); setStatus('Pending');
      await fetchAgain();
    });
  };
  const deleteTask = id => runAction(async () => {
    await api(`/api/tasks/${id}`, { method: 'DELETE' });
    await fetchAgain();
  });

  const startEdit = (task) => {
    setEditingTask(task._id); setEditTitle(task.title); setEditDesc(task.description || "");
    setEditStatus(task.status || "Pending");
    if (task.deadline) { setEditDeadline(new Date(task.deadline).toISOString().slice(0, 10)); }
    else setEditDeadline("");
  };

  const updateTask = (e, id) => {
    e.preventDefault();
    if (!editTitle.trim()) return setErrorMsg('Enter a task title before saving.');
    runAction(async () => {
      await api(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ title: editTitle.trim(), description: editDesc, status: editStatus, deadline: editDeadline || null }) });
      finishEdit(); await fetchAgain();
    });
  };

   const getDisplayTasks = () => {
    let result = [...tasks];

    // Filter by status
    if (filterStatus !== "All") {
      result = result.filter(t => (t.status||"").toLowerCase() === filterStatus.toLowerCase());
    }
    // Filter by title
    if (searchTitle.trim()) {
      result = result.filter(t => t.title.toLowerCase().includes(searchTitle.toLowerCase()));
    }
    // SORT - FIXED
    if (sortBy === "title") {
      result.sort((a,b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    } else if (sortBy === "deadline") {
      result.sort((a,b) => {
        const da = a.deadline ? new Date(a.deadline) : new Date("9999-12-31");
        const db = b.deadline ? new Date(b.deadline) : new Date("9999-12-31");
        return da - db;
      });
    } else if (sortBy === "status") {
      result.sort((a,b) => (a.status||"").localeCompare(b.status||""));
    } else {
      // newest
      result.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return result;
  };
  const displayTasks = getDisplayTasks();

  return (
    <div className="dashboard" style={{ minHeight:"100vh", background:"linear-gradient(135deg, #2e7d32, #81c784)", padding:20 }}>
      <div className="dashboard-panel" style={{ maxWidth:650, margin:"auto", background:"#e8f5e9", borderRadius:15, padding:20, boxShadow:"0 4px 20px rgba(0,0,0,0.3)", border:"2px solid #4caf50" }}>
        <header className="dashboard-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h1 style={{ margin:0, color:"#1b5e20", fontSize:"22px" }}>
            🌸 Hi {localStorage.getItem("userName") || "Cutie"}! 🌿<br/>
            <span style={{fontSize:"14px", color:"#256329"}}>Welcome to your Task Management App🐒✨</span>
          </h1>
          <button onClick={onLogout} style={{ padding:"6px 14px", background:"#1b5e20", color:"white", border:"none", borderRadius:20, cursor:"pointer" }}>Logout</button>
        </header>

        {errorMsg && <div role="alert" style={{ background:"#ffcdd2", color:"#b71c1c", padding:8, borderRadius:8, marginBottom:10 }}>Error: {errorMsg}</div>}

        <form onSubmit={addTask} aria-label="Add task" aria-busy={busy}>
        <label htmlFor="task-title">Task title (required)</label>
        <input className="task-title-field" onPointerDown={e => { e.currentTarget.dataset.pointerFocus = "true"; }} onBlur={e => { delete e.currentTarget.dataset.pointerFocus; }} id="task-title" required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title* like READING" style={{ width:"100%", padding:10, marginBottom:8, borderRadius:8, border:"1px solid #518153" }} />
        <label htmlFor="task-description">Description</label><textarea onPointerDown={e => { e.currentTarget.dataset.pointerFocus = "true"; }} onBlur={e => { delete e.currentTarget.dataset.pointerFocus; }} id="task-description" maxLength={5000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" style={{ width:"100%", padding:10, marginBottom:8, borderRadius:8, border:"1px solid #518153" }} />
        <label htmlFor="task-status">Status</label><select id="task-status" value={status} onChange={e=>setStatus(e.target.value)} style={{ width:"100%", padding:10, marginBottom:8, borderRadius:8, border:"1px solid #518153" }}>
          <option>Pending</option><option>In Progress</option><option>Completed</option>
        </select>
        <label htmlFor="task-deadline">Deadline</label><input id="task-deadline" type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={{ width:"100%", padding:10, marginBottom:8, borderRadius:8, border:"1px solid #518153" }} />
        <button disabled={busy} type="submit" style={{ width:"100%", padding:12, background:"#2e7d32", color:"white", border:"none", borderRadius:10, fontWeight:"bold", cursor:"pointer" }}>🌴 Add Task</button>

        </form>
        <div className="filters" style={{ marginTop:15, display:"flex", gap:8 }}>
          <label>Filter by title<input type="search" value={searchTitle} onChange={e=>setSearchTitle(e.target.value)} placeholder="Filter by title..." style={{ flex:1, padding:8, borderRadius:8, border:"1px solid #518153" }} /></label>
          <label>Filter by status<select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding:8, borderRadius:8, border:"1px solid #518153" }}>
            <option value="All">All Status</option><option>Pending</option><option>In Progress</option><option>Completed</option>
          </select></label>
          <label>Sort tasks<select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:8, borderRadius:8, border:"1px solid #518153" }}>
            <option value="newest">Sort: Newest</option><option value="title">Sort: Title</option><option value="deadline">Sort: Deadline</option><option value="status">Sort: Status</option>
          </select></label>
        </div>

        <section aria-label="Task list" aria-busy={loading || busy} style={{ marginTop:20 }}>
          <h2>Your tasks</h2>
          {loading && <p role="status">Loading tasks...</p>}
          {!loading && displayTasks.length===0 && <p style={{textAlign:"center", color:"#2e7d32"}}>🌱 No tasks found. Add a new task above!</p>}
          {displayTasks.map(task => (
            <article key={task._id} style={{ background:"white", border:"1px solid #a5d6a7", padding:12, borderRadius:12, marginBottom:10 }}>
              {editingTask===task._id ? (
                <form onSubmit={e => updateTask(e, task._id)} aria-label="Edit task">
                  <label>Task title (required)<input className="task-title-field" onPointerDown={e => { e.currentTarget.dataset.pointerFocus = "true"; }} onBlur={e => { delete e.currentTarget.dataset.pointerFocus; }} ref={editRef} required maxLength={200} value={editTitle} onChange={e=>setEditTitle(e.target.value)} style={{width:"100%", marginBottom:5, padding:6}}/></label>
                  <label>Description<input maxLength={5000} value={editDesc} onChange={e=>setEditDesc(e.target.value)} style={{width:"100%", marginBottom:5, padding:6}}/></label>
                  <label>Status<select value={editStatus} onChange={e=>setEditStatus(e.target.value)} style={{width:"100%", marginBottom:5, padding:6}}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label>
                  <label>Deadline<input type="date" value={editDeadline} onChange={e=>setEditDeadline(e.target.value)} style={{width:"100%", marginBottom:5, padding:6}}/></label>
                  <button disabled={busy} type="submit" style={{background:"#2e7d32", color:"white", padding:6, width:"100%", marginBottom:5}}>Save</button>
                  <button type="button" disabled={busy} onClick={finishEdit} style={{width:"100%", padding:6}}>Cancel</button>
                </form>
              ) : (
                <>
                  <div style={{display:"flex", gap:10, alignItems:"center"}}><h3 style={{margin:0, color:"#1b5e20"}}>🍃 {task.title}</h3></div>
                  <p style={{margin:"5px 0"}}>{task.description}</p>
                  <small style={{color:"#555"}}>Status: {task.status} | Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString(undefined, { timeZone: 'UTC' }) : "No date"}</small>
                  <div style={{marginTop:8, display:"flex", gap:8}}><button disabled={busy} aria-label={`Edit ${task.title}`} id={`edit-${task._id}`} onClick={()=>{ editButton.current = task._id; startEdit(task); }} style={{padding:"4px 10px"}}>Edit</button><button disabled={busy} aria-label={`Delete ${task.title}`} onClick={()=>deleteTask(task._id)} style={{background:"#c62828", color:"white", padding:"4px 10px", border:"none", borderRadius:5}}>Delete</button></div>
                </>
              )}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}