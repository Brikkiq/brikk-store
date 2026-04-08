'use client'

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

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
const copilotDrafts=[
  {lead:"Emily Watson",priority:"Urgent",msg:"Hi Emily, this is Alex. I saw you were looking at properties in the $275K range — I pulled 3 new listings that match. Would you have 15 minutes this week?",reason:"5 days without contact. First-time buyers reached in week one convert 4x higher."},
  {lead:"David Park",priority:"Medium",msg:"Hi David, I put together an updated market analysis for your property — values shifted this month. Happy to walk through it whenever works.",reason:"Seller requested valuation 12 days ago. After 14 days, most choose another agent."},
]

const Tag=({children,bg,color})=><span style={{fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:3,background:bg,color,letterSpacing:"0.02em"}}>{children}</span>
const MiniProgress=({value,color})=><div style={{background:c.borderLight,borderRadius:2,height:3,width:"100%",overflow:"hidden"}}><div style={{width:`${value}%`,height:"100%",background:color,borderRadius:2}}/></div>

function LiveDemo(){
  const [screen,setScreen]=useState("pipeline")
  const tc={hot:{bg:c.redSoft,color:c.red},warm:{bg:c.amberSoft,color:c.amber},cold:{bg:"rgba(26,26,24,0.04)",color:c.dim}}
  const screens=["pipeline","money","copilot","voice","calendar","deals","marketing","speed"]
  return(
    <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${c.border}`,background:c.bg}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:c.green}}/>
          <span style={{fontSize:13,fontWeight:600}}>Brikk</span>
          <span style={{fontSize:11,color:c.dim}}>Live Preview</span>
        </div>
      </div>
      <div style={{display:"flex",gap:2,padding:"8px 16px",borderBottom:`1px solid ${c.border}`,overflowX:"auto"}}>
        {screens.map(s=>(
          <button key={s} onClick={()=>setScreen(s)} style={{background:screen===s?c.text:"transparent",color:screen===s?"#fff":c.dim,border:"none",borderRadius:4,padding:"4px 10px",fontSize:10,fontWeight:600,textTransform:"capitalize",cursor:"pointer",whiteSpace:"nowrap"}}>{s}</button>
        ))}
      </div>
      <div style={{padding:"16px",minHeight:340}}>
        {screen==="pipeline"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Lead Pipeline</div>
          <div style={{fontSize:11,color:c.dim,marginBottom:12}}>24 active leads with AI scoring</div>
          {demoLeads.map((l,i)=>{const t2=tc[l.temp];return(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderBottom:`1px solid ${c.borderLight}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:26,height:26,borderRadius:5,background:t2.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:t2.color}}>{l.name.split(" ").map(n=>n[0]).join("")}</div>
                <div><div style={{fontSize:12,fontWeight:600}}>{l.name}</div><div style={{fontSize:10,color:c.dim}}>{l.stage}</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <Tag bg={t2.bg} color={t2.color}>{l.temp.toUpperCase()}</Tag>
                <span style={{fontSize:10,fontWeight:600,color:l.score>=80?c.green:l.score>=50?c.amber:c.red,background:l.score>=80?c.greenSoft:l.score>=50?c.amberSoft:c.redSoft,padding:"2px 6px",borderRadius:3}}>{l.score}%</span>
                <span style={{fontSize:11,fontWeight:600,width:40,textAlign:"right"}}>{l.price}</span>
              </div>
            </div>
          )})}
        </div>}
        {screen==="money"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[["YTD Closed","$127.4K",c.green],["Pending","$52.3K",c.amber]].map(([l,v,cl],i)=>(
              <div key={i} style={{background:c.bg,borderRadius:6,padding:"14px 16px",border:`1px solid ${c.borderLight}`}}>
                <div style={{fontSize:9,fontWeight:600,color:c.dim,textTransform:"uppercase",marginBottom:4}}>{l}</div>
                <div style={{fontSize:20,fontWeight:700,color:cl}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase"}}>Annual Goal</span><span style={{fontSize:11,fontWeight:600,color:c.green}}>63.7% of $200K</span></div><MiniProgress value={63.7} color={c.green}/></div>
          <ResponsiveContainer width="100%" height={140}><BarChart data={monthlyData} barSize={12}><XAxis dataKey="m" tick={{fill:c.dim,fontSize:9}} axisLine={false} tickLine={false}/><YAxis hide/><Bar dataKey="v" fill={c.text} radius={[3,3,0,0]} opacity={0.8}/></BarChart></ResponsiveContainer>
        </div>}
        {screen==="copilot"&&<div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={{fontSize:13,fontWeight:700}}>AI Copilot</div><Tag bg={c.indigoSoft} color={c.indigo}>2 drafts ready</Tag></div>
          {copilotDrafts.map((d,i)=>(
            <div key={i} style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:6,padding:"14px 16px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,fontWeight:700}}>{d.lead}</span><Tag bg={d.priority==="Urgent"?c.redSoft:c.amberSoft} color={d.priority==="Urgent"?c.red:c.amber}>{d.priority}</Tag></div>
              <div style={{fontSize:11,color:c.sub,lineHeight:1.6,marginBottom:8,padding:"8px 10px",background:c.white,borderRadius:4,border:`1px solid ${c.borderLight}`,fontStyle:"italic"}}>"{d.msg}"</div>
              <div style={{fontSize:10,color:c.indigo,lineHeight:1.5,marginBottom:10}}>{d.reason}</div>
              <div style={{display:"flex",gap:6}}><span style={{fontSize:10,fontWeight:600,color:"#fff",background:c.green,padding:"5px 14px",borderRadius:4}}>Approve</span><span style={{fontSize:10,fontWeight:600,color:c.dim,background:c.white,border:`1px solid ${c.border}`,padding:"5px 14px",borderRadius:4}}>Edit</span></div>
            </div>
          ))}
        </div>}
        {screen==="voice"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Voice-to-CRM</div>
          <div style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:8,padding:"20px",textAlign:"center",marginBottom:12}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:c.redSoft,border:`2px solid ${c.red}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}><div style={{width:18,height:18,borderRadius:"50%",background:c.red}}/></div>
            <div style={{fontSize:12,fontWeight:600}}>Tap to Record</div>
            <div style={{fontSize:10,color:c.dim,marginTop:2}}>Talk. Brikk transcribes and updates your CRM.</div>
          </div>
          <div style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:6,padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><div style={{width:6,height:6,borderRadius:"50%",background:c.green}}/><span style={{fontSize:11,fontWeight:600}}>Processed</span></div>
            <div style={{fontSize:11,color:c.sub,lineHeight:1.6,fontStyle:"italic",marginBottom:8}}>"Just showed Elm Street to Sarah Mitchell. She loved the kitchen but worried about schools. Wants two more under 450."</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {[["Lead","Sarah Mitchell"],["Budget","Under $450K"],["Interest","Kitchen"],["Concern","Schools"]].map(([k,v],i)=>(
                <div key={i} style={{background:c.white,borderRadius:4,padding:"6px 8px",border:`1px solid ${c.borderLight}`}}><div style={{fontSize:8,color:c.dim,textTransform:"uppercase"}}>{k}</div><div style={{fontSize:11,fontWeight:600,marginTop:1}}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>}
        {screen==="calendar"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Smart Calendar</div>
          {[{time:"9:00 AM",label:"Call Sarah Mitchell",color:c.indigo,ai:"She viewed 3 listings last night. Mention 445 Pine St."},{time:"10:00 AM",label:"Showing: 1891 Elm St",color:c.green,ai:null},{time:"2:00 PM",label:"Listing appt: Linda Chen",color:c.amber,ai:"Comp at 280 Oak sold $315K — 2% above asking."},{time:"Tomorrow",label:"Inspection: 742 Oak Ave",color:c.red,ai:"RISK: Lender unresponsive 3 days."}].map((e,i)=>(
            <div key={i} style={{marginBottom:6,padding:"10px 12px",background:c.bg,borderRadius:6,border:`1px solid ${c.borderLight}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:3,height:24,borderRadius:2,background:e.color}}/><div><div style={{fontSize:12,fontWeight:600}}>{e.label}</div><div style={{fontSize:10,color:c.dim}}>{e.time}</div></div></div>
              {e.ai&&<div style={{marginLeft:11,background:"rgba(67,56,202,0.04)",borderRadius:4,padding:"6px 8px",marginTop:4}}><div style={{fontSize:9,fontWeight:600,color:"#6D28D9"}}>AI Context</div><div style={{fontSize:10,color:c.sub,lineHeight:1.5}}>{e.ai}</div></div>}
            </div>
          ))}
        </div>}
        {screen==="deals"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Active Deals</div>
          {[{addr:"742 Oak Ave",client:"Marcus Johnson",price:"$520,000",pct:65,days:19,flag:"amber",next:"Inspection — 48 hrs",risk:true},{addr:"1891 Elm St",client:"Rachel Torres",price:"$415,000",pct:40,days:34,flag:"green",next:"Appraisal Jun 2",risk:false},{addr:"305 Birch Ln",client:"Kevin & Amy Ross",price:"$680,000",pct:20,days:46,flag:"green",next:"Awaiting lender docs",risk:false}].map((d,i)=>(
            <div key={i} style={{padding:"12px 14px",marginBottom:8,borderRadius:6,border:`1px solid ${c.borderLight}`,background:c.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12,fontWeight:600}}>{d.addr}</span>{d.risk&&<Tag bg={c.amberSoft} color={c.amber}>Risk</Tag>}</div><div style={{fontSize:10,color:c.dim}}>{d.client}</div></div><span style={{fontSize:12,fontWeight:700,color:c.green}}>{d.price}</span></div>
              <MiniProgress value={d.pct} color={d.flag==="amber"?c.amber:c.green}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:10,color:d.flag==="amber"?c.amber:c.sub}}>{d.next}</span><span style={{fontSize:10,color:c.dim}}>{d.days}d</span></div>
            </div>
          ))}
        </div>}
        {screen==="marketing"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Marketing ROI + Content</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
            {[["Top Source","Referrals — 42%",c.green],["Worst ROI","Zillow — 6%",c.red],["Cost/Close","$0 vs $700",c.amber],["AI Posts","3 this week","#6D28D9"]].map(([k,v,cl],i)=>(
              <div key={i} style={{background:c.bg,borderRadius:6,padding:"10px 12px",border:`1px solid ${c.borderLight}`}}><div style={{fontSize:9,fontWeight:600,color:c.dim,textTransform:"uppercase"}}>{k}</div><div style={{fontSize:11,fontWeight:600,color:cl,marginTop:2}}>{v}</div></div>
            ))}
          </div>
          <div style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:6,padding:"12px 14px"}}>
            <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",marginBottom:6}}>AI-Generated Post</div>
            <div style={{fontSize:11,color:c.sub,lineHeight:1.6,fontStyle:"italic"}}>"Median prices in Westfield up 4.2% this quarter. 1.8 months of supply. If you've been thinking about selling, this is your window."</div>
            <div style={{display:"flex",gap:6,marginTop:8}}><span style={{fontSize:10,fontWeight:600,color:"#fff",background:c.text,padding:"4px 12px",borderRadius:4}}>Post</span><span style={{fontSize:10,fontWeight:600,color:c.dim,border:`1px solid ${c.border}`,padding:"4px 12px",borderRadius:4}}>Regenerate</span></div>
          </div>
        </div>}
        {screen==="speed"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Speed to Lead</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[["Avg Response","4.2 min",c.green],["Under 5 Min","71%",c.green],["Missed","2 this week",c.amber],["Revenue Saved","$18.2K",c.indigo]].map(([k,v,cl],i)=>(
              <div key={i} style={{background:c.bg,borderRadius:6,padding:"12px 14px",border:`1px solid ${c.borderLight}`}}><div style={{fontSize:9,fontWeight:600,color:c.dim,textTransform:"uppercase",marginBottom:4}}>{k}</div><div style={{fontSize:18,fontWeight:700,color:cl}}>{v}</div></div>
            ))}
          </div>
          <div style={{background:c.indigoSoft,border:`1px solid ${c.indigoBorder}`,borderRadius:6,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:600,color:c.indigo,marginBottom:3}}>AI Insight</div><div style={{fontSize:10,color:c.sub,lineHeight:1.5}}>Weekend response: 10.2 min vs 2.9 weekday. Auto-response could capture 4 extra appointments/month.</div></div>
        </div>}
      </div>
    </div>
  )
}

