'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",amberBorder:"rgba(161,98,7,0.15)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",redBorder:"rgba(190,18,60,0.12)",purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)",purpleBorder:"rgba(109,40,217,0.12)",accent:"#4338CA",accentSoft:"rgba(67,56,202,0.05)",accentBorder:"rgba(67,56,202,0.12)"}

const Tag=({children,bg,color,border})=><span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:bg,color,border:border?`1px solid ${border}`:"none"}}>{children}</span>

export default function CalendarPage(){
  const [leads,setLeads]=useState([])
  const [deals,setDeals]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{loadData()},[])

  const loadData=async()=>{
    const [leadsRes,dealsRes]=await Promise.all([
      supabase.from('leads').select('*').order('last_contact_date',{ascending:true}),
      supabase.from('deals').select('*').order('close_date',{ascending:true})
    ])
    setLeads(leadsRes.data||[])
    setDeals(dealsRes.data||[])
    setLoading(false)
  }

  const daysSince=(date)=>{
    if(!date)return 999
    return Math.floor((new Date()-new Date(date))/(1000*60*60*24))
  }

  const daysUntil=(date)=>{
    if(!date)return null
    return Math.ceil((new Date(date)-new Date())/(1000*60*60*24))
  }

  const formatDate=(date)=>{
    if(!date)return''
    const d=new Date(date)
    return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})
  }

  const today=new Date()
  const todayStr=today.toISOString().split('T')[0]

  // Generate calendar events from real data
  const events=[]

  // From leads: follow-up reminders
  leads.forEach(l=>{
    const days=daysSince(l.last_contact_date)
    const needsFollowUp=(l.temperature==='hot'&&days>=1)||(l.temperature==='warm'&&days>=3)||(l.temperature==='cold'&&days>=7)
    
    if(needsFollowUp){
      let aiContext=''
      if(l.temperature==='hot'&&days>=3) aiContext=`URGENT: ${days} days without contact on a hot lead. Every day increases the chance they choose another agent.`
      else if(l.temperature==='hot') aiContext=`Hot lead — ${days} day since contact. Quick follow-up keeps momentum.`
      else if(l.temperature==='warm'&&days>=7) aiContext=`Going cold — ${days} days without contact. Consider a value-add touchpoint like a market update.`
      else if(l.temperature==='warm') aiContext=`${days} days since contact. A brief check-in keeps you top of mind.`
      else aiContext=`${days} days since contact. Consider a re-engagement message or move to nurture sequence.`

      if(l.notes) aiContext+=` Notes: ${l.notes}`

      events.push({
        date:todayStr,
        dateLabel:'Today',
        time:'Follow up',
        label:`Follow up: ${l.name}`,
        detail:`${l.lead_type||'Lead'} / ${l.source||'Unknown'} / ${l.stage||'New Lead'}${l.price_range?' / '+l.price_range:''}`,
        type:'followup',
        color:l.temperature==='hot'?c.red:l.temperature==='warm'?c.amber:c.dim,
        colorSoft:l.temperature==='hot'?c.redSoft:l.temperature==='warm'?c.amberSoft:c.borderLight,
        colorBorder:l.temperature==='hot'?c.redBorder:l.temperature==='warm'?c.amberBorder:c.border,
        urgency:l.temperature==='hot'?'high':l.temperature==='warm'?'medium':'low',
        ai:aiContext,
        daysSince:days,
      })
    }
  })

  // From deals: closing dates and milestones
  deals.forEach(d=>{
    if(d.close_date){
      const dLeft=daysUntil(d.close_date)
      if(dLeft!==null&&dLeft>=-7){
        let aiContext=''
        if(dLeft<=0) aiContext='Closing day has arrived or passed. Confirm all documents are signed and funds are ready to transfer.'
        else if(dLeft<=3) aiContext=`Only ${dLeft} days to close. Confirm lender has clear-to-close, title work is complete, and final walkthrough is scheduled.`
        else if(dLeft<=7) aiContext=`${dLeft} days to close. Check lender status, confirm all contingencies are cleared, schedule final walkthrough.`
        else if(dLeft<=14) aiContext=`${dLeft} days to close. Verify appraisal is complete, lender is on track, and all documents are submitted.`
        else aiContext=`${dLeft} days to close. Deal is progressing — monitor for any delays.`

        if(d.notes) aiContext+=` Notes: ${d.notes}`

        events.push({
          date:d.close_date,
          dateLabel:dLeft===0?'Today':dLeft===1?'Tomorrow':dLeft<0?`${Math.abs(dLeft)}d overdue`:formatDate(d.close_date),
          time:dLeft<=0?'NOW':`${dLeft} days`,
          label:`Closing: ${d.address}`,
          detail:`${d.client_name||''}${d.price?' / $'+d.price.toLocaleString():''}${d.commission?' / Commission: $'+d.commission.toLocaleString():''}`,
          type:'closing',
          color:dLeft<=3?c.red:dLeft<=7?c.amber:c.green,
          colorSoft:dLeft<=3?c.redSoft:dLeft<=7?c.amberSoft:c.greenSoft,
          colorBorder:dLeft<=3?c.redBorder:dLeft<=7?c.amberBorder:c.greenBorder,
          urgency:dLeft<=3?'high':dLeft<=7?'medium':'low',
          ai:aiContext,
          daysLeft:dLeft,
        })

        // Add milestone reminders based on stage
        if(d.stage==='Contract'&&dLeft>14){
          events.push({
            date:todayStr,
            dateLabel:'Upcoming',
            time:'This week',
            label:`Schedule inspection: ${d.address}`,
            detail:`Deal is in Contract stage. Inspection should be scheduled within the first week.`,
            type:'milestone',
            color:c.accent,
            colorSoft:c.accentSoft,
            colorBorder:c.accentBorder,
            urgency:'medium',
            ai:`Inspection period typically begins immediately after contract. Schedule within 5-7 business days to avoid deadline pressure.${d.notes?' Notes: '+d.notes:''}`,
          })
        }
        if(d.stage==='Inspection'&&dLeft>10){
          events.push({
            date:todayStr,
            dateLabel:'Upcoming',
            time:'Soon',
            label:`Appraisal pending: ${d.address}`,
            detail:`Inspection complete. Appraisal should be ordered by lender.`,
            type:'milestone',
            color:c.accent,
            colorSoft:c.accentSoft,
            colorBorder:c.accentBorder,
            urgency:'medium',
            ai:'Confirm with lender that appraisal has been ordered. Typical turnaround is 5-10 business days. Delays here push the whole timeline.',
          })
        }
      }
    }
  })

  // Sort: today first, then by urgency, then by date
  events.sort((a,b)=>{
    const urgencyOrder={high:0,medium:1,low:2}
    if(a.dateLabel==='Today'&&b.dateLabel!=='Today')return -1
    if(b.dateLabel==='Today'&&a.dateLabel!=='Today')return 1
    return(urgencyOrder[a.urgency]||2)-(urgencyOrder[b.urgency]||2)
  })

  const todayEvents=events.filter(e=>e.dateLabel==='Today'||e.dateLabel==='NOW')
  const upcomingEvents=events.filter(e=>e.dateLabel!=='Today'&&e.dateLabel!=='NOW')
  const typeLabels={followup:'Follow Up',closing:'Closing',milestone:'Milestone'}

  if(loading)return <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:c.text,animation:"pulse 1.2s ease-in-out infinite"}}>Loading calendar...</div><style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style></div>

  return(
    <div>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.01em",margin:"0 0 4px"}}>Smart Calendar</h1>
        <p style={{fontSize:13,color:c.sub,margin:0}}>Auto-generated from your leads and deals</p>
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px",minWidth:140}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Today</div>
          <div style={{fontSize:22,fontWeight:700,color:todayEvents.length>0?c.red:c.green}}>{todayEvents.length}</div>
          <div style={{fontSize:11,color:c.sub,marginTop:4}}>events needing action</div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px",minWidth:140}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Upcoming Closings</div>
          <div style={{fontSize:22,fontWeight:700,color:c.green}}>{deals.filter(d=>d.close_date&&daysUntil(d.close_date)>0).length}</div>
          <div style={{fontSize:11,color:c.sub,marginTop:4}}>deals approaching close</div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px",minWidth:140}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Overdue Follow-Ups</div>
          <div style={{fontSize:22,fontWeight:700,color:leads.filter(l=>(l.temperature==='hot'&&daysSince(l.last_contact_date)>=3)).length>0?c.red:c.green}}>
            {leads.filter(l=>(l.temperature==='hot'&&daysSince(l.last_contact_date)>=3)||(l.temperature==='warm'&&daysSince(l.last_contact_date)>=7)).length}
          </div>
          <div style={{fontSize:11,color:c.sub,marginTop:4}}>leads going cold</div>
        </div>
      </div>

      {/* No events */}
      {events.length===0&&(
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"40px",textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Calendar is clear</div>
          <div style={{fontSize:13,color:c.sub}}>Add leads and deals to see your calendar auto-populate with follow-ups, deadlines, and milestones.</div>
        </div>
      )}

      {/* Today's events */}
      {todayEvents.length>0&&(
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>Today</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {todayEvents.map((e,i)=>(
              <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{width:4,height:36,borderRadius:2,background:e.color,flexShrink:0,marginTop:2}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,flexWrap:"wrap",gap:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:14,fontWeight:600}}>{e.label}</span>
                        <Tag bg={e.colorSoft} color={e.color} border={e.colorBorder}>{typeLabels[e.type]||e.type}</Tag>
                      </div>
                      <span style={{fontSize:11,color:c.dim}}>{e.time}</span>
                    </div>
                    {e.detail&&<div style={{fontSize:12,color:c.sub,marginBottom:8}}>{e.detail}</div>}
                    {e.ai&&(
                      <div style={{background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:6,padding:"10px 12px"}}>
                        <div style={{fontSize:9,fontWeight:600,color:c.purple,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:3}}>AI Context</div>
                        <div style={{fontSize:12,color:c.sub,lineHeight:1.6}}>{e.ai}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>Upcoming</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {upcomingEvents.map((e,i)=>(
              <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"16px 18px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{width:4,height:36,borderRadius:2,background:e.color,flexShrink:0,marginTop:2}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,flexWrap:"wrap",gap:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:14,fontWeight:600}}>{e.label}</span>
                        <Tag bg={e.colorSoft} color={e.color} border={e.colorBorder}>{typeLabels[e.type]||e.type}</Tag>
                      </div>
                      <span style={{fontSize:12,fontWeight:600,color:e.urgency==='high'?c.red:e.urgency==='medium'?c.amber:c.dim}}>{e.dateLabel}</span>
                    </div>
                    {e.detail&&<div style={{fontSize:12,color:c.sub,marginBottom:8}}>{e.detail}</div>}
                    {e.ai&&(
                      <div style={{background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:6,padding:"10px 12px"}}>
                        <div style={{fontSize:9,fontWeight:600,color:c.purple,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:3}}>AI Context</div>
                        <div style={{fontSize:12,color:c.sub,lineHeight:1.6}}>{e.ai}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI summary */}
      {events.length>0&&(
        <div style={{background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:8,padding:"16px 18px",marginTop:20}}>
          <div style={{fontSize:10,fontWeight:600,color:c.purple,marginBottom:4}}>Calendar Intelligence</div>
          <div style={{fontSize:13,color:c.sub,lineHeight:1.6}}>
            You have {todayEvents.length} item{todayEvents.length!==1?'s':''} needing attention today
            {deals.filter(d=>d.close_date&&daysUntil(d.close_date)>0&&daysUntil(d.close_date)<=7).length>0?
              ` and ${deals.filter(d=>d.close_date&&daysUntil(d.close_date)>0&&daysUntil(d.close_date)<=7).length} deal${deals.filter(d=>d.close_date&&daysUntil(d.close_date)>0&&daysUntil(d.close_date)<=7).length!==1?'s':''} closing within 7 days`:''
            }. 
            {leads.filter(l=>l.temperature==='hot'&&daysSince(l.last_contact_date)>=3).length>0?
              ` Warning: ${leads.filter(l=>l.temperature==='hot'&&daysSince(l.last_contact_date)>=3).length} hot lead${leads.filter(l=>l.temperature==='hot'&&daysSince(l.last_contact_date)>=3).length!==1?'s':''} haven't been contacted in 3+ days.`
              :' All hot leads are up to date.'
            }
          </div>
        </div>
      )}
    </div>
  )
}
