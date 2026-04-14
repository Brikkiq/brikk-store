'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)"}

// Add your owner emails here — only these can access the admin panel
const OWNER_EMAILS = ['brikkiq@gmail.com','review@brikk.store']

export default function AdminDashboard(){
  const [user,setUser]=useState(null)
  const [authorized,setAuthorized]=useState(false)
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState('overview')

  // Data
  const [users,setUsers]=useState([])
  const [allLeads,setAllLeads]=useState([])
  const [allDeals,setAllDeals]=useState([])
  const [allMessages,setAllMessages]=useState([])
  const [selectedUser,setSelectedUser]=useState(null)

  useEffect(()=>{
    checkAuth()
  },[])

  const checkAuth=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){window.location.href='/login';return}
    setUser(user)
    if(!OWNER_EMAILS.includes(user.email)){
      setAuthorized(false)
      setLoading(false)
      return
    }
    setAuthorized(true)
    await loadAllData()
    setLoading(false)
  }

  const loadAllData=async()=>{
    const [profilesRes,leadsRes,dealsRes,messagesRes]=await Promise.all([
      supabase.from('profiles').select('*').order('created_at',{ascending:false}),
      supabase.from('leads').select('*'),
      supabase.from('deals').select('*'),
      supabase.from('messages').select('*')
    ])
    setUsers(profilesRes.data||[])
    setAllLeads(leadsRes.data||[])
    setAllDeals(dealsRes.data||[])
    setAllMessages(messagesRes.data||[])
  }

  if(loading)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:c.bg,fontFamily:"'Instrument Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{fontSize:18,fontWeight:700,animation:"pulse 1.2s ease-in-out infinite"}}>Loading admin...</div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
    </div>
  )

  if(!authorized)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:c.bg,fontFamily:"'Instrument Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Access Denied</div>
        <div style={{fontSize:14,color:c.sub}}>You don't have admin privileges.</div>
        <a href="/app" style={{display:"inline-block",marginTop:20,background:c.text,color:"#fff",padding:"12px 28px",borderRadius:10,fontSize:14,fontWeight:600,textDecoration:"none"}}>Back to App</a>
      </div>
    </div>
  )

  // Stats
  const totalLeads=allLeads.length
  const totalDeals=allDeals.length
  const totalMessages=allMessages.length
  const totalCommission=allDeals.reduce((s,d)=>s+(d.commission||0),0)
  const hotLeads=allLeads.filter(l=>l.temperature==='hot').length
  const activeUsers=users.filter(u=>{
    const userLeads=allLeads.filter(l=>l.user_id===u.id)
    return userLeads.length>0
  }).length
  const now=new Date()
  const last7Days=allLeads.filter(l=>{
    const d=new Date(l.created_at)
    return (now-d)<7*24*60*60*1000
  }).length
  const last30Days=allLeads.filter(l=>{
    const d=new Date(l.created_at)
    return (now-d)<30*24*60*60*1000
  }).length

  // Revenue estimate (users * $75/month after trial)
  const potentialMRR=activeUsers*75

  // Per-user stats
  const getUserStats=(userId)=>{
    const leads=allLeads.filter(l=>l.user_id===userId)
    const deals=allDeals.filter(d=>d.user_id===userId)
    const msgs=allMessages.filter(m=>m.user_id===userId)
    return {leads:leads.length,deals:deals.length,messages:msgs.length,commission:deals.reduce((s,d)=>s+(d.commission||0),0)}
  }

  const daysSince=(date)=>{
    if(!date)return '—'
    const days=Math.floor((new Date()-new Date(date))/(1000*60*60*24))
    if(days===0)return 'Today'
    if(days===1)return 'Yesterday'
    return `${days}d ago`
  }

  const tabs=[
    {id:'overview',label:'Overview'},
    {id:'users',label:`Users (${users.length})`},
    {id:'leads',label:`Leads (${totalLeads})`},
    {id:'deals',label:`Deals (${totalDeals})`},
    {id:'activity',label:'Activity'},
  ]

  return(
    <div style={{minHeight:"100vh",background:c.bg,fontFamily:"'Instrument Sans',-apple-system,sans-serif",WebkitFontSmoothing:"antialiased"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} .fade-in{animation:fadeIn 0.25s ease-out}`}</style>

      {/* Header */}
      <header style={{padding:"16px 24px",borderBottom:`1px solid ${c.border}`,background:c.white,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:50}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:"-0.02em"}}>Brikk Admin</div>
          <div style={{fontSize:11,color:c.dim}}>{user?.email}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <a href="/app" style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:600,color:c.sub,textDecoration:"none"}}>Back to App</a>
          <button onClick={loadAllData} style={{background:c.text,border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Refresh</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{padding:"12px 24px",display:"flex",gap:4,overflowX:"auto",borderBottom:`1px solid ${c.border}`,background:c.white}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setSelectedUser(null)}} style={{background:tab===t.id?c.text:"transparent",color:tab===t.id?"#fff":c.dim,border:`1px solid ${tab===t.id?c.text:c.border}`,borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{t.label}</button>
        ))}
      </div>

      <div className="fade-in" style={{padding:"20px 24px",maxWidth:1200,margin:"0 auto"}}>

        {/* OVERVIEW TAB */}
        {tab==='overview'&&<>
          {/* Top stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",gap:12,marginBottom:24}}>
            {[
              {label:'Total Users',value:users.length,color:c.text},
              {label:'Active Users',value:activeUsers,color:c.purple},
              {label:'Total Leads',value:totalLeads,color:c.text},
              {label:'Hot Leads',value:hotLeads,color:c.red},
              {label:'Total Deals',value:totalDeals,color:c.green},
              {label:'Commission Tracked',value:`$${(totalCommission/1000).toFixed(1)}K`,color:c.green},
              {label:'Messages Sent',value:totalMessages,color:c.text},
              {label:'Potential MRR',value:`$${potentialMRR}`,color:c.purple},
            ].map((s,i)=>(
              <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"18px 16px"}}>
                <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>{s.label}</div>
                <div style={{fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Growth */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
            <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"20px"}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Leads This Week</div>
              <div style={{fontSize:32,fontWeight:700,color:c.green}}>{last7Days}</div>
              <div style={{fontSize:12,color:c.dim,marginTop:4}}>New leads in last 7 days</div>
            </div>
            <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"20px"}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Leads This Month</div>
              <div style={{fontSize:32,fontWeight:700,color:c.text}}>{last30Days}</div>
              <div style={{fontSize:12,color:c.dim,marginTop:4}}>New leads in last 30 days</div>
            </div>
          </div>

          {/* Lead sources across all users */}
          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"20px",marginBottom:24}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Lead Sources (All Users)</div>
            {(()=>{
              const sources={}
              allLeads.forEach(l=>{const s=l.source||'Unknown';sources[s]=(sources[s]||0)+1})
              const sorted=Object.entries(sources).sort((a,b)=>b[1]-a[1])
              const max=sorted[0]?sorted[0][1]:1
              return sorted.map(([source,count])=>(
                <div key={source} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                  <div style={{width:100,fontSize:12,fontWeight:600,color:c.sub,flexShrink:0}}>{source}</div>
                  <div style={{flex:1,height:8,borderRadius:4,background:c.bg,overflow:"hidden"}}>
                    <div style={{width:`${count/max*100}%`,height:"100%",borderRadius:4,background:c.text}}/>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,width:32,textAlign:"right"}}>{count}</div>
                </div>
              ))
            })()}
          </div>

          {/* Temperature breakdown */}
          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"20px"}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Lead Temperature (All Users)</div>
            <div style={{display:"flex",gap:16}}>
              {[
                {label:'Hot',count:allLeads.filter(l=>l.temperature==='hot').length,color:c.red,bg:c.redSoft},
                {label:'Warm',count:allLeads.filter(l=>l.temperature==='warm').length,color:c.amber,bg:c.amberSoft},
                {label:'Cold',count:allLeads.filter(l=>l.temperature==='cold').length,color:c.sub,bg:c.bg},
              ].map(t=>(
                <div key={t.label} style={{flex:1,background:t.bg,borderRadius:10,padding:"16px",textAlign:"center"}}>
                  <div style={{fontSize:24,fontWeight:700,color:t.color}}>{t.count}</div>
                  <div style={{fontSize:12,fontWeight:600,color:t.color,marginTop:4}}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>}

        {/* USERS TAB */}
        {tab==='users'&&<>
          {selectedUser?<div>
            <button onClick={()=>setSelectedUser(null)} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:600,color:c.sub,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>← Back to Users</button>
            {(()=>{
              const u=users.find(u=>u.id===selectedUser)
              const stats=getUserStats(selectedUser)
              const userLeads=allLeads.filter(l=>l.user_id===selectedUser)
              const userDeals=allDeals.filter(d=>d.user_id===selectedUser)
              return(<>
                <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"20px",marginBottom:16}}>
                  <div style={{fontSize:18,fontWeight:700}}>{u?.full_name||'No name'}</div>
                  <div style={{fontSize:13,color:c.dim}}>{u?.email}</div>
                  <div style={{fontSize:12,color:c.dim,marginTop:4}}>Phone: {u?.phone||'—'} | Brokerage: {u?.brokerage||'—'}</div>
                  <div style={{fontSize:11,color:c.dim,marginTop:4}}>Joined: {u?.created_at?new Date(u.created_at).toLocaleDateString():'—'}</div>
                  <div style={{display:"flex",gap:12,marginTop:16}}>
                    <div style={{background:c.bg,borderRadius:8,padding:"12px 16px",flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}>{stats.leads}</div><div style={{fontSize:10,color:c.dim}}>Leads</div></div>
                    <div style={{background:c.bg,borderRadius:8,padding:"12px 16px",flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}>{stats.deals}</div><div style={{fontSize:10,color:c.dim}}>Deals</div></div>
                    <div style={{background:c.bg,borderRadius:8,padding:"12px 16px",flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}>{stats.messages}</div><div style={{fontSize:10,color:c.dim}}>Messages</div></div>
                    <div style={{background:c.bg,borderRadius:8,padding:"12px 16px",flex:1,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:c.green}}>${(stats.commission/1000).toFixed(1)}K</div><div style={{fontSize:10,color:c.dim}}>Commission</div></div>
                  </div>
                </div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>Leads ({userLeads.length})</div>
                {userLeads.slice(0,20).map(l=>(
                  <div key={l.id} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"12px 16px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{l.name}</div><div style={{fontSize:11,color:c.dim}}>{l.phone} | {l.source} | {l.stage}</div></div>
                    <div style={{fontSize:11,fontWeight:600,color:l.temperature==='hot'?c.red:l.temperature==='warm'?c.amber:c.dim,background:l.temperature==='hot'?c.redSoft:l.temperature==='warm'?c.amberSoft:c.bg,padding:"4px 8px",borderRadius:6}}>{l.temperature}</div>
                  </div>
                ))}
                {userDeals.length>0&&<>
                  <div style={{fontSize:14,fontWeight:700,marginTop:20,marginBottom:10}}>Deals ({userDeals.length})</div>
                  {userDeals.map(d=>(
                    <div key={d.id} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"12px 16px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontSize:13,fontWeight:600}}>{d.address||'No address'}</div><div style={{fontSize:11,color:c.dim}}>{d.stage} | Close: {d.close_date||'—'}</div></div>
                      <div style={{fontSize:13,fontWeight:700,color:c.green}}>${(d.commission||0).toLocaleString()}</div>
                    </div>
                  ))}
                </>}
              </>)
            })()}
          </div>:
          <div>
            {users.map(u=>{
              const stats=getUserStats(u.id)
              return(
                <div key={u.id} onClick={()=>setSelectedUser(u.id)} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"16px 20px",marginBottom:8,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700}}>{u.full_name||'No name'}</div>
                    <div style={{fontSize:12,color:c.dim}}>{u.email}</div>
                    <div style={{fontSize:11,color:c.dim,marginTop:2}}>{u.brokerage||'No brokerage'} | Joined {daysSince(u.created_at)}</div>
                  </div>
                  <div style={{display:"flex",gap:16,alignItems:"center"}}>
                    <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700}}>{stats.leads}</div><div style={{fontSize:9,color:c.dim}}>Leads</div></div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700}}>{stats.deals}</div><div style={{fontSize:9,color:c.dim}}>Deals</div></div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:c.green}}>${(stats.commission/1000).toFixed(1)}K</div><div style={{fontSize:9,color:c.dim}}>Comm</div></div>
                    <span style={{color:c.dim}}>›</span>
                  </div>
                </div>
              )
            })}
          </div>}
        </>}

        {/* LEADS TAB — all leads across all users */}
        {tab==='leads'&&<>
          <div style={{marginBottom:16,display:"flex",gap:8,flexWrap:"wrap"}}>
            {['all','hot','warm','cold'].map(f=>(
              <button key={f} style={{background:f==='all'?c.text:'transparent',color:f==='all'?'#fff':c.dim,border:`1px solid ${f==='all'?c.text:c.border}`,borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{f} ({f==='all'?allLeads.length:allLeads.filter(l=>l.temperature===f).length})</button>
            ))}
          </div>
          {allLeads.slice(0,50).map(l=>{
            const owner=users.find(u=>u.id===l.user_id)
            return(
              <div key={l.id} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"12px 16px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontSize:13,fontWeight:600}}>{l.name}</div>
                  <div style={{fontSize:11,color:c.dim}}>{l.phone} | {l.source} | {l.stage}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:10,color:c.dim,background:c.bg,padding:"3px 8px",borderRadius:4}}>{owner?.full_name||'Unknown agent'}</span>
                  <span style={{fontSize:10,fontWeight:600,color:l.temperature==='hot'?c.red:l.temperature==='warm'?c.amber:c.dim,background:l.temperature==='hot'?c.redSoft:l.temperature==='warm'?c.amberSoft:c.bg,padding:"3px 8px",borderRadius:4}}>{l.temperature}</span>
                  <span style={{fontSize:10,color:c.dim}}>{daysSince(l.created_at)}</span>
                </div>
              </div>
            )
          })}
        </>}

        {/* DEALS TAB */}
        {tab==='deals'&&<>
          {allDeals.length===0?<div style={{textAlign:"center",padding:40,color:c.dim}}>No deals yet</div>:
          allDeals.map(d=>{
            const owner=users.find(u=>u.id===d.user_id)
            return(
              <div key={d.id} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 16px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>{d.address||'No address'}</div>
                  <div style={{fontSize:11,color:c.dim}}>{d.stage} | Close: {d.close_date||'—'} | Agent: {owner?.full_name||'Unknown'}</div>
                </div>
                <div style={{fontSize:16,fontWeight:700,color:c.green}}>${(d.commission||0).toLocaleString()}</div>
              </div>
            )
          })}
        </>}

        {/* ACTIVITY TAB */}
        {tab==='activity'&&<>
          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"20px",marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Recent Signups</div>
            {users.slice(0,10).map(u=>(
              <div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${c.borderLight}`}}>
                <div><div style={{fontSize:13,fontWeight:600}}>{u.full_name||'No name'}</div><div style={{fontSize:11,color:c.dim}}>{u.email}</div></div>
                <div style={{fontSize:11,color:c.dim}}>{daysSince(u.created_at)}</div>
              </div>
            ))}
          </div>

          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"20px"}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Recent Leads Added</div>
            {allLeads.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,15).map(l=>{
              const owner=users.find(u=>u.id===l.user_id)
              return(
                <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${c.borderLight}`}}>
                  <div><div style={{fontSize:13,fontWeight:600}}>{l.name}</div><div style={{fontSize:11,color:c.dim}}>by {owner?.full_name||'Unknown'} | {l.source}</div></div>
                  <div style={{fontSize:11,color:c.dim}}>{daysSince(l.created_at)}</div>
                </div>
              )
            })}
          </div>
        </>}
      </div>
    </div>
  )
}
