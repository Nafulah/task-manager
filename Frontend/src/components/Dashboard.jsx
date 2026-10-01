/* eslint-disable */
import { useState, useEffect } from "react";

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

  useEffect(() => { fetchAgain(); }, []);

  const fetchAgain = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/tasks", { headers: { "x-auth-token": token } });
      const data = await res.json();
      if (Array.isArray(data)) { setTasks(data); setErrorMsg(""); }
      else { setErrorMsg(JSON.stringify(data)); }
    } catch (e) { setErrorMsg(e.message); }
  };

  const addTask = async () => {
    if (!title.trim()) return alert("Title required");
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-auth-token": token },
      body: JSON.stringify({ title, description, status, deadline: deadline || null })
    });
    const data = await res.json();
    if (!res.ok) { setErrorMsg(data.error || JSON.stringify(data)); alert(data.error); return; }
    setTitle(""); setDescription(""); setDeadline(""); setStatus("Pending");
    fetchAgain();
  };

  const deleteTask = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/tasks/${id}`, { method: "DELETE", headers: { "x-auth-token": token } });
    fetchAgain();
  };

  const toggleTask = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/tasks/${id}`, { method: "PUT", headers: { "x-auth-token": token }, body: JSON.stringify({ completed: true }) });
    fetchAgain();
  };

  const startEdit = (task) => {
    setEditingTask(task._id); setEditTitle(task.title); setEditDesc(task.description || "");
    setEditStatus(task.status || "Pending");
    if (task.deadline) { const d = new Date(task.deadline); setEditDeadline(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }
    else setEditDeadline("");
  };

  const updateTask = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/tasks/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", "x-auth-token": token },
      body: JSON.stringify({ title: editTitle, description: editDesc, status: editStatus, deadline: editDeadline || null })
    });
    setEditingTask(null); fetchAgain();
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
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #2e7d32, #81c784)", padding:20 }}>
      <div style={{ maxWidth:650, margin:"auto", background:"#e8f5e9", borderRadius:15, padding:20, boxShadow:"0 4px 20px rgba(0,0,0,0.3)", border:"2px solid #4caf50" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h2 style={{ margin:0, color:"#1b5e20", fontSize:"22px" }}>
            🌸 Hi {localStorage.getItem("userName") || "Cutie"}! 🌿<br/>
            <span style={{fontSize:"14px", color:"#388e3c"}}>Welcome to your Task Management App🐒✨</span>
          </h2>
          <button onClick={onLogout} style={{ padding:"6px 14px", background:"#1b5e20", color:"white", border:"none", borderRadius:20, cursor:"pointer" }}>Logout</button>
        </div>

        {errorMsg && <div style={{ background:"#ffcdd2", color:"#b71c1c", padding:8, borderRadius:8, marginBottom:10 }}>Error: {errorMsg}</div>}

        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task title* like CHAPATI" style={{ width:"100%", padding:10, marginBottom:8, borderRadius:8, border:"1px solid #81c784" }} />
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" style={{ width:"100%", padding:10, marginBottom:8, borderRadius:8, border:"1px solid #81c784" }} />
        <select value={status} onChange={e=>setStatus(e.target.value)} style={{ width:"100%", padding:10, marginBottom:8, borderRadius:8, border:"1px solid #81c784" }}>
          <option>Pending</option><option>In Progress</option><option>Completed</option>
        </select>
        <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={{ width:"100%", padding:10, marginBottom:8, borderRadius:8, border:"1px solid #81c784" }} />
        <button onClick={addTask} style={{ width:"100%", padding:12, background:"#2e7d32", color:"white", border:"none", borderRadius:10, fontWeight:"bold", cursor:"pointer" }}>🌴 Add Task</button>

        <div style={{ marginTop:15, display:"flex", gap:8 }}>
          <input value={searchTitle} onChange={e=>setSearchTitle(e.target.value)} placeholder="Filter by title..." style={{ flex:1, padding:8, borderRadius:8, border:"1px solid #81c784" }} />
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding:8, borderRadius:8, border:"1px solid #81c784" }}>
            <option value="All">All Status</option><option>Pending</option><option>In Progress</option><option>Completed</option>
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:8, borderRadius:8, border:"1px solid #81c784" }}>
            <option value="newest">Sort: Newest</option><option value="title">Sort: Title</option><option value="deadline">Sort: Deadline</option><option value="status">Sort: Status</option>
          </select>
        </div>

        <div style={{ marginTop:20 }}>
          {displayTasks.length===0 && <p style={{textAlign:"center", color:"#2e7d32"}}>🌱 No tasks found. Add a new task above!</p>}
          {displayTasks.map(task => (
            <div key={task._id} style={{ background:"white", border:"1px solid #a5d6a7", padding:12, borderRadius:12, marginBottom:10 }}>
              {editingTask===task._id ? (
                <>
                  <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} style={{width:"100%", marginBottom:5, padding:6}}/>
                  <input value={editDesc} onChange={e=>setEditDesc(e.target.value)} style={{width:"100%", marginBottom:5, padding:6}}/>
                  <select value={editStatus} onChange={e=>setEditStatus(e.target.value)} style={{width:"100%", marginBottom:5, padding:6}}><option>Pending</option><option>In Progress</option><option>Completed</option></select>
                  <input type="date" value={editDeadline} onChange={e=>setEditDeadline(e.target.value)} style={{width:"100%", marginBottom:5, padding:6}}/>
                  <button onClick={()=>updateTask(task._id)} style={{background:"#2e7d32", color:"white", padding:6, width:"100%", marginBottom:5}}>Save</button>
                  <button onClick={()=>setEditingTask(null)} style={{width:"100%", padding:6}}>Cancel</button>
                </>
              ) : (
                <>
                  <div style={{display:"flex", gap:10, alignItems:"center"}}><b style={{color:"#1b5e20"}}>🍃 {task.title}</b></div>
                  <p style={{margin:"5px 0"}}>{task.description}</p>
                  <small style={{color:"#555"}}>Status: {task.status} | Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No date"}</small>
                  <div style={{marginTop:8, display:"flex", gap:8}}><button onClick={()=>startEdit(task)} style={{padding:"4px 10px"}}>Edit</button><button onClick={()=>deleteTask(task._id)} style={{background:"#c62828", color:"white", padding:"4px 10px", border:"none", borderRadius:5}}>Delete</button></div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}