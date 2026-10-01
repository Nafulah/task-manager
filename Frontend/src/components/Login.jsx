import { useState } from 'react'
export default function Login({ onLogin }){
  const [form,setForm]=useState({email:"",password:""})
  const handleSubmit = async(e)=>{
    e.preventDefault()
    const res = await fetch("http://localhost:5000/api/auth/login",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(form)
    })
    const data = await res.json()
    if(data.token){
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userEmail", data.user.email);
      setForm({email:"",password:""})
      onLogin()
    } else alert(data.msg)
  }
  return(
    <form onSubmit={handleSubmit} style={{background:"#1A4D2E", padding:"20px", borderRadius:"12px", color:"white", boxShadow:"0 4px 10px rgba(0,0,0,0.3)"}}>
      <h2 style={{color:"#E8FFCE"}}>🔐 Login</h2>
      <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required style={inputStyle} />
      <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required style={inputStyle} />
      <button style={btnStyle}>Login</button>
    </form>
  )
}
const inputStyle = {display:"block", margin:"10px 0", padding:"10px", width:"90%", borderRadius:"6px", border:"none"}
const btnStyle = {padding:"10px 20px", background:"#4F6F52", color:"white", border:"none", borderRadius:"6px", cursor:"pointer", fontWeight:"bold"}