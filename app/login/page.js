'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)"}

export default function Login(){
  const [mode,setMode]=useState('login')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [fullName,setFullName]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState(null)
  const [success,setSuccess]=useState(null)

  const handleLogin=async()=>{
    setLoading(true);setError(null)
    const {error}=await supabase.auth.signInWithPassword({email,password})
    if(error){setError(error.message);setLoading(false)}
    else{window.location.href='/app'}
  }

  const handleSignup=async()=>{
    setLoading(true);setError(null)
    const {error}=await supabase.auth.signUp({
      email,password,
      options:{data:{full_name:fullName}}
    })
    if(error){setError(error.message);setLoading(false)}
    else{setSuccess('Check your email to confirm your account.');setLoading(false)}
  }

  const handleSubmit=()=>{mode==='login'?handleLogin():handleSignup()}

  return(
    <div style={{background:c.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Instrument Sans',-apple-system,sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <a href="/" style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",color:c.text,textDecoration:"none"}}>Brikk</a>
          <div style={{fontSize:13,color:c.sub,marginTop:8}}>{mode==='login'?'Sign in to your command center':'Create your Brikk account'}</div>
        </div>

        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"32px 28px"}}>
          {/* Toggle */}
          <div style={{display:"flex",gap:2,background:c.bg,borderRadius:8,padding:3,marginBottom:24,border:`1px solid ${c.border}`}}>
            {['login','signup'].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError(null);setSuccess(null)}} style={{flex:1,background:mode===m?c.text:"transparent",color:mode===m?"#fff":c.dim,border:"none",borderRadius:6,padding:"8px 0",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{m==='login'?'Sign In':'Sign Up'}</button>
            ))}
          </div>

          {mode==='signup'&&(
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Full Name</label>
              <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Alex Johnson"
                style={{width:"100%",padding:"12px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
          )}

          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com"
              style={{width:"100%",padding:"12px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>

          <div style={{marginBottom:24}}>
            <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters"
              style={{width:"100%",padding:"12px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>

          {error&&<div style={{background:c.redSoft,borderRadius:6,padding:"10px 14px",marginBottom:16,fontSize:13,color:c.red}}>{error}</div>}
          {success&&<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:6,padding:"10px 14px",marginBottom:16,fontSize:13,color:c.green}}>{success}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{width:"100%",background:c.text,border:"none",borderRadius:8,padding:"14px 0",fontSize:14,fontWeight:600,color:"#fff",cursor:loading?"wait":"pointer",opacity:loading?0.7:1,fontFamily:"inherit"}}>
            {loading?'Please wait...':mode==='login'?'Sign In':'Create Account'}
          </button>
        </div>

        <div style={{textAlign:"center",marginTop:20}}>
          <a href="/" style={{fontSize:12,color:c.dim}}>Back to brikk.store</a>
        </div>
      </div>
    </div>
  )
}
