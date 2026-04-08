'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",purple:"#6D28D9"}

const navItems=[
  {label:"Home",href:"/app",icon:"H"},
  {label:"Copilot",href:"/app/copilot",icon:"C"},
  {label:"Leads",href:"/app/leads",icon:"L"},
  {label:"Deals",href:"/app/deals",icon:"D"},
  {label:"Calendar",href:"/app/calendar",icon:"K"},
]

export default function AppLayout({children}){
  const [user,setUser]=useState(null)
  const [loading,setLoading]=useState(true)
  const [currentPath,setCurrentPath]=useState('/app')
  const [menuOpen,setMenuOpen]=useState(false)

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
    <div style={{background:c.bg,minHeight:"100vh",fontFamily:"'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",WebkitFontSmoothing:"antialiased",paddingBottom:72}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @media(min-width:769px){.mobile-bottom-nav{display:none!important}.desktop-nav{display:flex!important}}
        @media(max-width:768px){.desktop-nav{display:none!important}.mobile-bottom-nav{display:flex!important}.app-main{padding:16px 16px 80px!important}}
      `}</style>

      {/* Desktop top nav */}
      <header className="desktop-nav" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 28px",borderBottom:`1px solid ${c.border}`,background:c.white,position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <span style={{fontSize:16,fontWeight:700,letterSpacing:"-0.01em",color:c.text}}>Brikk</span>
          <nav style={{display:"flex",gap:2,background:c.bg,borderRadius:8,padding:3,border:`1px solid ${c.border}`}}>
            {navItems.map(n=>(
              <a key={n.href} href={n.href} style={{background:currentPath===n.href?c.text:"transparent",color:currentPath===n.href?"#fff":c.dim,borderRadius:6,padding:"7px 18px",fontSize:12,fontWeight:600,textDecoration:"none"}}>{n.label}</a>
            ))}
          </nav>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontSize:12,color:c.sub}}>{user?.email}</span>
          <button onClick={handleLogout} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="mobile-bottom-nav" style={{display:"none",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${c.border}`,background:c.white,position:"sticky",top:0,zIndex:50}}>
        <span style={{fontSize:16,fontWeight:700}}>Brikk</span>
        <button onClick={handleLogout} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"6px 12px",fontSize:11,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
      </header>

      {/* Content */}
      <main className="app-main" style={{padding:"24px 28px 40px",maxWidth:1200,margin:"0 auto"}}>
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-bottom-nav" style={{display:"none",position:"fixed",bottom:0,left:0,right:0,background:c.white,borderTop:`1px solid ${c.border}`,padding:"8px 0 env(safe-area-inset-bottom, 8px)",zIndex:100,justifyContent:"space-around"}}>
        {navItems.map(n=>(
          <a key={n.href} href={n.href} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,textDecoration:"none",padding:"6px 12px",borderRadius:8,flex:1}}>
            <div style={{width:28,height:28,borderRadius:8,background:currentPath===n.href?c.text:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:currentPath===n.href?"#fff":c.dim}}>{n.icon}</div>
            <span style={{fontSize:10,fontWeight:600,color:currentPath===n.href?c.text:c.dim}}>{n.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
