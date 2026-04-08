'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)"}

export default function ReferPage(){
  const [agents,setAgents]=useState([])
  const [loading,setLoading]=useState(true)
  const [submitted,setSubmitted]=useState(false)
  const [error,setError]=useState(null)
  const [form,setForm]=useState({name:'',phone:'',email:'',type:'Buyer',price:'',notes:'',agent_id:''})

  useEffect(()=>{
    loadAgents()
    // Check URL for agent param
    if(typeof window!=='undefined'){
      const params=new URLSearchParams(window.location.search)
      const agentId=params.get('agent')
      if(agentId)setForm(f=>({...f,agent_id:agentId}))
    }
  },[])

  const loadAgents=async()=>{
    const {data}=await supabase.from('profiles').select('id,full_name,email,brokerage')
    setAgents(data||[])
    setLoading(false)
  }

  const handleSubmit=async()=>{
    if(!form.name||!form.phone){setError('Please enter your name and phone number.');return}
    
    let agentId=form.agent_id
    
    // If no agent specified, use first agent (for single-agent setup)
    if(!agentId&&agents.length>0){
      agentId=agents[0].id
    }

    if(!agentId){setError('No agent found. Please contact us directly.');return}

    setError(null)

    const {error:insertError}=await supabase.from('leads').insert({
      user_id:agentId,
      name:form.name,
      phone:form.phone,
      email:form.email||null,
      source:'Referral Link',
      temperature:'warm',
      stage:'New Lead',
      lead_type:form.type,
      price_range:form.price||null,
      notes:form.notes?`[Submitted via referral link] ${form.notes}`:'[Submitted via referral link]',
      last_contact_date:new Date().toISOString()
    })

    if(insertError){
      console.error('Submit error:',insertError)
      setError('Something went wrong. Please try again or call directly.')
    }else{
      setSubmitted(true)
    }
  }

  const agent=form.agent_id?agents.find(a=>a.id===form.agent_id):agents[0]

  if(loading)return(
    <div style={{background:c.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Instrument Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{fontSize:14,color:c.dim}}>Loading...</div>
    </div>
  )

  if(submitted)return(
    <div style={{background:c.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Instrument Sans',-apple-system,sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:440,width:"100%",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:c.greenSoft,border:`2px solid ${c.green}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24}}>
          ✓
        </div>
        <h1 style={{fontSize:24,fontWeight:700,margin:"0 0 12px"}}>Thanks, {form.name.split(' ')[0]}!</h1>
        <p style={{fontSize:15,color:c.sub,lineHeight:1.7,margin:"0 0 8px"}}>
          {agent?.full_name||'Your agent'} has received your information and will be in touch shortly.
        </p>
        <p style={{fontSize:13,color:c.dim}}>
          You can expect a call or text within 24 hours.
        </p>
        {agent?.brokerage&&<p style={{fontSize:12,color:c.dim,marginTop:20}}>{agent.brokerage}</p>}
      </div>
    </div>
  )

  return(
    <div style={{background:c.bg,minHeight:"100vh",fontFamily:"'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      
      <div style={{maxWidth:480,margin:"40px auto"}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:32}}>
          {agent?.full_name&&(
            <div style={{width:56,height:56,borderRadius:"50%",background:c.text,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:18,fontWeight:700,color:"#fff"}}>
              {agent.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
          )}
          <h1 style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>
            {agent?.full_name?`Work with ${agent.full_name}`:'Get Started'}
          </h1>
          <p style={{fontSize:14,color:c.sub,margin:0,lineHeight:1.6}}>
            {agent?.brokerage?`${agent.brokerage} — `:''}Tell me about what you're looking for and I'll be in touch within 24 hours.
          </p>
        </div>

        {/* Form */}
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"28px 24px"}}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Your Name *</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Sarah Mitchell"
              style={{width:"100%",padding:"12px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>

          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Phone Number *</label>
            <input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(801) 555-0142"
              style={{width:"100%",padding:"12px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>

          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Email</label>
            <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="sarah@email.com"
              style={{width:"100%",padding:"12px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>

          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>I'm looking to...</label>
            <div style={{display:"flex",gap:8}}>
              {['Buyer','Seller','Both'].map(t=>(
                <button key={t} onClick={()=>setForm({...form,type:t})}
                  style={{flex:1,padding:"10px",borderRadius:8,border:`1px solid ${form.type===t?c.text:c.border}`,background:form.type===t?c.text:"transparent",color:form.type===t?"#fff":c.sub,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  {t==='Buyer'?'Buy':t==='Seller'?'Sell':'Both'}
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Price Range</label>
            <input value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="$300K - $450K"
              style={{width:"100%",padding:"12px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>

          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Anything else I should know?</label>
            <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Looking for 3+ bedrooms near downtown, pre-approved, need to move by August..." rows={3}
              style={{width:"100%",padding:"12px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
          </div>

          {error&&<div style={{background:c.redSoft,borderRadius:6,padding:"10px 14px",marginBottom:16,fontSize:13,color:c.red}}>{error}</div>}

          <button onClick={handleSubmit}
            style={{width:"100%",background:c.text,border:"none",borderRadius:8,padding:"14px 0",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
            Submit
          </button>

          <p style={{fontSize:11,color:c.dim,textAlign:"center",marginTop:12}}>
            Your information is private and only shared with {agent?.full_name||'your agent'}.
          </p>
        </div>

        {/* Powered by */}
        <div style={{textAlign:"center",marginTop:24}}>
          <span style={{fontSize:11,color:c.dim}}>Powered by </span>
          <a href="/" style={{fontSize:11,fontWeight:600,color:c.text}}>Brikk</a>
        </div>
      </div>
    </div>
  )
}
