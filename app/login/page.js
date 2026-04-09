'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)"}

export default function Login(){
  const [mode,setMode]=useState('login')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [fullName,setFullName]=useState('')
  const [phone,setPhone]=useState('')
  const [brokerage,setBrokerage]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState(null)
  const [success,setSuccess]=useState(null)
  const [showConfirmation,setShowConfirmation]=useState(false)

  const handleLogin=async()=>{
    if(!email||!password){setError('Please enter your email and password.');return}
    setLoading(true);setError(null)
    const {error}=await supabase.auth.signInWithPassword({email,password})
    if(error){
      if(error.message.includes('Email not confirmed')){
        setError('Please check your email and click the confirmation link before signing in.')
      }else if(error.message.includes('Invalid login')){
        setError('Invalid email or password. Please try again.')
      }else{
        setError(error.message)
      }
      setLoading(false)
    }else{
      window.location.href='/app'
    }
  }

  const handleSignup=async()=>{
    if(!fullName){setError('Please enter your full name.');return}
    if(!email){setError('Please enter your email.');return}
    if(!password||password.length<6){setError('Password must be at least 6 characters.');return}
    
    setLoading(true);setError(null)
    const {data,error}=await supabase.auth.signUp({
      email,password,
      options:{
        data:{full_name:fullName},
        emailRedirectTo:`${typeof window!=='undefined'?window.location.origin:''}/auth/callback`
      }
    })

    if(error){
      if(error.message.includes('already registered')){
        setError('This email is already registered. Try signing in instead.')
      }else{
        setError(error.message)
      }
      setLoading(false)
    }else{
      // Update profile with extra info if provided
      if(data?.user?.id&&(phone||brokerage)){
        await supabase.from('profiles').update({
          phone:phone||null,
          brokerage:brokerage||null
        }).eq('id',data.user.id)
      }
      setShowConfirmation(true)
      setLoading(false)
    }
  }

  const handleSubmit=()=>{mode==='login'?handleLogin():handleSignup()}
  const handleKeyDown=(e)=>{if(e.key==='Enter')handleSubmit()}

  // Email confirmation screen
  if(showConfirmation)return(
    <div style={{background:c.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Instrument Sans',-apple-system,sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:440,textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:c.greenSoft,border:`2px solid ${c.green}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:28}}>
          ✉
        </div>
        <h1 style={{fontSize:24,fontWeight:700,margin:"0 0 12px"}}>Check your email</h1>
        <p style={{fontSize:15,color:c.sub,lineHeight:1.7,margin:"0 0 8px"}}>
          We sent a confirmation link to <strong style={{color:c.text}}>{email}</strong>
        </p>
        <p style={{fontSize:14,color:c.dim,lineHeight:1.6,margin:"0 0 24px"}}>
          Click the link in the email to activate your account, then come back here to sign in.
        </p>
        <div style={{background:c.amberSoft,border:`1px solid rgba(161,98,7,0.15)`,borderRadius:8,padding:"14px 18px",marginBottom:24,textAlign:"left"}}>
          <div style={{fontSize:12,fontWeight:600,color:c.amber,marginBottom:4}}>Don't see the email?</div>
          <div style={{fontSize:13,color:c.sub,lineHeight:1.6}}>Check your spam folder. The email comes from noreply@mail.app.supabase.io</div>
        </div>
        <button onClick={()=>{setShowConfirmation(false);setMode('login');setPassword('');setSuccess('Account created! Sign in with your email and password.')}}
          style={{background:c.text,border:"none",borderRadius:8,padding:"14px 28px",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
          Go to Sign In
        </button>
        <div style={{marginTop:16}}>
          <a href="/" style={{fontSize:12,color:c.dim}}>Back to brikk.store</a>
        </div>
      </div>
    </div>
  )

  return(
    <div style={{background:c.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Instrument Sans',-apple-system,sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <a href="/" style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",color:c.text,textDecoration:"none"}}>Brikk</a>
          <div style={{fontSize:14,color:c.sub,marginTop:8}}>{mode==='login'?'Welcome back':'Start your free trial'}</div>
          {mode==='signup'&&<div style={{fontSize:12,color:c.green,fontWeight:600,marginTop:4}}>First 45 days free — no credit card</div>}
        </div>

        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"28px 24px"}}>
          {/* Toggle */}
          <div style={{display:"flex",gap:2,background:c.bg,borderRadius:8,padding:3,marginBottom:20,border:`1px solid ${c.border}`}}>
            {['login','signup'].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError(null);setSuccess(null)}} style={{flex:1,background:mode===m?c.text:"transparent",color:mode===m?"#fff":c.dim,border:"none",borderRadius:6,padding:"9px 0",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{m==='login'?'Sign In':'Sign Up'}</button>
            ))}
          </div>

          {mode==='signup'&&<>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:5}}>Full Name *</label>
              <input value={fullName} onChange={e=>setFullName(e.target.value)} onKeyDown={handleKeyDown} placeholder="Alex Johnson"
                style={{width:"100%",padding:"11px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:5}}>Phone</label>
              <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} onKeyDown={handleKeyDown} placeholder="(801) 555-0142"
                style={{width:"100%",padding:"11px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:5}}>Brokerage</label>
              <input value={brokerage} onChange={e=>setBrokerage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Keller Williams, eXp, etc."
                style={{width:"100%",padding:"11px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
          </>}

          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:5}}>Email *</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={handleKeyDown} placeholder="you@email.com"
              style={{width:"100%",padding:"11px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>

          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:5}}>Password *</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder={mode==='signup'?"Min 6 characters":"Your password"}
              style={{width:"100%",padding:"11px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>

          {error&&<div style={{background:c.redSoft,borderRadius:6,padding:"10px 14px",marginBottom:14,fontSize:13,color:c.red,lineHeight:1.5}}>{error}</div>}
          {success&&<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:6,padding:"10px 14px",marginBottom:14,fontSize:13,color:c.green,lineHeight:1.5}}>{success}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{width:"100%",background:c.text,border:"none",borderRadius:8,padding:"13px 0",fontSize:14,fontWeight:600,color:"#fff",cursor:loading?"wait":"pointer",opacity:loading?0.7:1,fontFamily:"inherit"}}>
            {loading?'Please wait...':mode==='login'?'Sign In':'Create Account'}
          </button>

          {mode==='login'&&(
            <div style={{textAlign:"center",marginTop:14}}>
              <button onClick={async()=>{
                if(!email){setError('Enter your email, then click this link.');return}
                const {error}=await supabase.auth.resetPasswordForEmail(email)
                if(error)setError(error.message)
                else setSuccess('Password reset link sent to your email.')
              }} style={{background:"none",border:"none",fontSize:12,color:c.dim,cursor:"pointer",fontFamily:"inherit"}}>Forgot password?</button>
            </div>
          )}
        </div>

        <div style={{textAlign:"center",marginTop:20,display:"flex",flexDirection:"column",gap:8}}>
          <a href="/" style={{fontSize:12,color:c.dim}}>Back to brikk.store</a>
          <span style={{fontSize:11,color:c.borderLight}}>By signing up you agree to Brikk's Terms of Service</span>
        </div>
      </div>
    </div>
  )
}
