'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",amberBorder:"rgba(161,98,7,0.15)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",redBorder:"rgba(190,18,60,0.12)",purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)",purpleBorder:"rgba(109,40,217,0.12)"}

const Tag=({children,bg,color,border})=><span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:bg,color,border:border?`1px solid ${border}`:"none"}}>{children}</span>

export default function CopilotPage(){
  const [leads,setLeads]=useState([])
  const [drafts,setDrafts]=useState([])
  const [loading,setLoading]=useState(true)
  const [generating,setGenerating]=useState(false)
  const [approvedIds,setApprovedIds]=useState([])
  const [skippedIds,setSkippedIds]=useState([])
  const [editingId,setEditingId]=useState(null)
  const [editText,setEditText]=useState('')
  const [profile,setProfile]=useState(null)
  const [stats,setStats]=useState({sent:0,approved:0})

  useEffect(()=>{loadData()},[])

  const loadData=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return

    const [leadsRes,profileRes]=await Promise.all([
      supabase.from('leads').select('*').order('last_contact_date',{ascending:true}),
      supabase.from('profiles').select('*').eq('id',user.id).single()
    ])

    const allLeads=(leadsRes.data||[]).map(l=>({
      ...l,
      days_since_contact:Math.floor((new Date()-new Date(l.last_contact_date))/(1000*60*60*24))
    }))

    setLeads(allLeads)
    setProfile(profileRes.data)
    setLoading(false)
  }

  const generateDrafts=async()=>{
    setGenerating(true)
    const needsFollowUp=leads.filter(l=>{
      const d=l.days_since_contact
      return(l.temperature==='hot'&&d>=1)||(l.temperature==='warm'&&d>=3)||(l.temperature==='cold'&&d>=7)
    }).sort((a,b)=>{
      const priority={hot:0,warm:1,cold:2}
      return(priority[a.temperature]||2)-(priority[b.temperature]||2)
    })

    if(needsFollowUp.length===0){
      setDrafts([]);setGenerating(false);return
    }

    try{
      const res=await fetch('/api/copilot',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({leads:needsFollowUp,agentName:profile?.full_name||'Alex'})
      })
      const data=await res.json()
      setDrafts(data.drafts||[])
    }catch(err){
      console.error('Failed to generate',err)
    }
    setGenerating(false)
  }

  const handleApprove=async(draft)=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return

    // Log interaction
    await supabase.from('interactions').insert({
      user_id:user.id,
      lead_id:draft.lead_id,
      interaction_type:draft.channel==='Text'?'text':'email',
      notes:`Copilot draft approved: ${draft.draft}`
    })

    // Update last contact date
    await supabase.from('leads').update({
      last_contact_date:new Date().toISOString(),
      updated_at:new Date().toISOString()
    }).eq('id',draft.lead_id)

    setApprovedIds(p=>[...p,draft.lead_id])
    setStats(p=>({...p,approved:p.approved+1,sent:p.sent+1}))
  }

  const handleSkip=(leadId)=>{
    setSkippedIds(p=>[...p,leadId])
  }

  const handleEdit=(draft)=>{
    setEditingId(draft.lead_id)
    setEditText(draft.draft)
  }

  const handleSaveEdit=(draft)=>{
    setDrafts(p=>p.map(d=>d.lead_id===draft.lead_id?{...d,draft:editText}:d))
    setEditingId(null)
    setEditText('')
  }

  const pendingDrafts=drafts.filter(d=>!approvedIds.includes(d.lead_id)&&!skippedIds.includes(d.lead_id))
  const urgencyStyle={high:{bg:c.redSoft,color:c.red,border:c.redBorder},medium:{bg:c.amberSoft,color:c.amber,border:c.amberBorder},low:{bg:c.borderLight,color:c.dim,border:c.border}}

  if(loading)return <div style={{padding:40,textAlign:"center",color:c.dim}}>Loading...</div>

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.01em",margin:"0 0 4px"}}>AI Copilot</h1>
          <p style={{fontSize:13,color:c.sub,margin:0}}>AI-drafted follow-ups based on your real leads</p>
        </div>
        <button onClick={generateDrafts} disabled={generating||leads.length===0}
          style={{background:c.text,border:"none",borderRadius:8,padding:"10px 22px",fontSize:13,fontWeight:600,color:"#fff",cursor:generating?"wait":"pointer",opacity:generating?0.7:1,fontFamily:"inherit"}}>
          {generating?'Generating...':drafts.length>0?'Regenerate Drafts':'Generate Follow-Ups'}
        </button>
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px"}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Leads Needing Follow-Up</div>
          <div style={{fontSize:22,fontWeight:700,color:leads.filter(l=>(l.temperature==='hot'&&l.days_since_contact>=1)||(l.temperature==='warm'&&l.days_since_contact>=3)||(l.temperature==='cold'&&l.days_since_contact>=7)).length>0?c.red:c.green}}>
            {leads.filter(l=>(l.temperature==='hot'&&l.days_since_contact>=1)||(l.temperature==='warm'&&l.days_since_contact>=3)||(l.temperature==='cold'&&l.days_since_contact>=7)).length}
          </div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px"}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Drafts Pending</div>
          <div style={{fontSize:22,fontWeight:700,color:c.purple}}>{pendingDrafts.length}</div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px"}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Approved This Session</div>
          <div style={{fontSize:22,fontWeight:700,color:c.green}}>{stats.approved}</div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px"}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Total Leads</div>
          <div style={{fontSize:22,fontWeight:700}}>{leads.length}</div>
        </div>
      </div>

      {/* No leads state */}
      {leads.length===0&&(
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"40px",textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Add some leads first</div>
          <div style={{fontSize:13,color:c.sub,marginBottom:16}}>Copilot needs leads to work with. Add your leads in the Leads tab, then come back here.</div>
          <a href="/app/leads" style={{fontSize:13,fontWeight:600,color:c.text,textDecoration:"underline"}}>Go to Leads</a>
        </div>
      )}

      {/* No drafts yet state */}
      {leads.length>0&&drafts.length===0&&!generating&&(
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"40px",textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Ready to generate</div>
          <div style={{fontSize:13,color:c.sub,marginBottom:4}}>Click "Generate Follow-Ups" to have AI draft personalized messages for leads that need attention.</div>
          <div style={{fontSize:12,color:c.dim,marginTop:8}}>Copilot analyzes each lead's temperature, days since contact, source, and notes to write the perfect follow-up.</div>
        </div>
      )}

      {/* Generating state */}
      {generating&&(
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"40px",textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>AI is thinking...</div>
          <div style={{fontSize:13,color:c.sub}}>Analyzing your leads and drafting personalized follow-ups. This takes about 10-15 seconds.</div>
        </div>
      )}

      {/* Draft cards */}
      {pendingDrafts.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>Pending Your Approval</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {pendingDrafts.map((d,i)=>{
              const u=urgencyStyle[d.urgency]||urgencyStyle.low
              const isEditing=editingId===d.lead_id
              return(
                <div key={d.lead_id} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"20px 22px"}}>
                  {/* Header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:14,fontWeight:700}}>{d.lead_name}</span>
                      <Tag bg={u.bg} color={u.color} border={u.border}>{d.urgency}</Tag>
                      <Tag bg={c.purpleSoft} color={c.purple} border={c.purpleBorder}>{d.channel}</Tag>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:11,color:c.dim}}>{d.lead_type} / {d.source} / {d.stage}</span>
                      <span style={{fontSize:11,fontWeight:600,color:d.days_since_contact>=5?c.red:d.days_since_contact>=3?c.amber:c.dim}}>{d.days_since_contact}d since contact</span>
                    </div>
                  </div>

                  {/* Draft message */}
                  <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"14px 16px",marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Draft Message</div>
                    {isEditing?(
                      <div>
                        <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={3}
                          style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.white,outline:"none",fontFamily:"inherit",resize:"vertical",lineHeight:1.7,boxSizing:"border-box"}}/>
                        <div style={{display:"flex",gap:6,marginTop:8}}>
                          <button onClick={()=>handleSaveEdit(d)} style={{background:c.text,border:"none",borderRadius:4,padding:"6px 14px",fontSize:11,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Save Edit</button>
                          <button onClick={()=>setEditingId(null)} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:4,padding:"6px 14px",fontSize:11,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                        </div>
                      </div>
                    ):(
                      <div style={{fontSize:13,color:c.text,lineHeight:1.7}}>{d.draft}</div>
                    )}
                  </div>

                  {/* AI reasoning */}
                  <div style={{background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:6,padding:"12px 14px",marginBottom:14}}>
                    <div style={{fontSize:10,fontWeight:600,color:c.purple,marginBottom:3}}>Why This Message, Why Now</div>
                    <div style={{fontSize:12,color:c.sub,lineHeight:1.6}}>{d.reason}</div>
                  </div>

                  {/* Actions */}
                  {!isEditing&&(
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>handleApprove(d)}
                        style={{background:c.green,border:"none",borderRadius:6,padding:"8px 20px",fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                        Approve & Log
                      </button>
                      <button onClick={()=>handleEdit(d)}
                        style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"8px 20px",fontSize:12,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>
                        Edit
                      </button>
                      <button onClick={()=>handleSkip(d.lead_id)}
                        style={{background:"transparent",border:`1px solid ${c.border}`,borderRadius:6,padding:"8px 20px",fontSize:12,fontWeight:500,color:c.dim,cursor:"pointer",fontFamily:"inherit"}}>
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All approved state */}
      {drafts.length>0&&pendingDrafts.length===0&&!generating&&(
        <div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"24px",textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:600,color:c.green,marginBottom:4}}>All caught up</div>
          <div style={{fontSize:13,color:c.sub}}>You've reviewed all drafts. Approved messages have been logged to each lead's history. Click "Regenerate Drafts" to check for new follow-ups.</div>
        </div>
      )}

      {/* Approved log */}
      {approvedIds.length>0&&(
        <div style={{marginTop:20}}>
          <div style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>Approved This Session</div>
          {drafts.filter(d=>approvedIds.includes(d.lead_id)).map((d,i)=>(
            <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 16px",marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,fontWeight:600}}>{d.lead_name}</span>
                  <Tag bg={c.greenSoft} color={c.green} border={c.greenBorder}>Approved</Tag>
                  <Tag bg={c.purpleSoft} color={c.purple} border={c.purpleBorder}>{d.channel}</Tag>
                </div>
                <span style={{fontSize:11,color:c.dim}}>Contact logged</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
