'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const navItems=[
  {label:"Home",href:"/app",iconKey:"home"},
  {label:"Copilot",href:"/app/copilot",iconKey:"copilot"},
  {label:"Leads",href:"/app/leads",iconKey:"leads"},
  {label:"Deals",href:"/app/deals",iconKey:"deals"},
  {label:"Calendar",href:"/app/calendar",iconKey:"calendar"},
  {label:"Messages",href:"/app/messages",iconKey:"messages"},
]

const Icon=({name,size=22,filled=false})=>{
  const props={width:size,height:size,viewBox:"0 0 24 24",fill:filled?"currentColor":"none",stroke:"currentColor",strokeWidth:filled?0:1.8,strokeLinecap:"round",strokeLinejoin:"round"}
  switch(name){
    case 'home':return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    case 'copilot':return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="M4.22 4.22l2.83 2.83"/><path d="M16.95 16.95l2.83 2.83"/><path d="M1 12h4"/><path d="M19 12h4"/><path d="M4.22 19.78l2.83-2.83"/><path d="M16.95 7.05l2.83-2.83"/></svg>
    case 'leads':return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'deals':return <svg {...props}><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    case 'calendar':return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'marketing':return <svg {...props}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    case 'messages':return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'settings':return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    default:return null
  }
}

export default function AppLayout({children}){
  const [user,setUser]=useState(null)
  const [loading,setLoading]=useState(true)
  const [currentPath,setCurrentPath]=useState('/app')
  const [notification,setNotification]=useState(null)
  const [dismissed,setDismissed]=useState(false)
  const [pageTransition,setPageTransition]=useState(true)
  const [refreshing,setRefreshing]=useState(false)
  const [pullDistance,setPullDistance]=useState(0)
  const touchStartX=useRef(0)
  const touchEndX=useRef(0)
  const touchStartY=useRef(0)
  const isPulling=useRef(false)

  useEffect(()=>{
    supabase.auth.getUser().then(({data:{user}})=>{
      if(!user){window.location.href='/login'}
      else{setUser(user);setLoading(false);checkNotifications(user.id)}
    })
    if(typeof window!=='undefined'){
      setCurrentPath(window.location.pathname)
      try{
        const saved=JSON.parse(localStorage.getItem('brikk-appearance')||'{}')
        if(saved.darkMode)document.documentElement.classList.add('brikk-dark')
        else document.documentElement.classList.remove('brikk-dark')
        // Brightness classes
        document.documentElement.classList.remove('brikk-dim-90','brikk-dim-80','brikk-dim-70','brikk-dim-60','brikk-dim-50')
        if(saved.brightness){
          const b=saved.brightness
          if(b<=55)document.documentElement.classList.add('brikk-dim-50')
          else if(b<=65)document.documentElement.classList.add('brikk-dim-60')
          else if(b<=75)document.documentElement.classList.add('brikk-dim-70')
          else if(b<=85)document.documentElement.classList.add('brikk-dim-80')
          else if(b<=95)document.documentElement.classList.add('brikk-dim-90')
        }
        if(saved.blueLight&&saved.blueLight>0){
          let ov=document.getElementById('brikk-bluelight')
          if(!ov){ov=document.createElement('div');ov.id='brikk-bluelight';ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:99999';document.body.appendChild(ov)}
          ov.style.background=`rgba(255,180,50,${saved.blueLight/100*0.3})`
        }
        document.documentElement.classList.remove('brikk-text-small','brikk-text-large')
        if(saved.textSize==='small')document.documentElement.classList.add('brikk-text-small')
        if(saved.textSize==='large')document.documentElement.classList.add('brikk-text-large')
      }catch(e){}
    }
    setTimeout(()=>{if(window.brikk?.requestPushPermission)window.brikk.requestPushPermission()},15000)
  },[])

  // Swipe navigation + pull to refresh
  const allPages=['/app','/app/copilot','/app/leads','/app/deals','/app/calendar','/app/messages','/app/settings']
  const handleTouchStart=(e)=>{
    touchStartX.current=e.changedTouches[0].screenX
    touchStartY.current=e.changedTouches[0].screenY
    if(window.scrollY===0)isPulling.current=true
  }
  const handleTouchMove=(e)=>{
    if(!isPulling.current)return
    const dy=e.changedTouches[0].screenY-touchStartY.current
    if(dy>0&&window.scrollY===0){
      setPullDistance(Math.min(dy*0.4,80))
    }
  }
  const handleTouchEnd=(e)=>{
    // Pull to refresh
    if(pullDistance>50&&!refreshing){
      setRefreshing(true)
      setPullDistance(0)
      setTimeout(()=>{window.location.reload()},800)
    }else{
      setPullDistance(0)
    }
    isPulling.current=false

    // Swipe left/right navigation
    touchEndX.current=e.changedTouches[0].screenX
    const diff=touchStartX.current-touchEndX.current
    const dy=Math.abs(e.changedTouches[0].screenY-touchStartY.current)
    if(Math.abs(diff)<80||dy>Math.abs(diff))return
    const idx=allPages.indexOf(currentPath)
    if(idx===-1)return
    if(diff>0&&idx<allPages.length-1){
      setPageTransition(false)
      setTimeout(()=>{window.location.href=allPages[idx+1]},10)
    }
    if(diff<0&&idx>0){
      setPageTransition(false)
      setTimeout(()=>{window.location.href=allPages[idx-1]},10)
    }
  }

  const checkNotifications=async(userId)=>{
    const [leadsRes,dealsRes]=await Promise.all([
      supabase.from('leads').select('id,name,temperature,last_contact_date').eq('user_id',userId),
      supabase.from('deals').select('id,address,close_date').eq('user_id',userId)
    ])
    const leads=leadsRes.data||[]
    const deals=dealsRes.data||[]
    const daysSince=(date)=>{if(!date)return 999;return Math.floor((new Date()-new Date(date))/(1000*60*60*24))}
    const daysUntil=(date)=>{if(!date)return null;return Math.ceil((new Date(date)-new Date())/(1000*60*60*24))}
    const hotOverdue=leads.filter(l=>l.temperature==='hot'&&daysSince(l.last_contact_date)>=2)
    const closingSoon=deals.filter(d=>d.close_date&&daysUntil(d.close_date)<=3&&daysUntil(d.close_date)>=0)
    const needsFollowUp=leads.filter(l=>(l.temperature==='hot'&&daysSince(l.last_contact_date)>=1)||(l.temperature==='warm'&&daysSince(l.last_contact_date)>=3))
    const c2={red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)"}
    if(hotOverdue.length>0)setNotification({color:c2.red,bg:c2.redSoft,msg:`${hotOverdue.length} hot lead${hotOverdue.length>1?'s':''} overdue — ${hotOverdue[0].name}${hotOverdue.length>1?' +more':''}`,link:'/app/copilot',linkLabel:'Copilot'})
    else if(closingSoon.length>0)setNotification({color:c2.amber,bg:c2.amberSoft,msg:`${closingSoon[0].address} closing in ${daysUntil(closingSoon[0].close_date)}d`,link:'/app/deals',linkLabel:'Deals'})
    else if(needsFollowUp.length>0)setNotification({color:c2.purple,bg:c2.purpleSoft,msg:`${needsFollowUp.length} follow-up${needsFollowUp.length>1?'s':''} ready to draft`,link:'/app/copilot',linkLabel:'Drafts'})
  }

  if(loading)return(
    <div style={{background:"#FAFAF9",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Instrument Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:24,fontWeight:700,color:"#1A1A18",animation:"pulse 1.2s ease-in-out infinite",letterSpacing:"-0.02em"}}>Brikk</div>
        <div style={{fontSize:12,color:"#9C9C96",marginTop:6}}>Loading your workspace...</div>
      </div>
    </div>
  )

  const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",red:"#BE123C",amber:"#A16207",purple:"#6D28D9"}

  return(
    <div style={{background:c.bg,minHeight:"100vh",fontFamily:"'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",WebkitFontSmoothing:"antialiased",paddingBottom:88}} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>

      {/* Pull to refresh indicator */}
      {(pullDistance>0||refreshing)&&<div style={{display:"flex",justifyContent:"center",padding:`${refreshing?20:pullDistance*0.3}px 0`,transition:refreshing?'none':'padding 0.1s ease'}}>
        <div style={{width:28,height:28,borderRadius:"50%",border:`2.5px solid ${c.border}`,borderTopColor:c.text,display:"flex",alignItems:"center",justifyContent:"center",opacity:refreshing?1:Math.min(pullDistance/50,1),transform:`rotate(${pullDistance*4}deg)`}} className={refreshing?"refresh-spinner":""}/>
      </div>}
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        @media(min-width:769px){.mobile-nav{display:none!important}.desktop-nav{display:flex!important}}
        @media(max-width:768px){.desktop-nav{display:none!important}.mobile-nav{display:flex!important}.app-main{padding:16px 16px 96px!important}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}
        .page-enter{animation:fadeIn 0.25s ease-out}
      `}</style>

      {/* Notification banner */}
      {notification&&!dismissed&&(
        <div style={{background:notification.bg,borderBottom:`1px solid ${notification.color}15`,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:notification.color,flexShrink:0}}/>
            <span style={{fontSize:12,fontWeight:500,color:c.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{notification.msg}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <a href={notification.link} style={{fontSize:11,fontWeight:600,color:notification.color,textDecoration:"none"}}>{notification.linkLabel}</a>
            <button onClick={()=>setDismissed(true)} style={{background:"none",border:"none",fontSize:16,color:c.dim,cursor:"pointer",padding:"0 2px",lineHeight:1}}>×</button>
          </div>
        </div>
      )}

      {/* Desktop top nav */}
      <header className="desktop-nav" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 28px",borderBottom:`1px solid ${c.border}`,background:"rgba(255,255,255,0.8)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <span style={{fontSize:28,fontWeight:800,letterSpacing:"-0.03em",color:c.text}}>Brikk</span>
          <nav style={{display:"flex",gap:1,background:c.bg,borderRadius:10,padding:3,border:`1px solid ${c.border}`}}>
            {navItems.map(n=>(
              <a key={n.href} href={n.href} style={{background:currentPath===n.href?c.text:"transparent",color:currentPath===n.href?"#fff":c.dim,borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:600,textDecoration:"none",whiteSpace:"nowrap",transition:"all 0.15s ease"}}>{n.label}</a>
            ))}
          </nav>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:12,color:c.sub}}>{user?.email}</span>
          <a href="/app/settings" style={{display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8,background:currentPath==='/app/settings'?c.text:c.bg,border:`1px solid ${c.border}`,color:currentPath==='/app/settings'?"#fff":c.dim,textDecoration:"none"}}><Icon name="settings" size={16}/></a>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="mobile-nav" style={{display:"none",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:`1px solid ${c.border}`,background:"rgba(255,255,255,0.85)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:50}}>
        <span style={{fontSize:28,fontWeight:800,letterSpacing:"-0.03em"}}>Brikk</span>
        <a href="/app/settings" style={{display:"flex",alignItems:"center",justifyContent:"center",width:34,height:34,borderRadius:10,background:currentPath==='/app/settings'?"#1A1A18":"#F0F0EC",color:currentPath==='/app/settings'?"#fff":"#6B6B66",textDecoration:"none"}}><Icon name="settings" size={18}/></a>
      </header>

      {/* Content with page transition */}
      <main className="app-main page-enter" style={{padding:"20px 24px 40px",maxWidth:1200,margin:"0 auto"}}>
        {children}
      </main>

      {/* Mobile bottom tab bar — bigger, cleaner */}
      <nav className="mobile-nav" style={{display:"none",position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,0.94)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:`1px solid rgba(232,232,228,0.6)`,padding:"8px 8px calc(8px + env(safe-area-inset-bottom, 0px))",zIndex:100,justifyContent:"space-around",alignItems:"center"}}>
        {navItems.map(n=>{
          const active=currentPath===n.href
          return(
            <a key={n.href} href={n.href} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,textDecoration:"none",padding:"6px 4px",flex:1,minWidth:0}}>
              <div style={{width:32,height:32,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:active?"#1A1A18":"transparent",color:active?"#fff":"#9C9C96",transition:"all 0.2s ease"}}>
                <Icon name={n.iconKey} size={20} filled={active}/>
              </div>
              <span style={{fontSize:10,fontWeight:active?700:500,color:active?"#1A1A18":"#9C9C96",letterSpacing:"0.01em"}}>{n.label}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
