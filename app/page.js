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
  {name:"Sarah M.",temp:"hot",days:1,price:"$425K",stage:"Showing"},
  {name:"James O.",temp:"hot",days:0,price:"$680K",stage:"Offer Sent"},
  {name:"Linda C.",temp:"warm",days:3,price:"$310K",stage:"Contacted"},
  {name:"Emily W.",temp:"warm",days:5,price:"$275K",stage:"New Lead"},
  {name:"David P.",temp:"cold",days:12,price:"$390K",stage:"Follow Up"},
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
  return(
    <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:`1px solid ${c.border}`,background:c.bg}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:c.green}}/>
          <span style={{fontSize:13,fontWeight:600}}>Brikk</span>
          <span style={{fontSize:11,color:c.dim,marginLeft:4}}>Live Preview</span>
        </div>
        <div style={{display:"flex",gap:2,background:c.white,borderRadius:6,padding:2,border:`1px solid ${c.border}`}}>
          {["pipeline","money","copilot","deals"].map(s=>(
            <button key={s} onClick={()=>setScreen(s)} style={{background:screen===s?c.text:"transparent",color:screen===s?"#fff":c.dim,border:"none",borderRadius:4,padding:"5px 14px",fontSize:11,fontWeight:600,textTransform:"capitalize",transition:"all 0.15s",cursor:"pointer"}}>{s}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"20px",minHeight:380}}>
        {screen==="pipeline"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div style={{fontSize:14,fontWeight:700}}>Lead Pipeline</div><div style={{fontSize:11,color:c.dim}}>24 active leads</div></div>
            <div style={{display:"flex",gap:6}}>{["All","Hot","Warm","Cold"].map((f,i)=><span key={i} style={{fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:4,background:i===0?c.text:"transparent",color:i===0?"#fff":c.dim,cursor:"pointer"}}>{f}</span>)}</div>
          </div>
          {demoLeads.map((l,i)=>{const t=tc[l.temp];return(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderBottom:`1px solid ${c.borderLight}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:28,height:28,borderRadius:6,background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:t.color}}>{l.name.split(" ").map(n=>n[0]).join("")}</div>
                <div><div style={{fontSize:13,fontWeight:600}}>{l.name}</div><div style={{fontSize:11,color:c.dim}}>{l.stage}</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Tag bg={t.bg} color={t.color}>{l.temp.toUpperCase()}</Tag>
                <span style={{fontSize:12,fontWeight:600,width:44,textAlign:"right"}}>{l.price}</span>
                <span style={{fontSize:11,fontWeight:600,color:l.days>=5?c.red:l.days>=3?c.amber:c.dim,width:28,textAlign:"right"}}>{l.days===0?"Now":`${l.days}d`}</span>
              </div>
            </div>
          )})}
        </div>}
        {screen==="money"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[["YTD Closed","$127.4K",c.green],["Pending","$52.3K",c.amber]].map(([l,v,cl],i)=>(
              <div key={i} style={{background:c.bg,borderRadius:8,padding:"16px 18px",border:`1px solid ${c.borderLight}`}}>
                <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>{l}</div>
                <div style={{fontSize:22,fontWeight:700,color:cl}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>Annual Goal</span>
              <span style={{fontSize:12,fontWeight:600,color:c.green}}>63.7% of $200K</span>
            </div>
            <MiniProgress value={63.7} color={c.green}/>
          </div>
          <div style={{fontSize:11,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:10}}>Monthly Income</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} barSize={14}><XAxis dataKey="m" tick={{fill:c.dim,fontSize:9}} axisLine={false} tickLine={false}/><YAxis hide/><Bar dataKey="v" fill={c.text} radius={[3,3,0,0]} opacity={0.8}/></BarChart>
          </ResponsiveContainer>
        </div>}
        {screen==="copilot"&&<div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700}}>AI Copilot</div>
            <Tag bg={c.indigoSoft} color={c.indigo}>2 drafts ready</Tag>
          </div>
          {copilotDrafts.map((d,i)=>(
            <div key={i} style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:8,padding:"16px 18px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:700}}>{d.lead}</span>
                <Tag bg={d.priority==="Urgent"?c.redSoft:c.amberSoft} color={d.priority==="Urgent"?c.red:c.amber}>{d.priority}</Tag>
              </div>
              <div style={{fontSize:12,color:c.sub,lineHeight:1.7,marginBottom:10,padding:"10px 12px",background:c.white,borderRadius:6,border:`1px solid ${c.borderLight}`,fontStyle:"italic"}}>"{d.msg}"</div>
              <div style={{fontSize:11,color:c.indigo,lineHeight:1.5,marginBottom:12}}>{d.reason}</div>
              <div style={{display:"flex",gap:6}}>
                <span style={{fontSize:11,fontWeight:600,color:"#fff",background:c.green,padding:"6px 16px",borderRadius:4}}>Approve</span>
                <span style={{fontSize:11,fontWeight:600,color:c.dim,background:c.white,border:`1px solid ${c.border}`,padding:"6px 16px",borderRadius:4}}>Edit</span>
              </div>
            </div>
          ))}
        </div>}
        {screen==="deals"&&<div>
          <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Active Deals</div>
          {[{addr:"742 Oak Avenue",client:"Marcus Johnson",price:"$520,000",pct:65,days:19,flag:"amber",next:"Inspection — 48 hrs"},{addr:"1891 Elm Street",client:"Rachel Torres",price:"$415,000",pct:40,days:34,flag:"green",next:"Appraisal Jun 2"},{addr:"305 Birch Lane",client:"Kevin & Amy Ross",price:"$680,000",pct:20,days:46,flag:"green",next:"Awaiting lender docs"}].map((d,i)=>(
            <div key={i} style={{padding:"14px 16px",marginBottom:8,borderRadius:8,border:`1px solid ${c.borderLight}`,background:c.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div><div style={{fontSize:13,fontWeight:600}}>{d.addr}</div><div style={{fontSize:11,color:c.dim}}>{d.client}</div></div>
                <span style={{fontSize:13,fontWeight:700,color:c.green}}>{d.price}</span>
              </div>
              <MiniProgress value={d.pct} color={d.flag==="amber"?c.amber:c.green}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                <span style={{fontSize:11,color:d.flag==="amber"?c.amber:c.sub}}>{d.next}</span>
                <span style={{fontSize:11,color:c.dim}}>{d.days}d to close</span>
              </div>
            </div>
          ))}
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
    {q:"Is this another CRM?",a:"No. Brikk is the one screen you open every morning that tells you what to do. It works alongside your existing CRM or replaces the spreadsheets you're actually using. Think of it as the cockpit, not the engine."},
    {q:"How does AI Copilot work?",a:"Copilot reads each lead's full context — source, temperature, days since contact, property interests — and drafts a personalized message. You tap approve and it sends. Enable auto-mode and it handles after-hours leads while you sleep."},
    {q:"What is Voice-to-CRM?",a:"Leave a showing, talk into your phone for 30 seconds about what happened. Brikk transcribes it, updates the lead record, adjusts their temperature, and queues a follow-up. Zero typing, built for agents who live in their cars."},
    {q:"Does it work on my phone?",a:"Yes. Brikk is a Progressive Web App. Add it to your home screen and it works like a native app. No app store needed."},
    {q:"Can my clients see their deal progress?",a:"Yes. The Client Portal gives each buyer or seller a simple link to track their deal — like a pizza tracker for real estate. They stop calling you every day, and every client who sees it sees the Brikk brand."},
    {q:"What does it cost?",a:"Pro is $99/month with the full web app, AI Copilot, Smart Calendar, and all features. Team is $199/month for up to 5 agents with a broker dashboard. No contracts, cancel anytime."},
    {q:"Does the AI learn my style?",a:"Yes. After 30 days, Brikk learns your conversion patterns, your message tone, which lead sources close for you specifically, and what times your leads are most responsive. It gets smarter every month you use it."},
    {q:"How is this different from KVCore or Follow Up Boss?",a:"Those are CRMs built to store data. Brikk is a command center built to drive action. We don't replace your CRM — we replace the chaos. One screen, AI that acts, and intelligence that compounds over time."},
  ]

  return(
    <div style={{background:c.bg,color:c.text,fontFamily:"'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Nav */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 32px",maxWidth:1120,margin:"0 auto"}}>
        <span style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em"}}>Brikk</span>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <a href="#features" style={{fontSize:13,fontWeight:500,color:c.sub}}>Features</a>
          <a href="#ai" style={{fontSize:13,fontWeight:500,color:c.sub}}>AI</a>
          <a href="#pricing" style={{fontSize:13,fontWeight:500,color:c.sub}}>Pricing</a>
          <a href="#faq" style={{fontSize:13,fontWeight:500,color:c.sub}}>FAQ</a>
          <a href="#signup" style={{fontSize:13,fontWeight:600,color:c.bg,background:c.text,padding:"8px 20px",borderRadius:6}}>Early Access</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{padding:"80px 32px 60px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{display:"flex",gap:60,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 400px",maxWidth:480}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:20}}>The operating system for real estate agents</div>
            <h1 style={{fontSize:"clamp(32px,5vw,52px)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.1,margin:"0 0 20px"}}>
              Built to close.
            </h1>
            <p style={{fontSize:16,lineHeight:1.8,color:c.sub,margin:"0 0 32px",maxWidth:420}}>
              Brikk replaces the 8 apps you're juggling with one AI-powered command center. It sees your leads, manages your deals, drafts your follow-ups, and gets smarter every month you use it.
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {!submitted?<>
                <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)}
                  style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"13px 18px",fontSize:14,color:c.text,width:240,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={handleSubmit}
                  style={{background:c.text,border:"none",borderRadius:8,padding:"13px 24px",fontSize:14,fontWeight:600,color:c.white,cursor:"pointer"}}>
                  Get Early Access
                </button>
              </>:<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"13px 24px",fontSize:14,color:c.green,fontWeight:600}}>You're on the list.</div>}
            </div>
            <p style={{fontSize:11,color:c.dim,marginTop:12}}>Free for the first 20 agents. No credit card.</p>
          </div>
          <div style={{flex:"1 1 480px",maxWidth:560}}><LiveDemo/></div>
        </div>
      </section>

      {/* Stats */}
      <div style={{borderTop:`1px solid ${c.border}`,borderBottom:`1px solid ${c.border}`,padding:"32px 0"}}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:"0 32px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:24}}>
          {[["78%","of buyers pick the first agent who responds"],["15 hrs","average agent lead response time"],["80%","of sales happen after the 5th follow-up"],["$340K","lost per team annually from missed follow-ups"]].map(([val,desc],i)=>(
            <div key={i} style={{textAlign:"center",flex:"1 1 200px"}}>
              <div style={{fontSize:24,fontWeight:700}}>{val}</div>
              <div style={{fontSize:12,color:c.dim,marginTop:4}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Features */}
      <section id="features" style={{padding:"80px 32px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Command Center</div>
          <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>Everything you need. One screen.</h2>
          <p style={{fontSize:15,color:c.sub,margin:0,maxWidth:500}}>Six core screens that replace the 8+ tools you're juggling today.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
          {[
            ["Lead Pipeline","Every lead on one screen. Color-coded by temperature, sorted by urgency, with alerts that turn red before you lose the deal."],
            ["AI Copilot","Drafts personalized follow-ups, queues them for one-tap approval, and auto-responds after hours. The feature that pays for itself."],
            ["Money Dashboard","YTD income, pending commissions, goal progress, 90-day forecast. Financial clarity that keeps you motivated and focused."],
            ["Transaction Tracker","Visual deal progress with deadline alerts, document checklists, and stage tracking. Never miss an inspection or financing date."],
            ["Speed to Lead","Tracks your response time and shows the revenue impact of every minute. See exactly where leads slip through."],
            ["Marketing ROI","Conversion rates by source. Not just lead count — actual closed deals per channel with cost-per-close. Stop paying for what doesn't work."],
          ].map(([title,desc],i)=>(
            <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"28px 26px"}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{title}</div>
              <div style={{fontSize:14,color:c.sub,lineHeight:1.7}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Features - the moat */}
      <section id="ai" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{marginBottom:48}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>AI that actually works</div>
            <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>Gets smarter every month you use it.</h2>
            <p style={{fontSize:15,color:c.sub,margin:0,maxWidth:560}}>Most tools show you data. Brikk acts on it. The longer you use it, the more it learns about your business, your market, and your clients. After 90 days, leaving means starting from zero.</p>
          </div>

          {/* Voice to CRM - hero feature */}
          <div style={{display:"flex",gap:40,alignItems:"center",flexWrap:"wrap",marginBottom:48,padding:"40px 36px",background:c.bg,border:`1px solid ${c.border}`,borderRadius:12}}>
            <div style={{flex:"1 1 340px"}}>
              <div style={{fontSize:12,fontWeight:600,color:c.indigo,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>New</div>
              <h3 style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 12px"}}>Voice-to-CRM</h3>
              <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:"0 0 20px"}}>
                Leave a showing. Talk into your phone for 30 seconds. Brikk transcribes everything, updates the lead record, adjusts their temperature, and queues a Copilot follow-up with matching listings. Zero typing. Built for agents who live in their cars.
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {["Automatic transcription and lead updates","AI extracts preferences, budget, and timeline","Copilot drafts follow-up based on what you said","Works hands-free while driving"].map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:4,height:4,borderRadius:"50%",background:c.indigo,flexShrink:0}}/>
                    <span style={{fontSize:13,color:c.sub}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{flex:"1 1 300px",background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"24px"}}>
              <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:14}}>Voice Note Preview</div>
              <div style={{background:c.bg,borderRadius:8,padding:"16px",border:`1px solid ${c.borderLight}`,marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:c.red}}/>
                  <span style={{fontSize:12,fontWeight:600,color:c.red}}>Recording — 0:28</span>
                </div>
                <div style={{fontSize:13,color:c.sub,lineHeight:1.7,fontStyle:"italic"}}>"Just showed Elm Street house to Sarah Mitchell. She loved the kitchen but worried about the school district. Wants to see two more in the same area under 450."</div>
              </div>
              <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>AI Extracted</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {[["Lead","Sarah Mitchell"],["Interest","Kitchen positive"],["Concern","School district"],["Budget","Under $450K"]].map(([k,v],i)=>(
                  <div key={i} style={{background:c.bg,borderRadius:6,padding:"8px 10px",border:`1px solid ${c.borderLight}`}}>
                    <div style={{fontSize:9,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>{k}</div>
                    <div style={{fontSize:12,fontWeight:600,marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Feature grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14,marginBottom:48}}>
            {[
              ["Smart Calendar","Auto-populates from your pipeline. When you add a deal, inspection deadlines, financing dates, and closing dates land on your calendar automatically. AI notifications tell you what's happening and what to do about it — not just reminders."],
              ["Predictive Lead Scoring","After 90 days of data, Brikk learns which leads actually close for you specifically. Not industry averages — your personal patterns. It starts predicting which leads in your current pipeline are most likely to close and why."],
              ["Deal Risk Alerts","AI monitors active transactions and flags risk before you notice. Lender hasn't responded in 3 days? Brikk alerts you: historically, lender silence at this stage correlates with financing issues 40% of the time. Call the loan officer today."],
              ["Client Lifetime Tracker","Most agents think in single transactions. Brikk thinks in lifetime value. See total revenue per client including referrals, track relationship health, and never miss an opportunity to re-engage a high-value past client."],
              ["AI Market Reports","Tap one button. Get a branded neighborhood market report with current data — median prices, days on market, inventory trends. Text it to a seller lead instantly. Professional credibility in 10 seconds."],
              ["Client Portal","Give each buyer or seller a simple link to track their deal — like a pizza tracker for real estate. Clients see deal progress, upcoming dates, and documents needed. They stop calling you every day. They start telling their friends."],
            ].map(([title,desc],i)=>(
              <div key={i} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:"28px 26px"}}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{title}</div>
                <div style={{fontSize:14,color:c.sub,lineHeight:1.7}}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Social content */}
          <div style={{display:"flex",gap:40,alignItems:"center",flexWrap:"wrap",padding:"40px 36px",background:c.bg,border:`1px solid ${c.border}`,borderRadius:12}}>
            <div style={{flex:"1 1 340px"}}>
              <h3 style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 12px"}}>Social Content Generator</h3>
              <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:0}}>
                You know you should post on social media. You never do. One tap: Brikk generates a market update, a just-listed caption, or a tip of the week — all in your voice, with real local data. It learns your tone from your past messages and matches it. Consistent content without the effort.
              </p>
            </div>
            <div style={{flex:"1 1 300px",background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"24px"}}>
              <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Generated Post</div>
              <div style={{background:c.bg,borderRadius:8,padding:"16px",border:`1px solid ${c.borderLight}`}}>
                <div style={{fontSize:13,color:c.text,lineHeight:1.8}}>
                  Median home prices in Westfield are up 4.2% this quarter. Inventory is tight — just 1.8 months of supply. If you've been thinking about selling, this is a window worth paying attention to. Happy to run a free market analysis for your home anytime.
                </div>
                <div style={{marginTop:12,display:"flex",gap:8}}>
                  <span style={{fontSize:11,fontWeight:600,color:"#fff",background:c.text,padding:"6px 14px",borderRadius:4}}>Post</span>
                  <span style={{fontSize:11,fontWeight:600,color:c.dim,background:c.white,border:`1px solid ${c.border}`,padding:"6px 14px",borderRadius:4}}>Edit</span>
                  <span style={{fontSize:11,fontWeight:600,color:c.dim,background:c.white,border:`1px solid ${c.border}`,padding:"6px 14px",borderRadius:4}}>Regenerate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The moat statement */}
      <section style={{padding:"64px 32px",borderTop:`1px solid ${c.border}`,textAlign:"center"}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 16px"}}>The longer you use Brikk, the harder it is to leave.</h2>
          <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:0}}>
            After 90 days, Brikk knows your conversion patterns, your message style, your best lead sources, your client relationships, and your market. That intelligence doesn't transfer to a competitor. It compounds every month — making you more efficient, more responsive, and more profitable.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{marginBottom:48}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Pricing</div>
            <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>Less than your Zillow bill. More useful than your CRM.</h2>
            <p style={{fontSize:15,color:c.sub,margin:0}}>No contracts. Cancel anytime.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:14}}>
            {[
              {name:"Pro",price:"$99",period:"/month",desc:"The full Brikk experience for solo agents.",features:["All 6 command center screens","AI Copilot with message drafting","Voice-to-CRM","Smart Calendar with AI notifications","Deal Risk Alerts","Client Portal","AI Market Reports","Social Content Generator","Speed-to-Lead tracking","Marketing ROI analytics","Mobile PWA"],primary:true},
              {name:"Team",price:"$199",period:"/month",desc:"Everything in Pro, built for teams and brokerages.",features:["Everything in Pro","Up to 5 agent seats","Broker overview dashboard","Team performance metrics","Predictive Lead Scoring","Client Lifetime Tracker","Lead routing and assignment","Priority support"],primary:false},
            ].map((tier,i)=>(
              <div key={i} style={{background:tier.primary?c.white:c.bg,border:`1px solid ${tier.primary?c.text:c.border}`,borderRadius:10,padding:"36px 32px",position:"relative"}}>
                {tier.primary&&<div style={{position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",fontSize:10,fontWeight:600,color:"#fff",background:c.text,padding:"4px 16px",borderRadius:"0 0 6px 6px",letterSpacing:"0.04em"}}>MOST POPULAR</div>}
                <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>{tier.name}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:8}}>
                  <span style={{fontSize:40,fontWeight:700,letterSpacing:"-0.02em"}}>{tier.price}</span>
                  <span style={{fontSize:14,color:c.sub}}>{tier.period}</span>
                </div>
                <p style={{fontSize:14,color:c.sub,lineHeight:1.6,marginBottom:24}}>{tier.desc}</p>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
                  {tier.features.map((f,j)=>(
                    <div key={j} style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:4,height:4,borderRadius:"50%",background:tier.primary?c.text:c.dim,flexShrink:0}}/>
                      <span style={{fontSize:13,color:c.sub}}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:tier.primary?c.text:c.white,border:tier.primary?"none":`1px solid ${c.border}`,borderRadius:8,padding:"14px 0",textAlign:"center",fontSize:14,fontWeight:600,color:tier.primary?"#fff":c.sub,cursor:"pointer"}}>{tier.primary?"Start Free Trial":"Contact Us"}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>FAQ</div>
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
      <section id="signup" style={{padding:"80px 32px",textAlign:"center",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 12px"}}>Stop losing deals to chaos.</h2>
          <p style={{fontSize:15,color:c.sub,marginBottom:28}}>Join the first 20 agents building with Brikk.</p>
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            {!submitted?<>
              <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)}
                style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:8,padding:"13px 18px",fontSize:14,color:c.text,width:240,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={handleSubmit} style={{background:c.text,border:"none",borderRadius:8,padding:"13px 24px",fontSize:14,fontWeight:600,color:c.white,cursor:"pointer"}}>Get Early Access</button>
            </>:<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"13px 24px",fontSize:14,color:c.green,fontWeight:600}}>You're on the list.</div>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop:`1px solid ${c.border}`,padding:"28px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:1120,margin:"0 auto"}}>
        <span style={{fontSize:14,fontWeight:700}}>Brikk</span>
        <span style={{fontSize:12,color:c.dim}}>Built to close.</span>
      </footer>
    </div>
  )
}
