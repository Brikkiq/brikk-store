'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",amberBorder:"rgba(161,98,7,0.15)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",redBorder:"rgba(190,18,60,0.12)",purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)",purpleBorder:"rgba(109,40,217,0.12)",accent:"#4338CA"}

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
  const [completedActions,setCompletedActions]=useState([])
  const [recording,setRecording]=useState(false)
  const [transcript,setTranscript]=useState('')
  const [voiceProcessing,setVoiceProcessing]=useState(false)
  const [voiceResult,setVoiceResult]=useState(null)
  const [showVoice,setShowVoice]=useState(false)

  useEffect(()=>{loadData()},[])

  const loadData=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return
    const [leadsRes,dealsRes,profileRes]=await Promise.all([
      supabase.from('leads').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
      supabase.from('deals').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
      supabase.from('profiles').select('*').eq('id',user.id).single()
    ])
    setLeads(leadsRes.data||[])
    setDeals(dealsRes.data||[])
    setProfile(profileRes.data)
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

  const handleLogContact=async(leadId)=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return
    await supabase.from('leads').update({last_contact_date:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',leadId)
    await supabase.from('interactions').insert({user_id:user.id,lead_id:leadId,interaction_type:'contact',notes:'Quick action: logged contact'})
    setCompletedActions(p=>[...p,`lead-${leadId}`])
    loadData()
  }

  const markDone=(actionId)=>{
    setCompletedActions(p=>[...p,actionId])
  }

  // Voice-to-CRM
  const startRecording=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SR){alert('Voice not supported in this browser');return}
    const recognition=new SR()
    recognition.continuous=true
    recognition.interimResults=true
    recognition.lang='en-US'
    let final=''
    recognition.onresult=(e)=>{
      let interim=''
      for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal)final+=e.results[i][0].transcript+' '
        else interim+=e.results[i][0].transcript
      }
      setTranscript(final+interim)
    }
    recognition.onerror=(e)=>{console.error('Speech error:',e.error);setRecording(false)}
    recognition.onend=()=>{if(recording)recognition.start()}
    recognition.start()
    setRecording(true)
    setShowVoice(true)
    setTranscript('')
    setVoiceResult(null)
    window._brikk_recognition=recognition
    if(window.brikk?.haptic)window.brikk.haptic('medium')
  }

  const stopRecording=async()=>{
    if(window._brikk_recognition){window._brikk_recognition.onend=null;window._brikk_recognition.stop()}
    setRecording(false)
    if(window.brikk?.haptic)window.brikk.haptic('success')
    if(!transcript.trim())return
    setVoiceProcessing(true)
    try{
      const res=await fetch('/api/copilot',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mode:'voice_extract',transcript:transcript.trim()})
      })
      const data=await res.json()
      if(data.extraction)setVoiceResult(data.extraction)
      else setVoiceResult({raw:transcript.trim(),note:'Could not extract structured data — saved as note.'})
    }catch(err){
      setVoiceResult({raw:transcript.trim(),note:'AI unavailable — saved as raw note.'})
    }
    setVoiceProcessing(false)
  }

  const saveVoiceNote=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return

    // Try to match lead by name from the extraction
    const matchName=voiceResult?.lead_name||voiceResult?.new_lead_name||null
    let matchedLead=null

    if(matchName){
      // Fuzzy match — find lead whose name contains the extracted name or vice versa
      const searchName=matchName.toLowerCase().trim()
      matchedLead=leads.find(l=>{
        const ln=l.name?.toLowerCase()||''
        return ln.includes(searchName)||searchName.includes(ln)||
          ln.split(' ')[0]===searchName.split(' ')[0] // First name match
      })
    }

    if(matchedLead){
      // Update existing lead
      const updateData={last_contact_date:new Date().toISOString(),updated_at:new Date().toISOString()}

      // Append to notes instead of replacing
      const existingNotes=matchedLead.notes||''
      const newNote=voiceResult?.notes||voiceResult?.raw||transcript
      updateData.notes=existingNotes?`${existingNotes}\n\n[Voice ${new Date().toLocaleDateString()}] ${newNote}`:`[Voice ${new Date().toLocaleDateString()}] ${newNote}`

      // Update specific fields if AI extracted them
      if(voiceResult?.price&&!matchedLead.price_range)updateData.price_range=voiceResult.price
      if(voiceResult?.stage)updateData.stage=voiceResult.stage
      if(voiceResult?.temperature)updateData.temperature=voiceResult.temperature

      await supabase.from('leads').update(updateData).eq('id',matchedLead.id)

      // Log interaction
      await supabase.from('interactions').insert({
        user_id:user.id,
        lead_id:matchedLead.id,
        interaction_type:'voice_note',
        notes:newNote
      })

      setVoiceResult(prev=>({...prev,saved:true,savedTo:matchedLead.name}))
    }else if(matchName){
      // Create new lead from voice
      await supabase.from('leads').insert({
        user_id:user.id,
        name:matchName,
        phone:voiceResult?.phone||'',
        notes:`[Voice ${new Date().toLocaleDateString()}] ${voiceResult?.notes||voiceResult?.raw||transcript}`,
        source:'Voice Note',
        temperature:voiceResult?.temperature||'warm',
        stage:voiceResult?.stage||'New Lead',
        lead_type:voiceResult?.lead_type||'Buyer',
        price_range:voiceResult?.price||'',
        last_contact_date:new Date().toISOString()
      })
      setVoiceResult(prev=>({...prev,saved:true,savedTo:matchName+' (new lead)'}))
    }else{
      // No name found — save as general interaction
      await supabase.from('interactions').insert({
        user_id:user.id,
        interaction_type:'voice_note',
        notes:`[Voice ${new Date().toLocaleDateString()}] ${transcript}`
      })
      setVoiceResult(prev=>({...prev,saved:true,savedTo:'General notes'}))
    }

    if(window.brikk?.haptic)window.brikk.haptic('success')
    loadData()
    // Auto close after 1.5s
    setTimeout(()=>{setShowVoice(false);setTranscript('');setVoiceResult(null)},1500)
  }

  // Build action items
  const actions=[]

  // Hot leads needing follow-up (URGENT)
  leads.forEach(l=>{
    const days=daysSince(l.last_contact_date)
    if(l.temperature==='hot'&&days>=1){
      actions.push({
        id:`lead-${l.id}`,
        priority:days>=3?'critical':'high',
        icon:'!',
        title:`Call ${l.name}`,
        subtitle:`Hot ${l.lead_type||'lead'} — ${days} day${days!==1?'s':''} since contact`,
        detail:l.stage&&l.price_range?`${l.stage} / ${l.price_range}`:l.stage||'',
        color:days>=3?c.red:c.amber,
        colorSoft:days>=3?c.redSoft:c.amberSoft,
        colorBorder:days>=3?c.redBorder:c.amberBorder,
        action:'Log Contact',
        actionFn:()=>handleLogContact(l.id),
        link:`/app/messages`,
        linkLabel:'Message',
      })
    }
  })

  // Warm leads going cold
  leads.forEach(l=>{
    const days=daysSince(l.last_contact_date)
    if(l.temperature==='warm'&&days>=3){
      actions.push({
        id:`lead-${l.id}`,
        priority:days>=7?'high':'medium',
        icon:'→',
        title:`Follow up: ${l.name}`,
        subtitle:`Warm ${l.lead_type||'lead'} — ${days} day${days!==1?'s':''} since contact${days>=7?' — going cold':''}`,
        detail:l.stage&&l.price_range?`${l.stage} / ${l.price_range}`:l.stage||'',
        color:days>=7?c.red:c.amber,
        colorSoft:days>=7?c.redSoft:c.amberSoft,
        colorBorder:days>=7?c.redBorder:c.amberBorder,
        action:'Log Contact',
        actionFn:()=>handleLogContact(l.id),
        link:`/app/messages`,
        linkLabel:'Message',
      })
    }
  })

  // Deals with close dates approaching
  deals.forEach(d=>{
    if(d.close_date){
      const dLeft=daysUntil(d.close_date)
      if(dLeft!==null&&dLeft<=14&&dLeft>=-3){
        let subtitle=''
        if(dLeft<=0)subtitle='Closing today or overdue!'
        else if(dLeft<=3)subtitle=`Closing in ${dLeft} day${dLeft!==1?'s':''} — confirm everything is ready`
        else if(dLeft<=7)subtitle=`${dLeft} days to close — check lender and title status`
        else subtitle=`${dLeft} days to close — on track`

        actions.push({
          id:`deal-${d.id}`,
          priority:dLeft<=3?'critical':dLeft<=7?'high':'medium',
          icon:'$',
          title:`${d.address}`,
          subtitle,
          detail:`${d.client_name||''}${d.price?' — $'+d.price.toLocaleString():''}${d.commission?' (Commission: $'+d.commission.toLocaleString()+')':''}`,
          color:dLeft<=3?c.red:dLeft<=7?c.amber:c.green,
          colorSoft:dLeft<=3?c.redSoft:dLeft<=7?c.amberSoft:c.greenSoft,
          colorBorder:dLeft<=3?c.redBorder:dLeft<=7?c.amberBorder:c.greenBorder,
          action:'View Deal',
          link:'/app/deals',
          linkLabel:'View Deal',
        })
      }
    }
  })

  // Copilot reminder if there are leads needing follow-up
  const leadsNeedingFollowUp=leads.filter(l=>{
    const d=daysSince(l.last_contact_date)
    return(l.temperature==='hot'&&d>=1)||(l.temperature==='warm'&&d>=3)||(l.temperature==='cold'&&d>=7)
  }).length

  if(leadsNeedingFollowUp>0){
    actions.push({
      id:'copilot-reminder',
      priority:'medium',
      icon:'AI',
      title:`Copilot has ${leadsNeedingFollowUp} draft${leadsNeedingFollowUp!==1?'s':''} ready`,
      subtitle:'AI-drafted follow-ups waiting for your approval',
      detail:'',
      color:c.purple,
      colorSoft:c.purpleSoft,
      colorBorder:c.purpleBorder,
      action:'Open Copilot',
      link:'/app/copilot',
      linkLabel:'Open Copilot',
    })
  }

  // Cold leads — low priority
  leads.forEach(l=>{
    const days=daysSince(l.last_contact_date)
    if(l.temperature==='cold'&&days>=10){
      actions.push({
        id:`lead-cold-${l.id}`,
        priority:'low',
        icon:'?',
        title:`Re-engage: ${l.name}`,
        subtitle:`Cold lead — ${days} days. Consider a value-add touchpoint or archive.`,
        detail:l.stage||'',
        color:c.dim,
        colorSoft:c.borderLight,
        colorBorder:c.border,
        action:'Log Contact',
        actionFn:()=>handleLogContact(l.id),
      })
    }
  })

  // Sort by priority
  const priorityOrder={critical:0,high:1,medium:2,low:3}
  actions.sort((a,b)=>(priorityOrder[a.priority]||3)-(priorityOrder[b.priority]||3))

  const pendingActions=actions.filter(a=>!completedActions.includes(a.id))
  const completedCount=completedActions.length
  const totalCommission=deals.reduce((s,d)=>s+(d.commission||0),0)
  const goal=profile?.annual_goal||200000
  const hour=new Date().getHours()
  const greeting=hour<12?'morning':hour<17?'afternoon':'evening'
  const firstName=profile?.full_name?profile.full_name.split(' ')[0]:''

  if(loading)return <div style={{padding:40,textAlign:"center",color:c.dim}}>Loading your day...</div>

  return(
    <div>
      {/* Greeting + summary */}
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.01em",margin:"0 0 6px"}}>
          Good {greeting}{firstName?`, ${firstName}`:''}.
        </h1>
        <p style={{fontSize:14,color:c.sub,margin:0,lineHeight:1.6}}>
          {pendingActions.length===0?
            "You're all caught up. No actions needed right now."
            :pendingActions.length===1?
            "You have 1 thing that needs your attention."
            :`You have ${pendingActions.length} things that need your attention.`
          }
        </p>
      </div>

      {/* Quick stats row */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 18px",flex:"1 1 120px",minWidth:120}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Actions</div>
          <div style={{fontSize:20,fontWeight:700,color:pendingActions.length>0?c.red:c.green}}>{pendingActions.length}</div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 18px",flex:"1 1 120px",minWidth:120}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Leads</div>
          <div style={{fontSize:20,fontWeight:700}}>{leads.length}</div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 18px",flex:"1 1 120px",minWidth:120}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Deals</div>
          <div style={{fontSize:20,fontWeight:700,color:c.green}}>{deals.length}</div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 18px",flex:"1 1 120px",minWidth:120}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Commission</div>
          <div style={{fontSize:20,fontWeight:700,color:c.green}}>${(totalCommission/1000).toFixed(1)}K</div>
        </div>
      </div>

      {/* Goal progress */}
      {goal>0&&<div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 18px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>Annual Goal</span>
          <span style={{fontSize:12,fontWeight:600,color:c.green}}>${(totalCommission/1000).toFixed(1)}K of ${(goal/1000).toFixed(0)}K</span>
        </div>
        <Progress value={totalCommission} max={goal} color={c.green}/>
      </div>}

      {/* Completed counter */}
      {completedCount>0&&(
        <div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:c.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>{completedCount}</div>
          <span style={{fontSize:13,fontWeight:600,color:c.green}}>action{completedCount!==1?'s':''} completed this session</span>
        </div>
      )}

      {/* Action items */}
      {pendingActions.length>0?(
        <div>
          <div style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>Your Actions</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {pendingActions.map((a,i)=>(
              <div key={a.id} style={{background:c.white,border:`1px solid ${a.priority==='critical'?a.colorBorder:c.border}`,borderRadius:8,padding:"16px 18px",borderLeft:`4px solid ${a.color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{width:24,height:24,borderRadius:6,background:a.colorSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:a.color,flexShrink:0}}>{a.icon}</div>
                      <span style={{fontSize:14,fontWeight:600}}>{a.title}</span>
                      {a.priority==='critical'&&<span style={{fontSize:9,fontWeight:700,color:c.red,background:c.redSoft,padding:"2px 6px",borderRadius:3,textTransform:"uppercase"}}>Urgent</span>}
                    </div>
                    <div style={{fontSize:12,color:c.sub,lineHeight:1.5,marginLeft:32}}>{a.subtitle}</div>
                    {a.detail&&<div style={{fontSize:11,color:c.dim,marginLeft:32,marginTop:2}}>{a.detail}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    {a.actionFn&&(
                      <button onClick={a.actionFn}
                        style={{background:c.green,border:"none",borderRadius:6,padding:"8px 16px",fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                        {a.action}
                      </button>
                    )}
                    {a.link&&(
                      <a href={a.link}
                        style={{background:a.actionFn?c.bg:c.text,border:a.actionFn?`1px solid ${c.border}`:"none",borderRadius:6,padding:"8px 16px",fontSize:12,fontWeight:600,color:a.actionFn?c.sub:"#fff",textDecoration:"none",display:"flex",alignItems:"center"}}>
                        {a.linkLabel||'View'}
                      </a>
                    )}
                    <button onClick={()=>markDone(a.id)}
                      style={{background:"transparent",border:`1px solid ${c.border}`,borderRadius:6,padding:"8px 12px",fontSize:12,fontWeight:500,color:c.dim,cursor:"pointer",fontFamily:"inherit"}}>
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ):(
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"40px 20px",textAlign:"center"}}>
          {leads.length===0&&deals.length===0?(
            <>
              <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Welcome to Brikk</div>
              <div style={{fontSize:13,color:c.sub,marginBottom:16,lineHeight:1.6}}>Start by adding your leads. Once you have leads and deals, this screen will tell you exactly what to do every day.</div>
              <a href="/app/leads" style={{fontSize:13,fontWeight:600,color:"#fff",background:c.text,padding:"10px 22px",borderRadius:6,textDecoration:"none"}}>Add Your First Lead</a>
            </>
          ):(
            <>
              <div style={{fontSize:16,fontWeight:600,color:c.green,marginBottom:8}}>All caught up</div>
              <div style={{fontSize:13,color:c.sub}}>No actions needed right now. Check back later or add more leads to grow your pipeline.</div>
            </>
          )}
        </div>
      )}

      {/* Referral link */}
      <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",marginTop:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Your Lead Capture Link</div>
            <div style={{fontSize:12,color:c.sub}}>Share this anywhere — business cards, Instagram, email signature. Leads go straight to your pipeline.</div>
          </div>
          <button onClick={()=>{
            const url=`brikk.store/refer${profile?.id?'?agent='+profile.id:''}`
            if(navigator.clipboard){navigator.clipboard.writeText(url)}
          }}
            style={{background:c.text,border:"none",borderRadius:6,padding:"10px 20px",fontSize:12,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
            Copy Link
          </button>
        </div>
        <div style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:6,padding:"10px 14px",marginTop:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <code style={{fontSize:13,color:c.text,fontFamily:"inherit"}}>brikk.store/refer{profile?.id?`?agent=${profile.id}`:''}</code>
          <a href={`/refer${profile?.id?'?agent='+profile.id:''}`} target="_blank" style={{fontSize:11,fontWeight:600,color:c.accent,flexShrink:0,marginLeft:12}}>Preview</a>
        </div>
        {leads.filter(l=>l.source==='Referral Link').length>0&&(
          <div style={{fontSize:12,color:c.green,fontWeight:600,marginTop:8}}>
            {leads.filter(l=>l.source==='Referral Link').length} lead{leads.filter(l=>l.source==='Referral Link').length!==1?'s':''} captured from this link
          </div>
        )}
      </div>

      {/* Quick links */}
      <div style={{display:"flex",gap:8,marginTop:20,flexWrap:"wrap"}}>
        <a href="/app/leads" style={{flex:"1 1 140px",background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"16px",textAlign:"center",textDecoration:"none"}}>
          <div style={{fontSize:14,fontWeight:600,color:c.text}}>Add Lead</div>
          <div style={{fontSize:11,color:c.dim,marginTop:4}}>New prospect</div>
        </a>
        <a href="/app/deals" style={{flex:"1 1 140px",background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"16px",textAlign:"center",textDecoration:"none"}}>
          <div style={{fontSize:14,fontWeight:600,color:c.text}}>Add Deal</div>
          <div style={{fontSize:11,color:c.dim,marginTop:4}}>Under contract</div>
        </a>
        <a href="/app/copilot" style={{flex:"1 1 140px",background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:8,padding:"16px",textAlign:"center",textDecoration:"none"}}>
          <div style={{fontSize:14,fontWeight:600,color:c.purple}}>AI Copilot</div>
          <div style={{fontSize:11,color:c.dim,marginTop:4}}>Draft follow-ups</div>
        </a>
        <a href="/app/messages" style={{flex:"1 1 140px",background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"16px",textAlign:"center",textDecoration:"none"}}>
          <div style={{fontSize:14,fontWeight:600,color:c.text}}>Messages</div>
          <div style={{fontSize:11,color:c.dim,marginTop:4}}>Text your leads</div>
        </a>
      </div>

      {/* Floating voice button */}
      {!showVoice&&<button onClick={startRecording} style={{position:"fixed",bottom:90,right:20,width:56,height:56,borderRadius:"50%",background:c.text,border:"none",boxShadow:"0 4px 20px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:80}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
      </button>}

      {/* Voice recording overlay */}
      {showVoice&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget&&!recording){setShowVoice(false)}}}>
        <div className="scale-in" style={{background:c.white,borderRadius:16,padding:"28px 24px",width:"100%",maxWidth:440,maxHeight:"70vh",overflow:"auto",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <div style={{fontSize:16,fontWeight:700}}>Voice Note</div>
              <div style={{fontSize:12,color:c.dim}}>{recording?'Listening...':'Review your note'}</div>
            </div>
            {!recording&&<button onClick={()=>{setShowVoice(false);setTranscript('');setVoiceResult(null)}} style={{background:"none",border:"none",fontSize:18,color:c.dim,cursor:"pointer"}}>×</button>}
          </div>

          {/* Recording indicator */}
          {recording&&<div style={{textAlign:"center",padding:"24px 0"}}>
            <div className="recording-pulse" style={{width:72,height:72,borderRadius:"50%",background:c.redSoft,border:`3px solid ${c.red}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <div style={{width:20,height:20,borderRadius:4,background:c.red}}/>
            </div>
            <button onClick={stopRecording} style={{background:c.red,border:"none",borderRadius:8,padding:"12px 32px",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Stop Recording</button>
          </div>}

          {/* Transcript */}
          {transcript&&<div style={{background:c.bg,borderRadius:8,padding:"14px 16px",marginBottom:16,border:`1px solid ${c.border}`}}>
            <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Transcript</div>
            <div style={{fontSize:13,color:c.text,lineHeight:1.7}}>{transcript}</div>
          </div>}

          {/* Processing */}
          {voiceProcessing&&<div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:13,color:c.dim,animation:"pulse 1.2s ease-in-out infinite"}}>AI is extracting lead info...</div>
          </div>}

          {/* AI extraction result */}
          {voiceResult&&!voiceProcessing&&<div style={{marginBottom:16}}>
            {/* Saved confirmation */}
            {voiceResult.saved?<div style={{background:"rgba(22,128,60,0.06)",border:"1px solid rgba(22,128,60,0.15)",borderRadius:12,padding:"20px 16px",textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:8}}>✓</div>
              <div style={{fontSize:15,fontWeight:700,color:"#16803C"}}>Saved to CRM</div>
              <div style={{fontSize:13,color:c.sub,marginTop:4}}>Updated: {voiceResult.savedTo}</div>
            </div>:
            <>
              {/* Lead match preview */}
              {(voiceResult.lead_name||voiceResult.new_lead_name)&&<div style={{background:"rgba(109,40,217,0.04)",border:`1px solid ${c.purpleBorder}`,borderRadius:12,padding:"16px",marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:600,color:c.purple,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>AI Extracted</div>
                {/* Check if we found a match */}
                {(()=>{
                  const matchName=(voiceResult.lead_name||voiceResult.new_lead_name||'').toLowerCase().trim()
                  const match=leads.find(l=>{const ln=l.name?.toLowerCase()||'';return ln.includes(matchName)||matchName.includes(ln)||ln.split(' ')[0]===matchName.split(' ')[0]})
                  return match?
                    <div style={{background:"rgba(22,128,60,0.06)",borderRadius:8,padding:"10px 12px",marginBottom:8,border:"1px solid rgba(22,128,60,0.12)"}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#16803C"}}>Matched to existing lead</div>
                      <div style={{fontSize:14,fontWeight:700,marginTop:2}}>{match.name}</div>
                      <div style={{fontSize:11,color:c.dim}}>{match.temperature} / {match.stage} / {match.source}</div>
                    </div>:
                    <div style={{background:"rgba(161,98,7,0.06)",borderRadius:8,padding:"10px 12px",marginBottom:8,border:"1px solid rgba(161,98,7,0.12)"}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#A16207"}}>New lead will be created</div>
                      <div style={{fontSize:14,fontWeight:700,marginTop:2}}>{voiceResult.lead_name||voiceResult.new_lead_name}</div>
                    </div>
                })()}
                {voiceResult.action&&<div style={{fontSize:13,color:c.text,marginBottom:4}}>Action: {voiceResult.action}</div>}
                {voiceResult.price&&<div style={{fontSize:13,color:c.text,marginBottom:4}}>Price: {voiceResult.price}</div>}
                {voiceResult.notes&&<div style={{fontSize:13,color:c.sub,marginTop:6}}>{voiceResult.notes}</div>}
              </div>}
              {!(voiceResult.lead_name||voiceResult.new_lead_name)&&voiceResult.raw&&<div style={{background:c.bg,borderRadius:12,padding:"16px",marginBottom:12,border:`1px solid ${c.border}`}}>
                <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Voice Note</div>
                <div style={{fontSize:13,color:c.sub}}>{voiceResult.raw}</div>
                <div style={{fontSize:11,color:c.dim,marginTop:6,fontStyle:"italic"}}>No lead name detected — will save as general note</div>
              </div>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={saveVoiceNote} style={{flex:1,background:c.text,border:"none",borderRadius:10,padding:"14px",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Save to CRM</button>
                <button onClick={()=>{setShowVoice(false);setTranscript('');setVoiceResult(null)}} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:"14px 20px",fontSize:13,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Discard</button>
              </div>
            </>}
          </div>}

          {/* Start recording again */}
          {!recording&&!voiceProcessing&&!voiceResult&&transcript&&<div style={{display:"flex",gap:8}}>
            <button onClick={startRecording} style={{flex:1,background:c.text,border:"none",borderRadius:8,padding:"12px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Record Again</button>
            <button onClick={stopRecording} style={{flex:1,background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:8,padding:"12px",fontSize:13,fontWeight:600,color:c.purple,cursor:"pointer",fontFamily:"inherit"}}>Process with AI</button>
          </div>}

          {/* Initial state */}
          {!recording&&!transcript&&<div style={{textAlign:"center",padding:"16px 0"}}>
            <button onClick={startRecording} style={{background:c.text,border:"none",borderRadius:8,padding:"14px 32px",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Start Recording</button>
            <div style={{fontSize:12,color:c.dim,marginTop:8}}>Tap and speak — AI extracts lead info</div>
          </div>}
        </div>
      </div>}
    </div>
  )
}
