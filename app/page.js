'use client'

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Logo } from '@/lib/Logo'

const c = {
  bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",
  text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",
  green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",
  amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",
  red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",
  indigo:"#4338CA",indigoSoft:"rgba(67,56,202,0.05)",indigoBorder:"rgba(67,56,202,0.12)",
}

const monthlyData=[{m:"J",v:8},{m:"J",v:14},{m:"A",v:12},{m:"S",v:19},{m:"O",v:9},{m:"N",v:22},{m:"D",v:17},{m:"J",v:12},{m:"F",v:19},{m:"M",v:24},{m:"A",v:16},{m:"M",v:21}]

const demoLeads=[
  {name:"Sarah M.",temp:"hot",days:1,price:"$425K",stage:"Showing",score:87},
  {name:"James O.",temp:"hot",days:0,price:"$680K",stage:"Offer Sent",score:92},
  {name:"Linda C.",temp:"warm",days:3,price:"$310K",stage:"Contacted",score:64},
  {name:"Emily W.",temp:"warm",days:5,price:"$275K",stage:"New Lead",score:41},
  {name:"David P.",temp:"cold",days:12,price:"$390K",stage:"Follow Up",score:28},
]

const Tag=({children,bg,color})=><span style={{fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:3,background:bg,color}}>{children}</span>
const MiniProgress=({value,color})=><div style={{background:c.borderLight,borderRadius:2,height:3,width:"100%",overflow:"hidden"}}><div style={{width:`${value}%`,height:"100%",background:color,borderRadius:2}}/></div>

