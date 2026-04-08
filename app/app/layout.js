'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",accent:"#4338CA",green:"#16803C",red:"#BE123C",purple:"#6D28D9"}

const navItems=[
  {label:"Overview",href:"/app",icon:"O"},
  {label:"Leads",href:"/app/leads",icon:"L"},
  {label:"Deals",href:"/app/deals",icon:"D"},
]

export default function AppLayout({children}){
  const [user,setUser]=useState(null)
  const [loading,setLoading]=useState(true)
  const [currentPath,setCurrentPath]=useState('/app')

  useEffect(()=>{
    supabase.auth.getUser().then(({data:{user}})=>{
      if(!user){window.location.href='/login'}
      else{setUser(user);setLoading(false)}
    })
    if(typeof window!=='undefined')setCurrentPath(window.location.pathname)
  },[])

  const handleLogout=async()=>{
    await supabase.auth.signOut()
    window.location.href='/'
  }

  if(loading)return(
    <div style={{background:c.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Instrument Sans',sans-serif"}}>
      <div style={{fontSize:14,color:c.dim}}>Loading...</div>
    </div>
  )

  return(
    <div style={{background:c.bg,minHeight:"100vh",fontFamily:"'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",WebkitFontSmoothing:"antialiased"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Top nav */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 28px",borderBottom:`1px solid ${c.border}`,background:c.white}}>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <span style={{fontSize:16,fontWeight:700,letterSpacing:"-0.01em",color:c.text}}>Brikk</span>
          <nav style={{display:"flex",gap:2,background:c.bg,borderRadius:8,padding:3,border:`1px solid ${c.border}`}}>
            {navItems.map(n=>(
              <a key={n.href} href={n.href} style={{background:currentPath===n.href?c.text:"transparent",color:currentPath===n.href?"#fff":c.dim,borderRadius:6,padding:"7px 18px",fontSize:12,fontWeight:600,textDecoration:"none",transition:"all 0.15s"}}>{n.label}</a>
            ))}
          </nav>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontSize:12,color:c.sub}}>{user?.email}</span>
          <button onClick={handleLogout} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
        </div>
      </header>

      {/* Content */}
      <main style={{padding:"24px 28px",maxWidth:1200,margin:"0 auto"}}>
        {children}
      </main>
    </div>
  )
}
