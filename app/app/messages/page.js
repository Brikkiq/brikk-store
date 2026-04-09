'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)",purpleBorder:"rgba(109,40,217,0.12)",accent:"#4338CA",accentSoft:"rgba(67,56,202,0.05)"}

const Tag=({children,bg,color,border})=><span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:bg,color,border:border?`1px solid ${border}`:"none"}}>{children}</span>

export default function MessagesPage(){
  const [leads,setLeads]=useState([])
  const [messages,setMessages]=useState([])
  const [selectedLead,setSelectedLead]=useState(null)
  const [draft,setDraft]=useState('')
  const [loading,setLoading]=useState(true)
  const [generating,setGenerating]=useState(false)
  const [sending,setSending]=useState(false)
  const [searchTerm,setSearchTerm]=useState('')
  const [profile,setProfile]=useState(null)
  const [toast,setToast]=useState(null)
  const messagesEndRef=useRef(null)

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(null),3000)}

  useEffect(()=>{loadData()},[])
  useEffect(()=>{if(selectedLead)loadMessages(selectedLead.id)},[selectedLead])
  useEffect(()=>{messagesEndRef.current?.scrollIntoView({behavior:'smooth'})},[messages])

  const loadData=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return
    const [leadsRes,profileRes]=await Promise.all([
      supabase.from('leads').select('*').order('last_contact_date',{ascending:false}),
      supabase.from('profiles').select('*').eq('id',user.id).single()
    ])
    setLeads(leadsRes.data||[])
    setProfile(profileRes.data)
    setLoading(false)
  }

  const loadMessages=async(leadId)=>{
    const {data}=await supabase.from('messages').select('*').eq('lead_id',leadId).order('created_at',{ascending:true})
    setMessages(data||[])
  }

  const daysSince=(date)=>{
    if(!date)return 999
    return Math.floor((new Date()-new Date(date))/(1000*60*60*24))
  }

  const tempColor=(t)=>({hot:{bg:c.redSoft,color:c.red},warm:{bg:c.amberSoft,color:c.amber},cold:{bg:c.borderLight,color:c.dim}}[t]||{bg:c.bg,color:c.dim})

  const handleSend=async()=>{
    if(!draft.trim()||!selectedLead)return
    setSending(true)
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setSending(false);return}

    let smsStatus='logged'
    let smsError=null

    // Send real SMS if lead has a phone number
    if(selectedLead.phone){
      try{
        const smsRes=await fetch('/api/sms',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({to:selectedLead.phone,message:draft.trim(),leadName:selectedLead.name})
        })
        const smsData=await smsRes.json()
        if(smsData.success){
          smsStatus='sent'
        }else{
          smsStatus='failed'
          smsError=smsData.error
          console.error('SMS error:',smsData.error)
        }
      }catch(err){
        smsStatus='failed'
        smsError=err.message
        console.error('SMS send failed:',err)
      }
    }

    // Save message to database
    await supabase.from('messages').insert({
      user_id:user.id,
      lead_id:selectedLead.id,
      direction:'outbound',
      channel:'text',
      content:draft.trim(),
      status:smsStatus
    })

    // Update lead last contact
    await supabase.from('leads').update({
      last_contact_date:new Date().toISOString(),
      updated_at:new Date().toISOString()
    }).eq('id',selectedLead.id)

    // Log interaction
    await supabase.from('interactions').insert({
      user_id:user.id,
      lead_id:selectedLead.id,
      interaction_type:'text',
      notes:`${smsStatus==='sent'?'SMS sent':'Message logged'}: ${draft.trim()}`
    })

    if(smsError){
      alert(`Message saved but SMS delivery failed: ${smsError}. Make sure the phone number is correct.`)
    }

    setDraft('')
    setSending(false)
    showToast('Message sent')
    if(window.brikk?.haptic)window.brikk.haptic('success')
    loadMessages(selectedLead.id)
    loadData()
  }

  const handleAIDraft=async()=>{
    if(!selectedLead)return
    setGenerating(true)
    const days=daysSince(selectedLead.last_contact_date)

    try{
      const res=await fetch('/api/copilot',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          leads:[{...selectedLead,days_since_contact:days}],
          agentName:profile?.full_name||'Alex'
        })
      })
      const data=await res.json()
      if(data.drafts&&data.drafts.length>0&&data.drafts[0].draft){
        setDraft(data.drafts[0].draft)
      }
    }catch(err){
      console.error('AI draft error',err)
    }
    setGenerating(false)
  }

  const formatTime=(date)=>{
    const d=new Date(date)
    const now=new Date()
    const diffDays=Math.floor((now-d)/(1000*60*60*24))
    if(diffDays===0)return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})
    if(diffDays===1)return 'Yesterday'
    if(diffDays<7)return d.toLocaleDateString('en-US',{weekday:'short'})
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
  }

  const filteredLeads=searchTerm?leads.filter(l=>l.name?.toLowerCase().includes(searchTerm.toLowerCase())):leads

  // Get last message per lead for preview
  const getLastMessage=(leadId)=>{
    const leadMsgs=messages.filter?messages:[]
    return null
  }

  if(loading)return <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:c.text,animation:"pulse 1.2s ease-in-out infinite"}}>Loading messages...</div><style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style></div>

  // On mobile: show lead list OR conversation, not both
  const showConversation=selectedLead!==null

  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)"}}>
      {toast&&<div className="toast" style={{position:"fixed",top:80,right:20,zIndex:200,background:"rgba(22,128,60,0.06)",border:"1px solid rgba(22,128,60,0.15)",borderRadius:8,padding:"12px 20px",fontSize:13,fontWeight:600,color:"#16803C",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>{toast}</div>}
      <div style={{marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.01em",margin:"0 0 4px"}}>Messages</h1>
          <p style={{fontSize:13,color:c.sub,margin:0}}>Message your leads — AI drafts included</p>
        </div>
        {showConversation&&<button onClick={()=>setSelectedLead(null)} className="show-mobile" style={{display:"none",background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Back</button>}
      </div>

      <div style={{flex:1,display:"flex",gap:14,minHeight:0}}>
        {/* Lead list sidebar — hidden on mobile when conversation is open */}
        <div className={showConversation?"hide-mobile":""} style={{flex:"0 0 280px",background:c.white,border:`1px solid ${c.border}`,borderRadius:8,display:"flex",flexDirection:"column",overflow:"hidden",maxWidth:"100%"}}>
          {/* Search */}
          <div style={{padding:"12px",borderBottom:`1px solid ${c.border}`}}>
            <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search leads..."
              style={{width:"100%",padding:"8px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          {/* Lead list */}
          <div style={{flex:1,overflowY:"auto"}}>
            {filteredLeads.length===0?(
              <div style={{padding:20,textAlign:"center",color:c.dim,fontSize:13}}>No leads found</div>
            ):filteredLeads.map((l,i)=>{
              const tc=tempColor(l.temperature)
              const days=daysSince(l.last_contact_date)
              const isSelected=selectedLead?.id===l.id
              return(
                <div key={l.id} onClick={()=>{setSelectedLead(l);setDraft('')}}
                  style={{padding:"12px 14px",borderBottom:`1px solid ${c.borderLight}`,cursor:"pointer",background:isSelected?c.bg:"transparent",transition:"background 0.1s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:32,height:32,borderRadius:6,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:tc.color,flexShrink:0}}>
                      {l.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</span>
                        <span style={{fontSize:10,color:days>=5?c.red:days>=3?c.amber:c.dim,fontWeight:600,flexShrink:0}}>{days===0?"Today":`${days}d`}</span>
                      </div>
                      <div style={{fontSize:11,color:c.dim,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.lead_type} / {l.source}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Conversation area */}
        <div className={!showConversation?"hide-mobile":""} style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          {!selectedLead?(
            <div style={{flex:1,background:c.white,border:`1px solid ${c.border}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{textAlign:"center",padding:20}}>
                <div style={{fontSize:16,fontWeight:600,color:c.text,marginBottom:8}}>Select a lead</div>
                <div style={{fontSize:13,color:c.dim}}>Choose a lead from the list to start a conversation</div>
              </div>
            </div>
          ):(
            <>
              {/* Conversation header */}
              <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:"8px 8px 0 0",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:36,height:36,borderRadius:8,background:tempColor(selectedLead.temperature).bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:tempColor(selectedLead.temperature).color}}>
                    {selectedLead.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <div style={{fontSize:15,fontWeight:700}}>{selectedLead.name}</div>
                    <div style={{fontSize:11,color:c.dim}}>{selectedLead.phone||'No phone'} {selectedLead.lead_type} / {selectedLead.source} / {selectedLead.stage}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <Tag bg={tempColor(selectedLead.temperature).bg} color={tempColor(selectedLead.temperature).color}>{selectedLead.temperature?.toUpperCase()}</Tag>
                  {selectedLead.price_range&&<Tag bg={c.bg} color={c.sub} border={c.border}>{selectedLead.price_range}</Tag>}
                </div>
              </div>

              {/* Messages area */}
              <div style={{flex:1,background:c.bg,borderLeft:`1px solid ${c.border}`,borderRight:`1px solid ${c.border}`,padding:"16px 18px",overflowY:"auto",minHeight:200}}>
                {messages.length===0?(
                  <div style={{textAlign:"center",padding:"40px 20px"}}>
                    <div style={{fontSize:14,color:c.sub,marginBottom:8}}>No messages yet</div>
                    <div style={{fontSize:12,color:c.dim}}>Type a message below or let AI draft one for you</div>
                  </div>
                ):messages.map((m,i)=>(
                  <div key={m.id} style={{display:"flex",justifyContent:m.direction==='outbound'?"flex-end":"flex-start",marginBottom:10}}>
                    <div style={{maxWidth:"75%",padding:"10px 14px",borderRadius:m.direction==='outbound'?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.direction==='outbound'?c.text:c.white,color:m.direction==='outbound'?"#fff":c.text,border:m.direction==='outbound'?"none":`1px solid ${c.border}`}}>
                      <div style={{fontSize:13,lineHeight:1.6}}>{m.content}</div>
                      <div style={{fontSize:10,color:m.direction==='outbound'?"rgba(255,255,255,0.5)":c.dim,marginTop:4,display:"flex",justifyContent:"space-between",gap:12}}>
                        <span>{formatTime(m.created_at)}</span>
                        {m.status&&<span style={{color:m.status==='failed'?'#EF4444':undefined}}>{m.status==='sent'?'✓ Sent via SMS':m.status==='received'?'Received':m.status==='failed'?'Failed':m.status==='logged'?'Logged (no phone)':m.status}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef}/>
              </div>

              {/* Compose area */}
              <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:"0 0 8px 8px",padding:"14px 16px"}}>
                {/* AI draft button */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <button onClick={handleAIDraft} disabled={generating}
                    style={{background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:6,padding:"6px 14px",fontSize:11,fontWeight:600,color:c.purple,cursor:generating?"wait":"pointer",fontFamily:"inherit",opacity:generating?0.6:1}}>
                    {generating?'AI is writing...':'Draft with AI Copilot'}
                  </button>
                  {selectedLead.notes&&(
                    <span style={{fontSize:10,color:c.dim,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Notes: {selectedLead.notes}</span>
                  )}
                </div>

                {/* Text input */}
                <div style={{display:"flex",gap:8}}>
                  <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder={`Message ${selectedLead.name}...`}
                    rows={2}
                    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}}}
                    style={{flex:1,padding:"10px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",resize:"none",lineHeight:1.5,boxSizing:"border-box"}}/>
                  <button onClick={handleSend} disabled={!draft.trim()||sending}
                    style={{background:draft.trim()?c.text:c.borderLight,border:"none",borderRadius:8,padding:"0 20px",fontSize:13,fontWeight:600,color:draft.trim()?"#fff":c.dim,cursor:draft.trim()&&!sending?"pointer":"default",fontFamily:"inherit",flexShrink:0,alignSelf:"flex-end",height:42}}>
                    {sending?'...':'Send'}
                  </button>
                </div>
                <div style={{fontSize:10,color:c.dim,marginTop:6}}>Press Enter to send{selectedLead.phone?' as real SMS to '+selectedLead.phone:''}. Shift+Enter for new line.</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
