'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)"}

export default function AuthCallback(){
  const [status,setStatus]=useState('confirming')

  useEffect(()=>{
    const handleCallback=async()=>{
      // Supabase handles the token exchange automatically from the URL hash
      const {data:{session},error}=await supabase.auth.getSession()
      
      if(session){
        setStatus('success')
        setTimeout(()=>{window.location.href='/app'},2000)
      }else{
        // Try to exchange the token from URL
        if(typeof window!=='undefined'&&window.location.hash){
          const params=new URLSearchParams(window.location.hash.substring(1))
          const accessToken=params.get('access_token')
          const refreshToken=params.get('refresh_token')
          if(accessToken){
            const {error:setError}=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken})
            if(!setError){
              setStatus('success')
              setTimeout(()=>{window.location.href='/app'},2000)
              return
            }
          }
        }
        setStatus('success')
        setTimeout(()=>{window.location.href='/login'},2500)
      }
    }
    handleCallback()
  },[])

  return(
    <div style={{background:c.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Instrument Sans',-apple-system,sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:440,width:"100%",textAlign:"center"}}>
        {status==='confirming'&&<>
          <div style={{width:64,height:64,borderRadius:"50%",background:c.bg,border:`2px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:24}}>
            <div style={{width:20,height:20,borderRadius:"50%",border:"3px solid #E8E8E4",borderTopColor:c.text,animation:"spin 0.8s linear infinite"}}/>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 12px"}}>Confirming your account...</h1>
          <p style={{fontSize:14,color:c.sub}}>Just a moment.</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </>}
        {status==='success'&&<>
          <div style={{width:64,height:64,borderRadius:"50%",background:c.greenSoft,border:`2px solid ${c.green}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:28,color:c.green}}>
            ✓
          </div>
          <h1 style={{fontSize:22,fontWeight:700,margin:"0 0 12px"}}>You're all set!</h1>
          <p style={{fontSize:14,color:c.sub,marginBottom:8}}>Your account is confirmed. Taking you to Brikk now...</p>
          <div style={{width:120,height:4,borderRadius:2,background:c.border,margin:"20px auto",overflow:"hidden"}}>
            <div style={{width:"100%",height:"100%",background:c.green,borderRadius:2,animation:"fill 2s ease-out"}}/>
          </div>
          <style>{`@keyframes fill{from{width:0}to{width:100%}}`}</style>
          <a href="/app" style={{fontSize:13,color:c.dim}}>Click here if not redirected</a>
        </>}
      </div>
    </div>
  )
}
