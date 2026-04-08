'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)"}

const Stat=({label,value,note,color=c.text})=>(
  <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px",minWidth:140}}>
    <div style={{fontSize:10,fontWeight:600,color:c.dim,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:8}}>{label}</div>
    <div style={{fontSize:24,fontWeight:700,color,letterSpacing:"-0.02em",lineHeight:1}}>{value}</div>
    {note&&<div style={{fontSize:11,color:c.sub,marginTop:6}}>{note}</div>}
  </div>
)

const Progress=({value,max,color})=>(
  <div style={{background:"#F0F0EC",borderRadius:3,height:4,width:"100%",overflow:"hidden"}}>
    <div style={{width:`${Math.min((value/max)*100,100)}%`,height:"100%",background:color,borderRadius:3}}/>
  </div>
)

export default function AppOverview(){
  const [leads,setLeads]=useState([])
  const [deals,setDeals]=useState([])
  const [profile,setProfile]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadData()
  },[])

  const loadData=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return

    const [leadsRes,dealsRes,profileRes]=await Promise.all([
      supabase.from('leads').select('*').order('created_at',{ascending:false}),
      supabase.from('deals').select('*').order('created_at',{ascending:false}),
      supabase.from('profiles').select('*').eq('id',user.id).single()
    ])

    setLeads(leadsRes.data||[])
    setDeals(dealsRes.data||[])
    setProfile(profileRes.data)
    setLoading(false)
  }

  const hotLeads=leads.filter(l=>l.temperature==='hot').length
  const warmLeads=leads.filter(l=>l.temperature==='warm').length
  const coldLeads=leads.filter(l=>l.temperature==='cold').length
  const totalCommission=deals.reduce((s,d)=>s+(d.commission||0),0)
  const goal=profile?.annual_goal||200000

  const daysSince=(date)=>{
    if(!date)return 999
    const d=new Date(date)
    const now=new Date()
    return Math.floor((now-d)/(1000*60*60*24))
  }

  const urgentLeads=leads.filter(l=>{
    const days=daysSince(l.last_contact_date)
    return(l.temperature==='hot'&&days>=2)||(l.temperature==='warm'&&days>=5)||(l.temperature==='cold'&&days>=10)
  })

  const tempColor=(t)=>({hot:{bg:c.redSoft,color:c.red},warm:{bg:c.amberSoft,color:c.amber},cold:{bg:"rgba(26,26,24,0.04)",color:c.dim}}[t]||{bg:c.bg,color:c.dim})

  if(loading)return <div style={{padding:40,textAlign:"center",color:c.dim}}>Loading your data...</div>

  return(
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.01em",margin:"0 0 4px"}}>Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}{profile?.full_name?`, ${profile.full_name.split(' ')[0]}`:''}</h1>
        <p style={{fontSize:13,color:c.sub,margin:0}}>Here's your business at a glance</p>
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        <Stat label="Active Leads" value={leads.length} note={`${hotLeads} hot / ${warmLeads} warm / ${coldLeads} cold`}/>
        <Stat label="Active Deals" value={deals.length} note={`$${(totalCommission/1000).toFixed(1)}K pending`} color={c.green}/>
        <Stat label="Need Attention" value={urgentLeads.length} note="Overdue for contact" color={urgentLeads.length>0?c.red:c.green}/>
      </div>

      {/* Goal */}
      {goal>0&&<div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"16px 20px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontSize:11,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>Annual Goal</span>
          <span style={{fontSize:12,fontWeight:600,color:c.green}}>${(totalCommission/1000).toFixed(1)}K of ${(goal/1000).toFixed(0)}K</span>
        </div>
        <Progress value={totalCommission} max={goal} color={c.green}/>
      </div>}

      {/* Urgent leads */}
      {urgentLeads.length>0&&<div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",marginBottom:20}}>
        <div style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>Needs Your Attention</div>
        {urgentLeads.slice(0,5).map((l,i)=>{
          const days=daysSince(l.last_contact_date)
          const tc=tempColor(l.temperature)
          return(
            <div key={l.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",marginBottom:4,borderRadius:6,background:c.redSoft,border:`1px solid rgba(190,18,60,0.08)`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:c.red,flexShrink:0}}/>
                <span style={{fontSize:12,fontWeight:600,color:c.text}}>{l.name} — {days} days since contact</span>
              </div>
              <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,color:tc.color}}>{l.temperature?.toUpperCase()}</span>
            </div>
          )
        })}
      </div>}

      {/* Recent leads */}
      <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase"}}>Recent Leads</span>
          <a href="/app/leads" style={{fontSize:12,fontWeight:600,color:c.text,textDecoration:"none"}}>View All</a>
        </div>
        {leads.length===0?
          <div style={{padding:"20px 0",textAlign:"center",color:c.dim,fontSize:13}}>No leads yet. <a href="/app/leads" style={{color:c.text,fontWeight:600}}>Add your first lead</a></div>
        :leads.slice(0,5).map((l,i)=>{
          const days=daysSince(l.last_contact_date)
          const tc=tempColor(l.temperature)
          return(
            <div key={l.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:i<4?`1px solid ${c.borderLight}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,borderRadius:6,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:tc.color}}>{l.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{l.name}</div>
                  <div style={{fontSize:11,color:c.dim}}>{l.lead_type} / {l.source} / {l.stage}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,color:tc.color}}>{l.temperature?.toUpperCase()}</span>
                <span style={{fontSize:12,fontWeight:600,color:days>=5?c.red:days>=3?c.amber:c.dim}}>{days===0?"Today":`${days}d`}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent deals */}
      <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase"}}>Active Deals</span>
          <a href="/app/deals" style={{fontSize:12,fontWeight:600,color:c.text,textDecoration:"none"}}>View All</a>
        </div>
        {deals.length===0?
          <div style={{padding:"20px 0",textAlign:"center",color:c.dim,fontSize:13}}>No deals yet. <a href="/app/deals" style={{color:c.text,fontWeight:600}}>Add your first deal</a></div>
        :deals.map((d,i)=>(
          <div key={d.id} style={{padding:"12px 14px",marginBottom:8,borderRadius:6,border:`1px solid ${c.border}`,background:c.bg}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{d.address}</div>
                <div style={{fontSize:11,color:c.dim}}>{d.client_name}{d.close_date?` / Closing ${new Date(d.close_date).toLocaleDateString()}`:''}</div>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:c.green}}>${d.price?.toLocaleString()}</span>
            </div>
            <Progress value={d.progress||0} max={100} color={c.green}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{fontSize:11,color:c.sub}}>{d.stage}</span>
              {d.commission&&<span style={{fontSize:11,color:c.dim}}>Commission: ${d.commission?.toLocaleString()}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