export default function Home(){
  const [email,setEmail]=useState("")
  const [submitted,setSubmitted]=useState(false)
  const [openFaq,setOpenFaq]=useState(null)
  const handleSubmit=()=>{if(email.includes("@"))setSubmitted(true)}

  const faqs=[
    {q:"Is this another CRM?",a:"No. Brikk is the one screen you open every morning that tells you what to do. It works alongside your existing CRM or replaces the spreadsheets you're actually using."},
    {q:"How does AI Copilot work?",a:"Copilot reads each lead's full context and drafts a personalized message. You tap approve and it sends. Enable auto-mode and it handles after-hours leads while you sleep."},
    {q:"What is Voice-to-CRM?",a:"Leave a showing, talk into your phone for 30 seconds. Brikk transcribes it, updates the lead record, adjusts their temperature, and queues a follow-up. Zero typing."},
    {q:"Does it work on my phone?",a:"Yes. Brikk is a Progressive Web App. Add it to your home screen and it works like a native app on iPhone and Android. No app store needed."},
    {q:"Can my clients see their deal progress?",a:"Yes. The Client Portal gives each buyer or seller a link to track their deal — like a pizza tracker for real estate. They stop calling you every day and start telling their friends."},
    {q:"Is the first 2 months really free?",a:"Yes. No credit card to start. Use Brikk for 60 days with full access to every feature. If it doesn't help you close more deals, you owe nothing. We're that confident."},
    {q:"Does the AI learn my style?",a:"Yes. After 30 days, Brikk learns your conversion patterns, message tone, best lead sources, and response timing. It gets smarter every month — that's why agents don't leave."},
    {q:"How is this different from KVCore or Follow Up Boss?",a:"Those store data. Brikk drives action. One screen, AI that acts on your behalf, and intelligence that compounds over time. Also — they cost $300-500/month. Brikk is $99."},
  ]

  return(
    <div style={{background:c.bg,color:c.text,fontFamily:"'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Nav */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 32px",maxWidth:1120,margin:"0 auto"}}>
        <span style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em"}}>Brikk</span>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <a href="#features" style={{fontSize:13,fontWeight:500,color:c.sub}}>Features</a>
          <a href="#how" style={{fontSize:13,fontWeight:500,color:c.sub}}>How It Works</a>
          <a href="#pricing" style={{fontSize:13,fontWeight:500,color:c.sub}}>Pricing</a>
          <a href="#faq" style={{fontSize:13,fontWeight:500,color:c.sub}}>FAQ</a>
          <a href="/login" style={{fontSize:13,fontWeight:600,color:c.bg,background:c.text,padding:"8px 20px",borderRadius:6}}>Start Free</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{padding:"80px 32px 60px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{display:"flex",gap:48,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 380px",maxWidth:460}}>
            {/* Free offer badge */}
            <div style={{display:"inline-block",background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:20,padding:"6px 16px",marginBottom:20}}>
              <span style={{fontSize:12,fontWeight:600,color:c.green}}>First 2 months free — no credit card</span>
            </div>
            <h1 style={{fontSize:"clamp(34px,5vw,54px)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.08,margin:"0 0 20px"}}>
              Stop juggling.<br/>Start closing.
            </h1>
            <p style={{fontSize:16,lineHeight:1.8,color:c.sub,margin:"0 0 12px",maxWidth:420}}>
              Brikk is the AI-powered command center that replaces the 8 apps in your workflow. See every lead, every deal, every dollar — then let AI handle the follow-ups you keep forgetting.
            </p>
            <p style={{fontSize:14,fontWeight:600,color:c.text,margin:"0 0 28px"}}>
              78% of buyers choose the first agent who responds. Brikk makes sure that's you.
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {!submitted?<>
                <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 18px",fontSize:14,color:c.text,width:240,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={handleSubmit} style={{background:c.text,border:"none",borderRadius:8,padding:"14px 28px",fontSize:14,fontWeight:600,color:c.white,cursor:"pointer"}}>Get 2 Months Free</button>
              </>:<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"14px 28px",fontSize:14,color:c.green,fontWeight:600}}>You're in. Check your email.</div>}
            </div>
            <p style={{fontSize:11,color:c.dim,marginTop:10}}>Join 47 agents already on the waitlist. No credit card required.</p>
          </div>
          <div style={{flex:"1 1 480px",maxWidth:580}}><LiveDemo/></div>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{borderTop:`1px solid ${c.border}`,borderBottom:`1px solid ${c.border}`,padding:"32px 0"}}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:"0 32px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:24}}>
          {[["78%","of buyers pick the first agent who responds"],["15 hrs","average agent response time (yours will be under 5 min)"],["80%","of sales happen after the 5th follow-up"],["$340K","lost per team annually from missed follow-ups"]].map(([val,desc],i)=>(
            <div key={i} style={{textAlign:"center",flex:"1 1 200px"}}><div style={{fontSize:24,fontWeight:700}}>{val}</div><div style={{fontSize:12,color:c.dim,marginTop:4}}>{desc}</div></div>
          ))}
        </div>
      </div>

      {/* The problem */}
      <section style={{padding:"80px 32px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{maxWidth:680,margin:"0 auto",textAlign:"center",marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>The problem</div>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 16px"}}>Your morning looks like this.</h2>
          <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:0}}>Log into Zillow. Check new leads. Switch to your CRM. Update notes. Open Google Sheets. Check commissions. Check your calendar. Open email. Check lender updates. Hop on social media. Post something. Realize you forgot to call that hot lead from Tuesday. They went with another agent.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:800,margin:"0 auto"}}>
          <div style={{background:c.redSoft,border:`1px solid rgba(190,18,60,0.1)`,borderRadius:10,padding:"28px 24px"}}>
            <div style={{fontSize:14,fontWeight:700,color:c.red,marginBottom:12}}>Without Brikk</div>
            {["8+ apps open at once","Leads go cold because you forget","No idea which marketing channels work","Commission tracking in a messy spreadsheet","Follow-ups depend on your memory","Clients call you 5x a day for updates","Weeknight leads wait until morning"].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:12,color:c.red,fontWeight:700,flexShrink:0}}>x</span>
                <span style={{fontSize:13,color:c.sub}}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:10,padding:"28px 24px"}}>
            <div style={{fontSize:14,fontWeight:700,color:c.green,marginBottom:12}}>With Brikk</div>
            {["One screen every morning","AI follows up so leads never go cold","See exactly which sources close deals","Real-time commission and goal tracking","Copilot drafts every message for you","Clients track deals in their own portal","Auto-response catches every after-hours lead"].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:12,color:c.green,fontWeight:700,flexShrink:0}}>+</span>
                <span style={{fontSize:13,color:c.sub}}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>How it works</div>
            <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Three steps. Five minutes. You're in.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20}}>
            {[
              ["1","Sign up and add your first leads","Create your account, add 5-10 leads with their source and temperature. Takes 5 minutes. Brikk starts tracking immediately."],
              ["2","Brikk goes to work","AI analyzes your pipeline, drafts follow-up messages, flags leads going cold, and builds your daily action list. You approve with one tap."],
              ["3","Close more, stress less","Within a week, you'll wonder how you worked without it. Within 90 days, the AI knows your business better than you do."],
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

      {/* Features */}
      <section id="features" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{marginBottom:48}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>14 features, one platform</div>
            <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>Everything you need. Nothing you don't.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
            {[
              ["Lead Pipeline","Every lead color-coded with AI scoring and days-since-contact alerts."],
              ["AI Copilot","Drafts personalized follow-ups. One-tap approve. Auto-responds after hours."],
              ["Voice-to-CRM","Talk after a showing. Brikk transcribes and updates everything. Zero typing."],
              ["Smart Calendar","Auto-populated from deals. AI context on every event — not reminders, intelligence."],
              ["Money Dashboard","YTD income, pending commissions, goal progress, 90-day forecast."],
              ["Transaction Tracker","Visual deal progress with deadline alerts and document checklists."],
              ["Deal Risk Alerts","AI flags financing issues, lender delays, and deadline risks before they cost you."],
              ["Client Portal","Shareable link for clients to track their deal. They stop calling. They start referring."],
              ["Predictive Scoring","AI learns which leads close for you specifically. Not industry averages — yours."],
              ["Client Lifetime Tracker","Total revenue per client including referrals. Know your most valuable relationships."],
              ["AI Market Reports","Branded neighborhood reports with real data. Text to seller leads instantly."],
              ["Social Content Generator","Market updates and posts in your voice with real data. One tap to publish."],
              ["Speed to Lead","Tracks response time and shows the revenue impact of every minute saved."],
              ["Marketing ROI","Conversion by source. Actual closed deals per channel with cost-per-close."],
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
      <section style={{padding:"64px 32px",borderTop:`1px solid ${c.border}`,textAlign:"center",background:c.white}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 16px"}}>The longer you use Brikk, the harder it is to leave.</h2>
          <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:0}}>After 90 days, Brikk knows your conversion patterns, your message style, your best lead sources, and your client relationships. That intelligence compounds every month — and it doesn't transfer to a competitor.</p>
        </div>
      </section>

      {/* Early agent quotes */}
      <section style={{padding:"64px 32px",borderTop:`1px solid ${c.border}`}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Early feedback</div>
            <h2 style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>What agents are saying</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
            {[
              {quote:"I opened Brikk on Monday and by Wednesday I'd already caught two leads I would have completely forgotten about. One of them just went under contract.",name:"Early access agent",loc:"Salt Lake City, UT"},
              {quote:"The Copilot feature alone is worth the subscription. I used to spend 30 minutes drafting follow-up emails. Now I tap approve and it's done in 10 seconds.",name:"Early access agent",loc:"Denver, CO"},
              {quote:"I showed this to my broker and she asked how much the team plan costs. She wants it for all 8 of us. This is what we've been looking for.",name:"Early access agent",loc:"Austin, TX"},
            ].map((t,i)=>(
              <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"28px 24px"}}>
                <div style={{fontSize:14,color:c.text,lineHeight:1.8,marginBottom:16}}>"{t.quote}"</div>
                <div style={{fontSize:13,fontWeight:600,color:c.text}}>{t.name}</div>
                <div style={{fontSize:12,color:c.dim}}>{t.loc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Pricing</div>
            <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>Less than your Zillow bill. More useful than your CRM.</h2>
            <p style={{fontSize:15,color:c.sub}}>Start free. No credit card. Cancel anytime.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16,maxWidth:800,margin:"0 auto"}}>
            {[
              {name:"Pro",price:"$99",period:"/month",badge:"First 2 months free",desc:"Everything you need to run your business from one screen.",features:["All 14 features included","AI Copilot with auto-response","Voice-to-CRM","Smart Calendar with AI context","Client Portal for every deal","AI Market Reports","Social Content Generator","Speed-to-Lead tracking","Predictive Lead Scoring","Works on phone and desktop"],primary:true},
              {name:"Team",price:"$199",period:"/month",badge:"First 2 months free",desc:"Everything in Pro, built for teams and brokerages.",features:["Everything in Pro","Up to 5 agent seats","Broker overview dashboard","Team performance analytics","Client Lifetime Tracker across team","Lead routing and assignment","Custom branding","Priority support"],primary:false},
            ].map((tier,i)=>(
              <div key={i} style={{background:tier.primary?c.bg:c.white,border:`1px solid ${tier.primary?c.text:c.border}`,borderRadius:12,padding:"36px 32px",position:"relative"}}>
                {tier.badge&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:c.green,color:"#fff",fontSize:11,fontWeight:600,padding:"5px 18px",borderRadius:20,whiteSpace:"nowrap"}}>{tier.badge}</div>}
                <div style={{fontSize:16,fontWeight:700,marginBottom:4,marginTop:8}}>{tier.name}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:4}}>
                  <span style={{fontSize:42,fontWeight:700,letterSpacing:"-0.02em"}}>{tier.price}</span>
                  <span style={{fontSize:14,color:c.sub}}>{tier.period}</span>
                </div>
                <div style={{fontSize:13,color:c.green,fontWeight:600,marginBottom:16}}>$0 for your first 60 days</div>
                <p style={{fontSize:14,color:c.sub,lineHeight:1.6,marginBottom:24}}>{tier.desc}</p>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
                  {tier.features.map((f,j)=><div key={j} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:4,height:4,borderRadius:"50%",background:tier.primary?c.text:c.dim,flexShrink:0}}/><span style={{fontSize:13,color:c.sub}}>{f}</span></div>)}
                </div>
                <a href="/login" style={{display:"block",background:tier.primary?c.text:c.bg,border:tier.primary?"none":`1px solid ${c.border}`,borderRadius:8,padding:"14px 0",textAlign:"center",fontSize:14,fontWeight:600,color:tier.primary?"#fff":c.sub,textDecoration:"none"}}>Start Free Trial</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`}}>
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

      {/* Final CTA */}
      <section style={{padding:"80px 32px",textAlign:"center",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <div style={{display:"inline-block",background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:20,padding:"6px 16px",marginBottom:20}}>
            <span style={{fontSize:12,fontWeight:600,color:c.green}}>Limited — first 2 months free</span>
          </div>
          <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 12px"}}>Your leads are waiting. Don't make them wait longer.</h2>
          <p style={{fontSize:15,color:c.sub,marginBottom:28}}>Join the agents who stopped losing deals to chaos. 60 days free, no credit card, full access.</p>
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            {!submitted?<>
              <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 18px",fontSize:14,color:c.text,width:240,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={handleSubmit} style={{background:c.text,border:"none",borderRadius:8,padding:"14px 28px",fontSize:14,fontWeight:600,color:c.white,cursor:"pointer"}}>Get 2 Months Free</button>
            </>:<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"14px 28px",fontSize:14,color:c.green,fontWeight:600}}>You're in. Check your email.</div>}
          </div>
          <p style={{fontSize:11,color:c.dim,marginTop:10}}>47 agents already on the waitlist</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop:`1px solid ${c.border}`,padding:"28px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:1120,margin:"0 auto",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:14,fontWeight:700}}>Brikk</span>
        <div style={{display:"flex",gap:20}}>
          <a href="/login" style={{fontSize:12,color:c.sub}}>Sign In</a>
          <a href="/demo" style={{fontSize:12,color:c.sub}}>Full Demo</a>
          <span style={{fontSize:12,color:c.dim}}>brikkiq@gmail.com</span>
        </div>
      </footer>
    </div>
  )
}
