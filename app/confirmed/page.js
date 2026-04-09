'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)"}

export default function Confirmed(){
  const [checking,setChecking]=useState(true)
  const [loggedIn,setLoggedIn]=useState(false)
  const [countdown,setCountdown]=useState(5)

  useEffect(()=>{
    // Check if user is now authenticated after email confirmation
    supabase.auth.getUser().then(({data:{user}})=>{
      if(user){
        setLoggedIn(true)
        setChecking(false)
        // Auto redirect to app after countdown
        const timer=setInterval(()=>{
          setCountdown(prev=>{
            if(prev<=1){
              clearInterval(timer)
              window.location.href='/app'
              return 0
            }
            return prev-1
          })
        },1000)
        return()=>clearInterval(timer)
      }else{
        setChecking(false)
      }
    })
  },[])

  return(
    <div style={{background:c.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Instrument Sans',-apple-system,sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:440,width:"100%",textAlign:"center"}}>
        {checking?(
          <div style={{fontSize:14,color:c.dim}}>Verifying your account...</div>
        ):loggedIn?(
          <>
            <div style={{width:72,height:72,borderRadius:"50%",background:c.greenSoft,border:`2px solid ${c.green}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:32}}>
              ✓
            </div>
            <h1 style={{fontSize:28,fontWeight:700,margin:"0 0 12px"}}>You're in!</h1>
            <p style={{fontSize:16,color:c.sub,lineHeight:1.7,margin:"0 0 8px"}}>
              Your email is confirmed and your Brikk account is ready.
            </p>
            <p style={{fontSize:14,color:c.dim,margin:"0 0 28px"}}>
              Taking you to your dashboard in {countdown} second{countdown!==1?'s':''}...
            </p>
            <a href="/app" style={{display:"inline-block",background:c.text,borderRadius:8,padding:"14px 32px",fontSize:14,fontWeight:600,color:"#fff",textDecoration:"none"}}>
              Go to Dashboard Now
            </a>
            <div style={{marginTop:24}}>
              <p style={{fontSize:13,color:c.dim,lineHeight:1.6}}>
                Start by adding your first few leads. The more you add, the smarter Brikk gets.
              </p>
            </div>
          </>
        ):(
          <>
            <h1 style={{fontSize:24,fontWeight:700,margin:"0 0 12px"}}>Email Confirmed</h1>
            <p style={{fontSize:15,color:c.sub,lineHeight:1.7,margin:"0 0 24px"}}>
              Your account is ready. Sign in to get started.
            </p>
            <a href="/login" style={{display:"inline-block",background:c.text,borderRadius:8,padding:"14px 32px",fontSize:14,fontWeight:600,color:"#fff",textDecoration:"none"}}>
              Sign In
            </a>
          </>
        )}
      </div>
    </div>
  )
}