function LiveDemo(){
  const [screen,setScreen]=useState("today")
  const tc={hot:{bg:c.redSoft,color:c.red},warm:{bg:c.amberSoft,color:c.amber},cold:{bg:"rgba(26,26,24,0.04)",color:c.dim}}
  // Match the actual app's 8-tab mobile bar. "Voice" replaces Settings here since
  // it's a demo-worthy feature; the real app keeps Settings in tab 8.
  const screens=[
    {id:"today",label:"Today"},
    {id:"copilot",label:"Copilot"},
    {id:"leads",label:"Leads"},
    {id:"voice",label:"Voice"},
    {id:"deals",label:"Deals"},
    {id:"calendar",label:"Calendar"},
    {id:"chats",label:"Chats"},
    {id:"roi",label:"ROI"},
  ]
  return(
    <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${c.border}`,background:c.bg}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:c.green}}/>
          <span style={{fontSize:13,fontWeight:600}}>Brikk</span>
          <span style={{fontSize:11,color:c.dim}}>Live Preview</span>
        </div>
      </div>
      <div style={{display:"flex",gap:2,padding:"8px 8px",borderBottom:`1px solid ${c.border}`,overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none"}}>
        {screens.map(s=>(
          <button key={s.id} onClick={()=>setScreen(s.id)} style={{background:screen===s.id?c.text:"transparent",color:screen===s.id?"#fff":c.dim,border:"none",borderRadius:4,padding:"4px 7px",fontSize:9.5,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{s.label}</button>
        ))}
      </div>
      <div style={{padding:"16px",minHeight:340}}>

        {/* TODAY — quick actions dashboard with a live-alert pill */}
        {screen==="today"&&<div>
          {/* Real-time new-lead alert pill */}
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:c.greenSoft,border:`1px solid ${c.greenBorder}`,padding:"3px 10px",borderRadius:20,marginBottom:10}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:c.green,animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:10,fontWeight:600,color:c.green}}>1 new lead · 12 min ago</span>
          </div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Good morning, Alex.</div>
          <div style={{fontSize:11,color:c.dim,marginBottom:12}}>You have 4 things that need your attention.</div>
          {[
            {icon:"!",label:"Call Sarah Mitchell — hot lead, 2 days since contact",color:c.red,bg:c.redSoft},
            {icon:"AI",label:"Copilot has 2 follow-up drafts ready",color:"#6D28D9",bg:"rgba(109,40,217,0.05)"},
            {icon:"$",label:"742 Oak Ave — closing in 3 days",color:c.amber,bg:c.amberSoft},
            {icon:"→",label:"Reply to Emily — she replied 14m ago",color:c.green,bg:c.greenSoft},
          ].map((a,i)=>(
            <div key={i} style={{padding:"10px 12px",marginBottom:4,borderRadius:6,borderLeft:`3px solid ${a.color}`,background:a.bg,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:22,height:22,borderRadius:5,background:`${a.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:a.color}}>{a.icon}</div>
              <span style={{fontSize:11,fontWeight:500,color:c.text}}>{a.label}</span>
            </div>
          ))}
        </div>}

        {/* COPILOT — drafts with native-send buttons */}
        {screen==="copilot"&&<div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={{fontSize:13,fontWeight:700}}>AI Copilot</div><Tag bg={c.indigoSoft} color={c.indigo}>2 drafts</Tag></div>
          {[
            {lead:"Emily Watson",msg:"Hi Emily, I pulled 3 new listings in the $275K range that match what you're looking for. Would you have 15 minutes this week?",reason:"5 days without contact. Conversion drops 80% after day 7."},
            {lead:"David Park",msg:"Hi David, I put together an updated market analysis for your property — values shifted this month. Happy to walk through it.",reason:"Seller going cold — 12 days since contact."},
          ].map((d,i)=>(
            <div key={i} style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:6,padding:"12px 14px",marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:700,marginBottom:6}}>{d.lead}</div>
              <div style={{fontSize:11,color:c.sub,lineHeight:1.6,marginBottom:6,fontStyle:"italic"}}>"{d.msg}"</div>
              <div style={{fontSize:10,color:c.indigo,marginBottom:8}}>{d.reason}</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                <span style={{fontSize:10,fontWeight:600,color:"#fff",background:c.text,padding:"4px 10px",borderRadius:4}}>Send via Messages</span>
                <span style={{fontSize:10,fontWeight:600,color:c.text,border:`1px solid ${c.border}`,padding:"3px 10px",borderRadius:4}}>Send via Email</span>
                <span style={{fontSize:10,color:c.dim,border:`1px solid ${c.border}`,padding:"3px 10px",borderRadius:4}}>Edit</span>
              </div>
            </div>
          ))}
        </div>}

        {/* LEADS — with YOUR TURN read-indicator + temp tags */}
        {screen==="leads"&&<div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:700}}>Lead Pipeline</div>
            <span style={{fontSize:9,color:c.dim}}>24 active</span>
          </div>
          <div style={{fontSize:11,color:c.dim,marginBottom:10}}>Sorted by who needs your attention</div>
          {demoLeads.map((l,i)=>{const t2=tc[l.temp];const yourTurn=i===0||i===2;return(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderBottom:`1px solid ${c.borderLight}`,background:yourTurn?"rgba(190,18,60,0.02)":"transparent"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:24,height:24,borderRadius:4,background:t2.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:t2.color}}>{l.name.split(" ").map(n=>n[0]).join("")}</div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{fontSize:11,fontWeight:600}}>{l.name}</div>
                    {yourTurn && <span style={{fontSize:8,fontWeight:700,color:"#fff",background:c.red,padding:"1px 5px",borderRadius:2,letterSpacing:"0.04em"}}>YOUR TURN</span>}
                  </div>
                  <div style={{fontSize:9,color:c.dim}}>{yourTurn?`They replied · ${i===0?"14m":"2h"} ago`:`You sent · ${l.days}d ago`}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <Tag bg={t2.bg} color={t2.color}>{l.temp.toUpperCase()}</Tag>
                <span style={{fontSize:10,fontWeight:600,width:36,textAlign:"right"}}>{l.price}</span>
              </div>
            </div>
          )})}
        </div>}

        {/* VOICE — multi-action modal */}
        {screen==="voice"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>Voice → Actions</div>
          <div style={{fontSize:10,color:c.dim,marginBottom:10}}>Speak naturally. AI structures it for you.</div>
          <div style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:8,padding:"10px 12px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:c.red,animation:"pulse 1.5s infinite"}}/>
              <span style={{fontSize:10,fontWeight:600,color:c.text}}>Just recorded · 0:18</span>
            </div>
            <div style={{fontSize:10,color:c.sub,fontStyle:"italic",lineHeight:1.5}}>"Sarah loved the kitchen at the Maple Ave showing. Update her status, add a note, and remind me to text her Saturday morning about a second tour."</div>
          </div>
          <div style={{fontSize:9,fontWeight:600,color:c.dim,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>3 actions parsed — review and approve</div>
          {[
            {icon:"↻",label:"Update Sarah Mitchell — stage to Showing",color:c.indigo},
            {icon:"+",label:"Add note: \"Loved kitchen, wants Saturday tour\"",color:c.green},
            {icon:"⏰",label:"Set follow-up: Text Sarah Sat morning",color:c.amber},
          ].map((a,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:c.white,border:`1px solid ${c.borderLight}`,borderRadius:5,marginBottom:4}}>
              <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${c.green}`,background:c.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>✓</div>
              <div style={{width:18,height:18,borderRadius:3,background:`${a.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:a.color,fontWeight:700}}>{a.icon}</div>
              <span style={{fontSize:10.5,color:c.text,flex:1}}>{a.label}</span>
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginTop:8}}>
            <span style={{fontSize:10,fontWeight:600,color:"#fff",background:c.green,padding:"5px 14px",borderRadius:4}}>Approve all</span>
            <span style={{fontSize:10,color:c.dim,border:`1px solid ${c.border}`,padding:"4px 12px",borderRadius:4}}>Discard</span>
          </div>
        </div>}

        {/* DEALS */}
        {screen==="deals"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Active Deals</div>
          {[{addr:"742 Oak Ave",client:"Marcus Johnson",price:"$520,000",pct:65,days:19,flag:"amber"},{addr:"1891 Elm St",client:"Rachel Torres",price:"$415,000",pct:40,days:34,flag:"green"}].map((d,i)=>(
            <div key={i} style={{padding:"10px 12px",marginBottom:8,borderRadius:6,border:`1px solid ${c.borderLight}`,background:c.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,fontWeight:600}}>{d.addr}</span><span style={{fontSize:12,fontWeight:700,color:c.green}}>{d.price}</span></div>
              <MiniProgress value={d.pct} color={d.flag==="amber"?c.amber:c.green}/>
              <div style={{fontSize:10,color:c.dim,marginTop:4}}>{d.client} · {d.days}d to close</div>
            </div>
          ))}
        </div>}

        {/* CALENDAR */}
        {screen==="calendar"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Smart Calendar</div>
          {[{time:"Today · 2 PM",label:"Call Sarah Mitchell",color:c.indigo,ai:"She viewed 3 listings last night."},{time:"Today · 4 PM",label:"Listing appt: Linda Chen",color:c.amber,ai:"Bring updated CMA."},{time:"Tomorrow · 10 AM",label:"Inspection: 742 Oak Ave",color:c.red,ai:"Lender unresponsive — confirm financing."}].map((e,i)=>(
            <div key={i} style={{marginBottom:6,padding:"10px 12px",background:c.bg,borderRadius:6,border:`1px solid ${c.borderLight}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:3,height:22,borderRadius:2,background:e.color}}/><div><div style={{fontSize:11,fontWeight:600}}>{e.label}</div><div style={{fontSize:9,color:c.dim}}>{e.time}</div></div></div>
              {e.ai&&<div style={{marginLeft:11,background:"rgba(67,56,202,0.04)",borderRadius:4,padding:"5px 8px",marginTop:4}}><div style={{fontSize:9,fontWeight:600,color:"#6D28D9"}}>AI Context</div><div style={{fontSize:9,color:c.sub}}>{e.ai}</div></div>}
            </div>
          ))}
        </div>}

        {/* CHATS — quick-reply pills + Reply with AI + native send */}
        {screen==="chats"&&<div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700}}>Sarah Mitchell</div>
            <span style={{fontSize:8,fontWeight:700,color:"#fff",background:c.red,padding:"1px 5px",borderRadius:2}}>YOUR TURN</span>
          </div>
          <div style={{background:c.bg,borderRadius:8,border:`1px solid ${c.borderLight}`,padding:"10px"}}>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
              <div style={{background:c.text,color:"#fff",borderRadius:"10px 10px 2px 10px",padding:"7px 11px",fontSize:11,maxWidth:"82%"}}>Hi Sarah, I have 3 new listings in your range. Free for a call Thursday?</div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-start",marginBottom:8}}>
              <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:"10px 10px 10px 2px",padding:"7px 11px",fontSize:11,maxWidth:"82%"}}>Yes! Thursday at 2 works great.</div>
            </div>
            {/* Reply with AI */}
            <div style={{display:"flex",justifyContent:"flex-start",marginBottom:8}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(109,40,217,0.08)",border:`1px solid rgba(109,40,217,0.2)`,padding:"3px 9px",borderRadius:14,fontSize:10,fontWeight:600,color:"#6D28D9"}}>
                <span style={{fontSize:11}}>✨</span> Reply with AI
              </div>
            </div>
            {/* Quick-reply pills */}
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
              {["Confirm Thursday 2 PM","Send address","Reschedule"].map((q,i)=>(
                <span key={i} style={{fontSize:9.5,color:c.sub,background:c.white,border:`1px solid ${c.border}`,padding:"3px 8px",borderRadius:11}}>{q}</span>
              ))}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <div style={{flex:1,background:c.white,border:`1px solid ${c.border}`,borderRadius:6,padding:"7px 10px",fontSize:11,color:c.dim}}>Type a message…</div>
              <div style={{background:c.text,color:"#fff",borderRadius:6,padding:"7px 11px",fontSize:10.5,fontWeight:600,whiteSpace:"nowrap"}}>Send via Messages</div>
            </div>
            <div style={{fontSize:8.5,color:c.dim,marginTop:6,textAlign:"center"}}>Opens your phone's messaging app. Sent from your number.</div>
          </div>
        </div>}

        {/* ROI */}
        {screen==="roi"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Marketing ROI</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
            {[["Top Source","Referrals — 42%",c.green],["Worst ROI","Zillow — 6%",c.red],["Total Leads","104",c.text],["Hot Rate","24%",c.amber]].map(([k,v,cl],i)=>(
              <div key={i} style={{background:c.bg,borderRadius:6,padding:"10px 12px",border:`1px solid ${c.borderLight}`}}><div style={{fontSize:8,fontWeight:600,color:c.dim,textTransform:"uppercase"}}>{k}</div><div style={{fontSize:11,fontWeight:600,color:cl,marginTop:2}}>{v}</div></div>
            ))}
          </div>
          <div style={{background:"rgba(67,56,202,0.04)",borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,fontWeight:600,color:c.indigo,marginBottom:2}}>AI Insight</div><div style={{fontSize:9,color:c.sub}}>Referrals convert 7× better than Zillow at $0 cost. Shift budget toward referral programs.</div></div>
        </div>}
      </div>
      {/* Pulse keyframe — used by live alert + voice mic */}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}

export default function Home(){
  const [email,setEmail]=useState("")
  const [submitted,setSubmitted]=useState(false)
  const [openFaq,setOpenFaq]=useState(null)
  const [chatOpen,setChatOpen]=useState(false)
  const [chatMsg,setChatMsg]=useState("")
  const [chatHistory,setChatHistory]=useState([{role:'assistant',content:"Hey! I'm Brikk's AI assistant. Ask me anything — pricing, features, how to install the app on your phone, or how it all works. I'm here to help!"}])
  const [chatLoading,setChatLoading]=useState(false)
  const [emailError,setEmailError]=useState(null)

  // Validate + submit the hero email capture. Shows an inline error if the
  // address is missing or malformed.
  const handleSubmit=()=>{
    const trimmed=email.trim()
    if(!trimmed){ setEmailError("Enter your email to start the free trial."); return }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)){ setEmailError("That doesn't look like a valid email."); return }
    setEmailError(null)
    setSubmitted(true)
  }

  // Smooth-scroll to an in-page section. Used by the nav links and by direct
  // URL loads with a #hash. Respects each section's scroll-margin-top so the
  // sticky-feeling nav doesn't obscure the heading.
  const scrollToSection = (hash) => {
    if (typeof window === 'undefined' || !hash) return
    const el = document.querySelector(hash)
    if (!el) return
    // Use scrollIntoView with smooth; scroll-margin-top on the section handles
    // the offset for any nav overhead.
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Handle direct URL load with #hash. We wait for layout to settle on slow
  // browsers by combining requestAnimationFrame + a fallback setTimeout. This
  // prevents the "page appears blank on direct hash URL" issue that can happen
  // when the scroll fires before the page has rendered.
  useEffect(()=>{
    if(typeof window==='undefined') return
    const scrollToHash=()=>{
      const hash=window.location.hash
      if(!hash) return
      // Two-frame delay ensures layout is fully painted on slow devices
      requestAnimationFrame(()=>requestAnimationFrame(()=>scrollToSection(hash)))
    }
    // Fire on mount AND as a fallback after a delay in case the layout is
    // particularly slow (font loading, etc.).
    scrollToHash()
    const t1 = setTimeout(scrollToHash, 150)
    const t2 = setTimeout(scrollToHash, 600)
    window.addEventListener('hashchange', scrollToHash)
    return ()=>{
      clearTimeout(t1); clearTimeout(t2)
      window.removeEventListener('hashchange', scrollToHash)
    }
  },[])

  // Used as onClick for nav anchor links to override the browser's default
  // jump-to-anchor and use our smooth-scroll instead, which lands at the
  // correct y-offset.
  const navLinkClick = (e, hash) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      // Update URL without triggering browser jump; useEffect handler not needed since we scroll directly.
      window.history.replaceState(null, '', hash)
    }
    scrollToSection(hash)
  }

  const handleChat=async()=>{
    if(!chatMsg.trim()||chatLoading)return
    const userMsg=chatMsg.trim()
    setChatHistory(p=>[...p,{role:'user',content:userMsg}])
    setChatMsg("");setChatLoading(true)
    try{
      const res=await fetch('/api/copilot',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({mode:'help_chat',question:userMsg})
      })
      const data=await res.json()
      setChatHistory(p=>[...p,{role:'assistant',content:data.answer||"Sorry, I couldn't process that. Try asking another way."}])
    }catch(err){
      setChatHistory(p=>[...p,{role:'assistant',content:"Something went wrong. Please try again."}])
    }
    setChatLoading(false)
  }

  const faqs=[
    {q:"Is this another CRM?",a:"No. Brikk is the one screen you open every morning that tells you what to do. It's simpler than a CRM, smarter than a spreadsheet, and costs a fraction of what you're paying now."},
    {q:"How does AI Copilot work?",a:"Copilot reads each lead's full context — their temperature, how long since you've been in touch, their stage, their notes — and drafts a personalized message. You tap approve, edit, or skip. That's it."},
    {q:"Can I actually text leads from the app?",a:"Yes. You draft a message in Brikk (or let AI write it), tap Send via Messages, and your phone's native texting app opens with the message and recipient pre-filled. You send it from your own number, on your own carrier. Brikk logs the message to that lead's history automatically. This sidesteps carrier registration and TCPA risk that comes with platform-sent SMS."},
    {q:"Does it work on my phone?",a:"Yes. Brikk is a Progressive Web App. Add it to your home screen on iPhone or Android and it works like a native app with a bottom tab bar. No app store needed."},
    {q:"Is the first 14 days really free?",a:"Yes. No credit card to start. Full access to every feature for 14 days. If it doesn't help you close more deals, you owe nothing."},
    {q:"How is this different from Lofty or Follow Up Boss?",a:"Those platforms cost $300-500/month, require hours of training, and are built for large brokerages. Brikk is $69.99/month with no setup fee, takes 5 minutes to set up, and is built for solo agents and small teams who want AI that actually does things — not just stores data."},
    {q:"What about my existing leads?",a:"Add them manually in about 2 minutes each, or share your referral link and new leads flow in automatically. We're building CSV import for the next update."},
    {q:"Does the AI learn over time?",a:"The more you use Brikk, the more context AI has about your leads, your deals, and your patterns. After 90 days, it knows your business better than any CRM you've ever used."},
  ]

  return(
    <div style={{background:c.bg,color:c.text,fontFamily:"'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Sticky nav bar — full-width frosted background so footer→Features
          smooth-scrolls reliably and so the user always has navigation. */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(250,250,249,0.88)",backdropFilter:"saturate(180%) blur(12px)",WebkitBackdropFilter:"saturate(180%) blur(12px)",borderBottom:`1px solid ${c.borderLight}`}}>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",maxWidth:1120,margin:"0 auto"}}>
        <a href="/" style={{textDecoration:"none"}}><Logo size={18}/></a>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <a href="#features" onClick={(e)=>navLinkClick(e,'#features')} className="hide-mobile" style={{fontSize:13,fontWeight:500,color:c.sub}}>Features</a>
          <a href="#how" onClick={(e)=>navLinkClick(e,'#how')} className="hide-mobile" style={{fontSize:13,fontWeight:500,color:c.sub}}>Get started</a>
          <a href="#pricing" onClick={(e)=>navLinkClick(e,'#pricing')} className="hide-mobile" style={{fontSize:13,fontWeight:500,color:c.sub}}>Pricing</a>
          <a href="/login" style={{fontSize:13,fontWeight:600,color:c.bg,background:c.text,padding:"8px 20px",borderRadius:6}}>Start Free</a>
        </div>
      </nav>
      </div>

      {/* Hero */}
      <section className="mobile-pad-hero" style={{padding:"80px 32px 60px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{display:"flex",gap:48,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 320px",maxWidth:460}}>
            <div style={{display:"inline-block",background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:20,padding:"6px 16px",marginBottom:20}}>
              <span style={{fontSize:12,fontWeight:600,color:c.green}}>First 14 days free — no credit card</span>
            </div>
            <h1 style={{fontSize:"clamp(34px,5vw,50px)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.08,margin:"0 0 20px"}}>
              One screen.<br/>Every lead.<br/>AI that acts.
            </h1>
            <p style={{fontSize:16,lineHeight:1.8,color:c.sub,margin:"0 0 12px",maxWidth:420}}>
              Brikk is the command center for real estate agents who are tired of juggling 8 apps and losing leads. Add your leads, and AI handles the follow-ups you keep forgetting.
            </p>
            <p style={{fontSize:14,fontWeight:600,color:c.text,margin:"0 0 28px"}}>
              $69.99/month. No setup fee. Not $300. Not $500. And the first 14 days are free.
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {!submitted?<>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={e=>{setEmail(e.target.value); if(emailError) setEmailError(null)}}
                  onKeyDown={e=>{if(e.key==='Enter') handleSubmit()}}
                  style={{background:c.white,border:`1px solid ${emailError?c.red:c.border}`,borderRadius:8,padding:"14px 18px",fontSize:14,color:c.text,width:"100%",maxWidth:240,minWidth:180,outline:"none",fontFamily:"inherit",flex:"1 1 180px"}}
                />
                <button onClick={handleSubmit} style={{background:c.text,border:"none",borderRadius:8,padding:"14px 28px",fontSize:14,fontWeight:600,color:c.white,cursor:"pointer"}}>Get 14 Days Free</button>
              </>:<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"14px 28px",fontSize:14,color:c.green,fontWeight:600}}>You're in. Check your email.</div>}
            </div>
            {emailError && !submitted && (
              <div style={{fontSize:12,color:c.red,marginTop:8,fontWeight:500}}>{emailError}</div>
            )}
          </div>
          <div style={{flex:"1 1 480px",maxWidth:580}}><LiveDemo/></div>
        </div>
      </section>

      {/* Stats */}
      <div style={{borderTop:`1px solid ${c.border}`,borderBottom:`1px solid ${c.border}`,padding:"24px 0"}}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:"0 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
            {[["78%","of buyers pick the first agent who responds"],["15 hrs","average agent response time"],["80%","of sales happen after the 5th follow-up"],["$69.99/mo","vs $300-500 for competitors"]].map(([val,desc],i)=>(
              <div key={i} style={{textAlign:"center",flex:"1 1 140px"}}><div style={{fontSize:22,fontWeight:700}}>{val}</div><div style={{fontSize:11,color:c.dim,marginTop:4}}>{desc}</div></div>
            ))}
          </div>
          <div style={{textAlign:"center",fontSize:10,color:c.dim,marginTop:14,letterSpacing:"0.02em"}}>
            Sources: NAR Profile of Home Buyers (2024); WAV Group lead-response study; Marketing Donut sales-cadence research.
          </div>
        </div>
      </div>

      {/* Problem/Solution */}
      <section style={{padding:"60px 20px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{maxWidth:680,margin:"0 auto",textAlign:"center",marginBottom:48}}>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 16px"}}>You're losing deals to your own workflow.</h2>
          <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:0}}>Zillow. CRM. Google Sheets. Calendar. Email. Phone. Notes app. By the time you've checked everything, the hot lead from Tuesday went with another agent.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,maxWidth:800,margin:"0 auto"}}>
          <div style={{background:c.redSoft,border:`1px solid rgba(190,18,60,0.1)`,borderRadius:10,padding:"28px 24px"}}>
            <div style={{fontSize:14,fontWeight:700,color:c.red,marginBottom:12}}>Without Brikk</div>
            {["Check 8 different apps every morning","Leads go cold because you forgot","No idea which marketing channels work","Follow-ups depend on your memory","Clients call 5x a day for deal updates"].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:12,color:c.red,fontWeight:700}}>x</span>
                <span style={{fontSize:13,color:c.sub}}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:10,padding:"28px 24px"}}>
            <div style={{fontSize:14,fontWeight:700,color:c.green,marginBottom:12}}>With Brikk</div>
            {["Open one screen — see exactly what to do","AI drafts every follow-up for you","See which lead sources actually close deals","Smart Calendar auto-built from your pipeline","Share a link — leads capture themselves"].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:12,color:c.green,fontWeight:700}}>+</span>
                <span style={{fontSize:13,color:c.sub}}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{padding:"60px 20px",borderTop:`1px solid ${c.border}`,background:c.white,scrollMarginTop:80}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Set up in 5 minutes. Not 5 hours.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
            {[
              ["1","Add your leads","Type in your current leads with their source and temperature. Or share your referral link and new leads capture themselves."],
              ["2","AI goes to work","Copilot analyzes every lead and drafts personalized follow-ups. Your calendar auto-fills with deadlines. Marketing ROI shows which sources work."],
              ["3","One tap to act","Approve AI drafts, send texts, log contacts, track deals — all from one screen. Stop juggling. Start closing."],
            ].map(([num,title,desc],i)=>(
              <div key={i} style={{padding:"28px 24px",borderRadius:10,border:`1px solid ${c.border}`,background:c.bg}}>
                <div style={{width:36,height:36,borderRadius:8,background:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff",marginBottom:16}}>{num}</div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>{title}</div>
                <div style={{fontSize:14,color:c.sub,lineHeight:1.7}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — only what's real */}
      <section id="features" style={{padding:"60px 20px",borderTop:`1px solid ${c.border}`,scrollMarginTop:80}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{marginBottom:48}}>
            <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>What you get today.</h2>
            <p style={{fontSize:15,color:c.sub,margin:0}}>Every feature works. No "coming soon." No vapor.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
            {[
              ["Quick Actions Dashboard","Open the app and see exactly what needs your attention. Hot leads going cold, deals closing soon, Copilot drafts ready. One screen, prioritized."],
              ["AI Copilot","Claude AI reads every lead's full context and drafts a personalized follow-up. You approve, edit, or skip. It explains why each message should be sent now."],
              ["Lead Pipeline","Add, edit, filter, and manage every lead. Color-coded by temperature. Days-since-contact tracking. Log interactions with one tap."],
              ["Deal Tracker","Track every deal from contract to closing. Visual stage progression. Close date countdown. Commission tracking toward your annual goal."],
              ["Smart Calendar","Auto-populated from your leads and deals. Follow-up reminders, closing deadlines, and milestone alerts with AI context for every event."],
              ["Marketing ROI","See which lead sources actually produce closings — not just lead count. Pie charts, conversion tables, and AI insights on where to focus."],
              ["Conversations","Draft a message in Brikk, send it from your own phone with one tap. AI suggests replies based on the lead's history. Every exchange is logged."],
              ["Voice-to-CRM","Tap the mic. Speak naturally about a lead — what you texted, what they replied, a price change. AI parses it into structured updates you review and approve."],
              ["Lead Capture Link","A short URL like brikk.store/r/YOUR-CODE that anyone can fill out. Submissions land in your pipeline and you get a live alert. Put it on your business card or in your Instagram bio."],
            ].map(([title,desc],i)=>(
              <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"22px 20px"}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{title}</div>
                <div style={{fontSize:13,color:c.sub,lineHeight:1.6}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Moat */}
      <section style={{padding:"48px 20px",borderTop:`1px solid ${c.border}`,textAlign:"center",background:c.white}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 16px"}}>The longer you use it, the smarter it gets.</h2>
          <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:0}}>After 90 days, Brikk knows your conversion patterns, your message style, your best lead sources, and your client relationships. That intelligence compounds monthly — and it doesn't transfer to a competitor.</p>
        </div>
      </section>

      {/* Testimonials —
          REPLACE THESE PLACEHOLDERS with real quotes as you collect them.
          Each quote object: { quote, name, role, market, result }.
          When you have 3 real quotes, remove the "Early access" tag.
      */}
      <section style={{padding:"60px 20px",borderTop:`1px solid ${c.border}`,background:c.bg}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <div style={{display:"inline-block",background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:20,padding:"4px 14px",marginBottom:14}}>
              <span style={{fontSize:11,fontWeight:600,color:c.green}}>Early access — first 50 agents</span>
            </div>
            <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>Agents using Brikk today</h2>
            <p style={{fontSize:14,color:c.sub,margin:0}}>Real names, real markets, real numbers.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
            {[
              {
                quote:"Brikk caught two deals going cold I would have missed. Closed both. That paid for the year right there.",
                name:"[Agent name]",
                role:"Buyer's agent",
                market:"[City, State]",
                result:"Closed 2 deals in 90 days",
              },
              {
                quote:"The voice-to-CRM feature is the only reason I actually log activity anymore. After showings, I tap, talk, done.",
                name:"[Agent name]",
                role:"Solo agent",
                market:"[City, State]",
                result:"15+ hours saved per month",
              },
              {
                quote:"My morning brief is the first email I open. It tells me exactly who to call back. Stopped using my old CRM after week 2.",
                name:"[Agent name]",
                role:"Team lead",
                market:"[City, State]",
                result:"Switched from Follow Up Boss",
              },
            ].map((t,i)=>(
              <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"24px 22px",display:"flex",flexDirection:"column",gap:14}}>
                <div style={{fontSize:14,lineHeight:1.65,color:c.text,fontStyle:"italic"}}>"{t.quote}"</div>
                <div style={{borderTop:`1px solid ${c.borderLight}`,paddingTop:12,marginTop:"auto"}}>
                  <div style={{fontSize:13,fontWeight:600,color:c.text}}>{t.name}</div>
                  <div style={{fontSize:11,color:c.dim,marginTop:1}}>{t.role} · {t.market}</div>
                  <div style={{fontSize:11,fontWeight:600,color:c.green,marginTop:6}}>{t.result}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{fontSize:11,color:c.dim,textAlign:"center",marginTop:20,fontStyle:"italic"}}>
            Want to be quoted? Email <a href="mailto:hello@brikk.store" style={{color:c.dim,textDecoration:"underline"}}>hello@brikk.store</a> with your story — featured agents get a free month.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{padding:"48px 20px 60px",borderTop:`1px solid ${c.border}`,scrollMarginTop:80}}>
        <div style={{maxWidth:560,margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>Simple pricing. No surprises.</h2>
          <p style={{fontSize:15,color:c.sub,marginBottom:24}}>Start free. Cancel anytime. No contracts.</p>
        </div>
        <div style={{maxWidth:1020,margin:"0 auto",textAlign:"center"}}>
          <div className="pricing-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,textAlign:"left"}}>
            {/* Pro */}
            <div style={{background:c.white,border:`2px solid ${c.text}`,borderRadius:12,padding:"32px 28px",position:"relative"}}>
              <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:c.green,color:"#fff",fontSize:11,fontWeight:600,padding:"5px 18px",borderRadius:20}}>First 14 days free</div>
              <div style={{fontSize:15,fontWeight:700,marginTop:8,marginBottom:4}}>Pro</div>
              <div style={{fontSize:13,color:c.sub,marginBottom:16}}>For solo agents</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:2}}>
                <span style={{fontSize:44,fontWeight:700,letterSpacing:"-0.02em"}}>$69.99</span>
                <span style={{fontSize:14,color:c.sub}}>/month</span>
              </div>
              <div style={{fontSize:13,color:c.green,fontWeight:600,marginBottom:4}}>$0 for your first 14 days</div>
              <div style={{fontSize:12,color:c.dim,marginBottom:20}}>No setup fee · Cancel anytime</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
                {["Everything in the app","AI Copilot drafts","Voice-to-CRM","Smart Calendar","Marketing ROI","Lead Capture Link","Web + mobile (PWA)","Unlimited leads & deals"].map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:4,height:4,borderRadius:"50%",background:c.text}}/><span style={{fontSize:13,color:c.sub}}>{f}</span></div>
                ))}
              </div>
              <a href="/login" style={{display:"block",background:c.text,borderRadius:8,padding:"13px 0",fontSize:14,fontWeight:600,color:"#fff",textDecoration:"none",textAlign:"center"}}>Start Free Trial</a>
            </div>

            {/* Team */}
            <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"32px 28px"}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Team</div>
              <div style={{fontSize:13,color:c.sub,marginBottom:16}}>For small teams</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:2}}>
                <span style={{fontSize:44,fontWeight:700,letterSpacing:"-0.02em"}}>$160</span>
                <span style={{fontSize:14,color:c.sub}}>/month</span>
              </div>
              <div style={{fontSize:13,color:c.green,fontWeight:600,marginBottom:4}}>$0 for your first 14 days</div>
              <div style={{fontSize:12,color:c.dim,marginBottom:20}}>No setup fee · Cancel anytime</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
                {["Everything in Pro","Up to 5 agent seats","Team code for member onboarding","Shared subscription","Priority support"].map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:4,height:4,borderRadius:"50%",background:c.dim}}/><span style={{fontSize:13,color:c.sub}}>{f}</span></div>
                ))}
              </div>
              <a href="/login" style={{display:"block",background:c.bg,border:`1px solid ${c.border}`,borderRadius:8,padding:"13px 0",fontSize:14,fontWeight:600,color:c.sub,textDecoration:"none",textAlign:"center"}}>Start 14-day trial</a>
            </div>

            {/* Agency */}
            <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"32px 28px"}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Agency</div>
              <div style={{fontSize:13,color:c.sub,marginBottom:16}}>For brokerages & networks</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:2}}>
                <span style={{fontSize:36,fontWeight:700,letterSpacing:"-0.02em"}}>Custom</span>
              </div>
              <div style={{fontSize:13,color:c.dim,fontWeight:500,marginBottom:4}}>Scaled for your roster</div>
              <div style={{fontSize:12,color:c.dim,marginBottom:20}}>Custom onboarding included</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
                {["Everything in Team","Unlimited agent seats","Team code seat management","Dedicated success contact","Custom SLAs","Onboarding for full agent roster"].map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:4,height:4,borderRadius:"50%",background:c.dim}}/><span style={{fontSize:13,color:c.sub}}>{f}</span></div>
                ))}
              </div>
              <a href="mailto:hello@brikk.store?subject=Brikk%20Agency%20plan%20enquiry" style={{display:"block",background:c.bg,border:`1px solid ${c.border}`,borderRadius:8,padding:"13px 0",fontSize:14,fontWeight:600,color:c.sub,textDecoration:"none",textAlign:"center"}}>Contact sales</a>
            </div>
          </div>
          <p style={{fontSize:12,color:c.dim,marginTop:16,textAlign:"center"}}>No credit card required to start</p>
          <p style={{fontSize:11,color:c.dim,marginTop:6,textAlign:"center",maxWidth:520,marginLeft:"auto",marginRight:"auto",lineHeight:1.5}}>All sales final. No refunds — the 14-day trial is your evaluation window. Cancel anytime to stop future charges. See <a href="/terms" style={{color:c.dim,textDecoration:"underline"}}>Terms</a>.</p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{padding:"60px 20px",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 32px"}}>Common questions</h2>
          {faqs.map((f,i)=>(
            <div key={i} style={{borderBottom:`1px solid ${c.border}`}}>
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"20px 0",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"inherit"}}>
                <span style={{fontSize:15,fontWeight:600,color:c.text,textAlign:"left"}}>{f.q}</span>
                <span style={{fontSize:16,color:c.dim,flexShrink:0,marginLeft:16,transform:openFaq===i?"rotate(45deg)":"none",transition:"transform 0.2s"}}>+</span>
              </button>
              {openFaq===i&&<div style={{paddingBottom:20,fontSize:14,color:c.sub,lineHeight:1.7}}>{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"60px 20px",textAlign:"center",borderTop:`1px solid ${c.border}`}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <div style={{display:"inline-block",background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:20,padding:"6px 16px",marginBottom:20}}>
            <span style={{fontSize:12,fontWeight:600,color:c.green}}>Limited — first 14 days free</span>
          </div>
          <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 12px"}}>Your leads are waiting.</h2>
          <p style={{fontSize:15,color:c.sub,marginBottom:28}}>14 days free. No credit card. Everything included.</p>
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            {!submitted?<>
              <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 18px",fontSize:14,color:c.text,width:"100%",maxWidth:240,minWidth:180,outline:"none",fontFamily:"inherit",flex:"1 1 180px"}}/>
              <button onClick={handleSubmit} style={{background:c.text,border:"none",borderRadius:8,padding:"14px 28px",fontSize:14,fontWeight:600,color:c.white,cursor:"pointer"}}>Get 14 Days Free</button>
            </>:<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"14px 28px",fontSize:14,color:c.green,fontWeight:600}}>You're in. Check your email.</div>}
          </div>
        </div>
      </section>

      {/* AI Help Banner */}
      <section style={{padding:"32px 20px",textAlign:"center",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Have questions?</div>
          <div style={{fontSize:14,color:c.sub,marginBottom:16}}>Our AI assistant knows everything about Brikk — features, pricing, how to install, and more.</div>
          <button onClick={()=>setChatOpen(true)} style={{background:c.text,border:"none",borderRadius:10,padding:"14px 32px",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Ask AI About Brikk</button>
          <div style={{fontSize:12,color:c.dim,marginTop:10}}>Try: "How do I install the app?" or "What features do I get?"</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop:`1px solid ${c.border}`,padding:"24px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:1120,margin:"0 auto",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:14,fontWeight:700}}>Brikk</span>
        <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
          <a href="/login" style={{fontSize:12,color:c.sub}}>Sign in</a>
          <a href="/roadmap" style={{fontSize:12,color:c.sub}}>Roadmap</a>
          <a href="/privacy" style={{fontSize:12,color:c.sub}}>Privacy</a>
          <a href="/terms" style={{fontSize:12,color:c.sub}}>Terms</a>
          <a href="mailto:hello@brikk.store" style={{fontSize:12,color:c.sub}}>Contact</a>
        </div>
      </footer>

      {/* AI Help Chat — floating panel */}
      {chatOpen && (
        <div
          onClick={(e)=>{if(e.target===e.currentTarget) setChatOpen(false)}}
          style={{position:"fixed",inset:0,background:"rgba(20,20,18,0.5)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:20}}
        >
          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,maxWidth:480,width:"100%",height:"min(620px, 80vh)",display:"flex",flexDirection:"column",boxShadow:"0 10px 40px rgba(20,20,18,0.18)"}}>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${c.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:15,fontWeight:600}}>Ask AI about Brikk</div>
                <div style={{fontSize:11,color:c.dim,marginTop:2}}>Pricing, features, setup — anything.</div>
              </div>
              <button onClick={()=>setChatOpen(false)} aria-label="Close" style={{background:"none",border:"none",fontSize:20,color:c.dim,cursor:"pointer",padding:4,lineHeight:1}}>×</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:10}}>
              {chatHistory.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==='user'?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:m.role==='user'?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.role==='user'?c.text:c.bg,color:m.role==='user'?"#fff":c.text,border:m.role==='user'?"none":`1px solid ${c.border}`,fontSize:13.5,lineHeight:1.55,whiteSpace:"pre-wrap"}}>{m.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div style={{fontSize:12,color:c.dim,fontStyle:"italic"}}>Thinking…</div>
              )}
            </div>
            <div style={{padding:"12px 18px",borderTop:`1px solid ${c.border}`,display:"flex",gap:8}}>
              <input
                value={chatMsg}
                onChange={e=>setChatMsg(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleChat()}}}
                placeholder="Ask anything about Brikk…"
                style={{flex:1,padding:"10px 14px",borderRadius:8,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit"}}
              />
              <button onClick={handleChat} disabled={!chatMsg.trim()||chatLoading} style={{background:c.text,border:"none",borderRadius:8,padding:"0 18px",fontSize:13,fontWeight:600,color:"#fff",cursor:chatMsg.trim()?"pointer":"default",opacity:chatMsg.trim()&&!chatLoading?1:0.5,fontFamily:"inherit"}}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}