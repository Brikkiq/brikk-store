'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)",purpleBorder:"rgba(109,40,217,0.12)"}

const navItems=[
  {label:"Home",href:"/app",icon:"H"},
  {label:"Copilot",href:"/app/copilot",icon:"C"},
  {label:"Leads",href:"/app/leads",icon:"L"},
  {label:"Deals",href:"/app/deals",icon:"D"},
  {label:"Calendar",href:"/app/calendar",icon:"K"},
  {label:"Marketing",href:"/app/marketing",icon:"M"},
  {label:"Messages",href:"/app/messages",icon:"T"},
]

export default function AppLayout({children}){
  const [user,setUser]=useState(null)
  const [loading,setLoading]=useState(true)
  const [currentPath,setCurrentPath]=useState('/app')
  const [notification,setNotification]=useState(null)
  const [dismissed,setDismissed]=useState(false)

  useEffect(()=>{
    supabase.auth.getUser().then(({data:{user}})=>{
      if(!user){window.location.href='/login'}
      else{setUser(user);setLoading(false);checkNotifications()}
    })
    if(typeof window!=='undefined')setCurrentPath(window.location.pathname)
  },[])

  const checkNotifications=async()=>{
    const [leadsRes,dealsRes]=await Promise.all([
      supabase.from('leads').select('id,name,temperature,last_contact_date'),
      supabase.from('deals').select('id,address,close_date')
    ])
    const leads=leadsRes.data||[]
    const deals=dealsRes.data||[]

    const daysSince=(date)=>{
      if(!date)return 999
      return Math.floor((new Date()-new Date(date))/(1000*60*60*24))
    }
    const daysUntil=(date)=>{
      if(!date)return null
      return Math.ceil((new Date(date)-new Date())/(1000*60*60*24))
    }

    // Check for urgent items
    const hotOverdue=leads.filter(l=>l.temperature==='hot'&&daysSince(l.last_contact_date)>=2)
    const closingSoon=deals.filter(d=>d.close_date&&daysUntil(d.close_date)<=3&&daysUntil(d.close_date)>=0)
    const needsFollowUp=leads.filter(l=>(l.temperature==='hot'&&daysSince(l.last_contact_date)>=1)||(l.temperature==='warm'&&daysSince(l.last_contact_date)>=3))

    if(hotOverdue.length>0){
      setNotification({
        type:'urgent',
        color:c.red,
        bg:c.redSoft,
        msg:`${hotOverdue.length} hot lead${hotOverdue.length>1?'s':''} overdue for contact — ${hotOverdue[0].name}${hotOverdue.length>1?' and more':''}`,
        link:'/app/copilot',
        linkLabel:'Open Copilot'
      })
    }else if(closingSoon.length>0){
      setNotification({
        type:'deal',
        color:c.amber,
        bg:c.amberSoft,
        msg:`${closingSoon[0].address} closing in ${daysUntil(closingSoon[0].close_date)} day${daysUntil(closingSoon[0].close_date)!==1?'s':''}`,
        link:'/app/deals',
        linkLabel:'View Deals'
      })
    }else if(needsFollowUp.length>0){
      setNotification({
        type:'copilot',
        color:c.purple,
        bg:c.purpleSoft,
        msg:`Copilot has ${needsFollowUp.length} follow-up${needsFollowUp.length>1?'s':''} ready to draft`,
        link:'/app/copilot',
        linkLabel:'Generate Drafts'
      })
    }
  }

  const handleLogout=async()=>{
    await supabase.auth.signOut()
    window.location.href='/'
  }

  if(loading)return(
    <div style={{background:c.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Instrument Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      <div style={{fontSize:18,fontWeight:700,color:c.text,animation:"pulse 1.2s ease-in-out infinite"}}>Brikk</div>
    </div>
  )

  return(
    <div style={{background:c.bg,minHeight:"100vh",fontFamily:"'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",WebkitFontSmoothing:"antialiased",paddingBottom:72}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @media(min-width:769px){.mobile-bottom-nav{display:none!important}.desktop-nav{display:flex!important}}
        @media(max-width:768px){.desktop-nav{display:none!important}.mobile-bottom-nav{display:flex!important}.app-main{padding:16px 16px 80px!important}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}
        .fade-in{animation:fadeIn 0.3s ease-out}
        .slide-up{animation:slideUp 0.3s ease-out}
      `}</style>

      {/* Notification banner */}
      {notification&&!dismissed&&(
        <div style={{background:notification.bg,borderBottom:`1px solid ${notification.color}20`,padding:"10px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:notification.color,flexShrink:0}}/>
            <span style={{fontSize:13,fontWeight:500,color:c.text}}>{notification.msg}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <a href={notification.link} style={{fontSize:12,fontWeight:600,color:notification.color,textDecoration:"none"}}>{notification.linkLabel}</a>
            <button onClick={()=>setDismissed(true)} style={{background:"none",border:"none",fontSize:14,color:c.dim,cursor:"pointer",padding:"0 4px"}}>×</button>
          </div>
        </div>
      )}

      {/* Desktop top nav */}
      <header className="desktop-nav" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 28px",borderBottom:`1px solid ${c.border}`,background:c.white,position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <span style={{fontSize:16,fontWeight:700,letterSpacing:"-0.01em",color:c.text}}>Brikk</span>
          <nav style={{display:"flex",gap:2,background:c.bg,borderRadius:8,padding:3,border:`1px solid ${c.border}`,overflowX:"auto"}}>
            {navItems.map(n=>(
              <a key={n.href} href={n.href} style={{background:currentPath===n.href?c.text:"transparent",color:currentPath===n.href?"#fff":c.dim,borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,textDecoration:"none",whiteSpace:"nowrap"}}>{n.label}</a>
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
          <a key={n.href} href={n.href} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,textDecoration:"none",padding:"6px 8px",borderRadius:8,flex:1}}>
            <div style={{width:28,height:28,borderRadius:8,background:currentPath===n.href?c.text:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:currentPath===n.href?"#fff":c.dim}}>{n.icon}</div>
            <span style={{fontSize:9,fontWeight:600,color:currentPath===n.href?c.text:c.dim}}>{n.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
