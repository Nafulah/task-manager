import { useState, useEffect } from 'react'

export default function Dashboard({ onLogout }){
  const [tasks,setTasks]=useState([])
  const [title,setTitle]=useState("")
  const [description,setDescription]=useState("")
  const [deadline,setDeadline]=useState("")
  const [status, setStatus]=useState("Pending")
  const [editingTask, setEditingTask]=useState(null);
  const[editTitle, setEditTitle]=useState("");
  const[editDesc, setEditDesc]=useState("");
  const[editStatus, setEditStatus]=useState("Pending");
  const[editDeadline, setEditDeadline]=useState("");
  useEffect(()=>{
    const getTasks = async()=>{
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/tasks",{ headers: { "x-auth-token": token } })
      const data = await res.json()
      if(Array.isArray(data)) setTasks(data)
    }
    getTasks()
  },[])

  const addTask = async (e) => {
  e.preventDefault();
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/tasks",{
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "x-auth-token": token 
      },
      body: JSON.stringify({ title, description, deadline, status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Failed");
    setTasks([data, ...tasks]);
    setTitle(""); setDescription(""); setDeadline(""); setStatus("Pending");
  } catch (err) {
    alert(err.message);
    console.log(err);
  }
}
  const toggleDone = async(task)=>{
    const token = localStorage.getItem("token")
    const res = await fetch(`http://localhost:5000/api/tasks/${task._id}`,{
      method:"PUT",
      headers: { "Content-Type":"application/json", "x-auth-token": token },
      body: JSON.stringify({completed:!task.completed, status: !task.completed? "Completed" : "Pending"})
    })
    const updated = await res.json()
    setTasks(tasks.map(t=> t._id === task._id? updated : t))
  }
//DELETE TASK
  const deleteTask = async(id)=>{
    const token = localStorage.getItem("token")
    await fetch(`http://localhost:5000/api/tasks/${id}`,{ method:"DELETE", headers: { "x-auth-token": token } })
    setTasks(tasks.filter(t=> t._id!== id))
  }
//EDIT TASK
const startEdit = (task) => {
  setEditingTask(task._id);
  setEditTitle(task.title);
  setEditDesc(task.description || "");
  setEditStatus(task.status || "Pending");
  // Simple: take first 10 chars, works 100%
  if (task.deadline) {
    setEditDeadline(String(task.deadline).substring(0,10));
  } else {
    setEditDeadline("");
  }
};
const updateTask = async (id) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`http://localhost:5000/api/tasks/${id}`,{
      method:"PUT",
      headers: { "Content-Type":"application/json", "x-auth-token": token },
      body: JSON.stringify({title: editTitle, description: editDesc, status: editStatus, deadline: editDeadline})
    });
    const updated = await res.json();
    setTasks(tasks.map(t => t._id === id ? updated : t));
    setEditingTask(null);
};

  return(
    <div style={{background:"#16423C", padding:"25px", borderRadius:"16px", color:"white", maxWidth:"600px", margin:"auto"}}>
      <h1 style={{color:"#C4DFE6", textAlign:"center", fontSize: "28px", margin: "0", fontWeight: "900", letterSpacing: "0.5pX"}}>🌿 Jungle Task Manager - Phase 4</h1>

      {/* 1. FORM FOR CREATING NEW TASKS */}
      <form onSubmit={addTask} style={{background:"rgba(255,255,255,0.08)", padding:"15px", borderRadius:"12px", margin:"20px 0", display:"flex", flexDirection:"column", gap:"10px"}}>
        <input placeholder="Task title*" value={title} onChange={e=>setTitle(e.target.value)} required
          style={{padding:"12px", borderRadius:"8px", border:"none"}} />
        <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)}
          style={{padding:"12px", borderRadius:"8px", border:"none"}} />
        <select value={status} onChange={e=>setStatus(e.target.value)} style={{padding:"12px", borderRadius:"8px", border:"none"}}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
        </select>
        <input type="text" value={editDeadline} onChange={e=>setEditDeadline(e.target.value)} placeholder="YYYY-MM-DD" style={{width:"100%", marginBottom:5, padding:6}} />
        <button type="submit" style={{padding:"12px", background:"#C4DFE6", color:"#16423C", border:"none", borderRadius:"8px", fontWeight:"bold", cursor:"pointer"}}>Add Task</button>
        </form>

      {/* 3. & 4. RETRIEVE AND DISPLAY LIST */}
      <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
        {tasks.length === 0? <p style={{textAlign:"center", color:"#E8FFCE"}}>No tasks yet. Add one above!</p> : 
          tasks.map(task=>(
          <div key={task._id} style={{background: task.completed? "#B8C5B8" : "#EAF6F6", color:"#16423C", padding:"14px 16px", borderRadius:"10px", display:"flex", gap:"10px"}}>
            <input type="checkbox" checked={task.completed} onChange={()=>toggleDone(task)} style={{width:"20px", height:"20px", accentColor:"#16423C"}} />
            <div style={{flex:1}}>
              <div style={{fontWeight:"700", textDecoration: task.completed? "line-through" : "none"}}>{task.title}</div>
              <div style={{fontSize:"13px", margin:"4px 0"}}>{task.description}</div>
              <div style={{fontSize:"12px", color:"#6A9C89"}}>
                Status: <b>{task.completed? "Completed" : task.status}</b> | Deadline: {task.deadline? new Date(task.deadline).toLocaleDateString() : "No deadline"} <br/>
                🗓️ Created: {new Date(task.createdAt).toLocaleString()}
              </div>
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:"6px"}}>
  {editingTask === task._id ? (
    <>
      <input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} placeholder='Title' style={{padding:"6px", borderRadius:"5px", border:"1px solid #ccc", width:"130px"}} />
      <input value={editDesc} onChange={(e)=>setEditDesc(e.target.value)} placeholder='Description' style={{padding:"6px", borderRadius:"5px", border:"1px solid #ccc", width:"130px"}} />
      <select value={editStatus} onChange={(e)=>setEditStatus(e.target.value)} style={{padding:"6px", borderRadius:"5px", width:"146px"}}>
          <option>Pending</option><option>In Progress</option><option>Completed</option>
      </select>
      <input  type="date" value="{editDeadline}" onChange={(e)=>setEditDeadline(e.target.value)} placeholder='Deadline' style={{padding:"6px", borderRadius:"5px", border:"1px solid #ccc", width:"130px"}} />

      <button onClick={()=>updateTask(task._id)} style={{background:"#52B788", color:"white", border:"none", padding:"6px 10px", borderRadius:"6px", cursor:"pointer"}}>Save</button>
      <button onClick={()=>setEditingTask(null)} style={{background:"#ccc", border:"none", padding:"6px 10px", borderRadius:"6px", cursor:"pointer"}}>Cancel</button>
    </>
  ) : (
    <>
      <button onClick={()=>startEdit(task)} style={{background:"#40916C", color:"white", border:"none", padding:"6px 10px", borderRadius:"6px", cursor:"pointer"}}>Edit</button>
      <button onClick={()=>deleteTask(task._id)} style={{background:"#C25856", color:"white", border:"none", padding:"6px 10px", borderRadius:"6px", cursor:"pointer"}}>Delete</button>
    </>
  )}
</div>
          </div>
        ))}
      </div>

      <div style={{textAlign:"center", marginTop:"20px"}}>
        <button onClick={()=>{localStorage.removeItem("token"); onLogout()}} style={{padding:"8px 18px", background:"#0F2C26", color:"#C4DFE6", border:"1px solid #6A9C89", borderRadius:"8px"}}>Logout</button>
      </div>
    </div>
  )
}