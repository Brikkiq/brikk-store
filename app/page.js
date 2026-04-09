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

const Tag=({children,bg,color})=><span style={{fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:3,background:bg,color}}>{children}</span>
const MiniProgress=({value,color})=><div style={{background:c.borderLight,borderRadius:2,height:3,width:"100%",overflow:"hidden"}}><div style={{width:`${value}%`,height:"100%",background:color,borderRadius:2}}/></div>

function LiveDemo(){
  const [screen,setScreen]=useState("actions")
  const tc={hot:{bg:c.redSoft,color:c.red},warm:{bg:c.amberSoft,color:c.amber},cold:{bg:"rgba(26,26,24,0.04)",color:c.dim}}
  const screens=["actions","copilot","leads","deals","calendar","marketing","messages"]
  return(
    <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${c.border}`,background:c.bg}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:c.green}}/>
          <span style={{fontSize:13,fontWeight:600}}>Brikk</span>
          <span style={{fontSize:11,color:c.dim}}>Live Preview</span>
        </div>
      </div>
      <div style={{display:"flex",gap:2,padding:"8px 12px",borderBottom:`1px solid ${c.border}`,overflowX:"auto"}}>
        {screens.map(s=>(
          <button key={s} onClick={()=>setScreen(s)} style={{background:screen===s?c.text:"transparent",color:screen===s?"#fff":c.dim,border:"none",borderRadius:4,padding:"4px 8px",fontSize:9,fontWeight:600,textTransform:"capitalize",cursor:"pointer",whiteSpace:"nowrap"}}>{s}</button>
        ))}
      </div>
      <div style={{padding:"16px",minHeight:320}}>

        {screen==="actions"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Good morning, Alex.</div>
          <div style={{fontSize:11,color:c.dim,marginBottom:12}}>You have 4 things that need your attention.</div>
          {[
            {icon:"!",label:"Call Sarah Mitchell — hot lead, 2 days since contact",color:c.red,bg:c.redSoft},
            {icon:"$",label:"742 Oak Ave — closing in 3 days",color:c.amber,bg:c.amberSoft},
            {icon:"AI",label:"Copilot has 3 follow-up drafts ready",color:"#6D28D9",bg:"rgba(109,40,217,0.05)"},
            {icon:"→",label:"Follow up: David Park — going cold",color:c.amber,bg:c.amberSoft},
          ].map((a,i)=>(
            <div key={i} style={{padding:"10px 12px",marginBottom:4,borderRadius:6,borderLeft:`3px solid ${a.color}`,background:a.bg,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:22,height:22,borderRadius:5,background:`${a.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:a.color}}>{a.icon}</div>
              <span style={{fontSize:11,fontWeight:500,color:c.text}}>{a.label}</span>
            </div>
          ))}
        </div>}

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
              <div style={{display:"flex",gap:6}}><span style={{fontSize:10,fontWeight:600,color:"#fff",background:c.green,padding:"4px 12px",borderRadius:4}}>Approve</span><span style={{fontSize:10,color:c.dim,border:`1px solid ${c.border}`,padding:"4px 12px",borderRadius:4}}>Edit</span></div>
            </div>
          ))}
        </div>}

        {screen==="leads"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>Lead Pipeline</div>
          <div style={{fontSize:11,color:c.dim,marginBottom:12}}>24 active leads</div>
          {demoLeads.map((l,i)=>{const t2=tc[l.temp];return(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderBottom:`1px solid ${c.borderLight}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:24,height:24,borderRadius:4,background:t2.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:t2.color}}>{l.name.split(" ").map(n=>n[0]).join("")}</div>
                <div><div style={{fontSize:11,fontWeight:600}}>{l.name}</div><div style={{fontSize:9,color:c.dim}}>{l.stage}</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <Tag bg={t2.bg} color={t2.color}>{l.temp.toUpperCase()}</Tag>
                <span style={{fontSize:10,fontWeight:600,width:36,textAlign:"right"}}>{l.price}</span>
              </div>
            </div>
          )})}
        </div>}

        {screen==="deals"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Active Deals</div>
          {[{addr:"742 Oak Ave",client:"Marcus Johnson",price:"$520,000",pct:65,days:19,flag:"amber"},{addr:"1891 Elm St",client:"Rachel Torres",price:"$415,000",pct:40,days:34,flag:"green"}].map((d,i)=>(
            <div key={i} style={{padding:"10px 12px",marginBottom:8,borderRadius:6,border:`1px solid ${c.borderLight}`,background:c.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,fontWeight:600}}>{d.addr}</span><span style={{fontSize:12,fontWeight:700,color:c.green}}>{d.price}</span></div>
              <MiniProgress value={d.pct} color={d.flag==="amber"?c.amber:c.green}/>
              <div style={{fontSize:10,color:c.dim,marginTop:4}}>{d.client} / {d.days}d to close</div>
            </div>
          ))}
        </div>}

        {screen==="calendar"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Smart Calendar</div>
          {[{time:"Today",label:"Call Sarah Mitchell",color:c.indigo,ai:"She viewed 3 listings last night."},{time:"Today",label:"Listing appt: Linda Chen",color:c.amber,ai:"Bring updated CMA."},{time:"Tomorrow",label:"Inspection: 742 Oak Ave",color:c.red,ai:"Lender unresponsive — confirm financing."}].map((e,i)=>(
            <div key={i} style={{marginBottom:6,padding:"10px 12px",background:c.bg,borderRadius:6,border:`1px solid ${c.borderLight}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:3,height:22,borderRadius:2,background:e.color}}/><div><div style={{fontSize:11,fontWeight:600}}>{e.label}</div><div style={{fontSize:9,color:c.dim}}>{e.time}</div></div></div>
              {e.ai&&<div style={{marginLeft:11,background:"rgba(67,56,202,0.04)",borderRadius:4,padding:"5px 8px",marginTop:4}}><div style={{fontSize:9,fontWeight:600,color:"#6D28D9"}}>AI Context</div><div style={{fontSize:9,color:c.sub}}>{e.ai}</div></div>}
            </div>
          ))}
        </div>}

        {screen==="marketing"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Marketing ROI</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
            {[["Top Source","Referrals — 42%",c.green],["Worst ROI","Zillow — 6%",c.red],["Total Leads","104",c.text],["Hot Rate","24%",c.amber]].map(([k,v,cl],i)=>(
              <div key={i} style={{background:c.bg,borderRadius:6,padding:"10px 12px",border:`1px solid ${c.borderLight}`}}><div style={{fontSize:8,fontWeight:600,color:c.dim,textTransform:"uppercase"}}>{k}</div><div style={{fontSize:11,fontWeight:600,color:cl,marginTop:2}}>{v}</div></div>
            ))}
          </div>
          <div style={{background:"rgba(67,56,202,0.04)",borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:9,fontWeight:600,color:c.indigo,marginBottom:2}}>AI Insight</div><div style={{fontSize:9,color:c.sub}}>Referrals convert 7x better than Zillow at $0 cost. Shift budget toward referral programs.</div></div>
        </div>}

        {screen==="messages"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Messages</div>
          <div style={{background:c.bg,borderRadius:8,border:`1px solid ${c.borderLight}`,padding:"12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={{width:28,height:28,borderRadius:6,background:c.redSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:c.red}}>SM</div><div><div style={{fontSize:12,fontWeight:600}}>Sarah Mitchell</div><div style={{fontSize:9,color:c.dim}}>Hot / Buyer / Zillow</div></div></div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}><div style={{background:c.text,color:"#fff",borderRadius:"10px 10px 2px 10px",padding:"8px 12px",fontSize:11,maxWidth:"80%"}}>Hi Sarah, I have 3 new listings in your range. Free for a call Thursday?</div></div>
            <div style={{display:"flex",justifyContent:"flex-start",marginBottom:8}}><div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:"10px 10px 10px 2px",padding:"8px 12px",fontSize:11,maxWidth:"80%"}}>Yes! Thursday at 2 works great.</div></div>
            <div style={{background:"rgba(109,40,217,0.05)",borderRadius:6,padding:"6px 10px",marginBottom:8}}><span style={{fontSize:9,fontWeight:600,color:"#6D28D9"}}>Draft with AI Copilot</span></div>
            <div style={{display:"flex",gap:6}}><div style={{flex:1,background:c.white,border:`1px solid ${c.border}`,borderRadius:6,padding:"8px 10px",fontSize:11,color:c.dim}}>Type a message...</div><div style={{background:c.text,color:"#fff",borderRadius:6,padding:"8px 14px",fontSize:11,fontWeight:600}}>Send</div></div>
          </div>
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
    {q:"Is this another CRM?",a:"No. Brikk is the one screen you open every morning that tells you what to do. It's simpler than a CRM, smarter than a spreadsheet, and costs a fraction of what you're paying now."},
    {q:"How does AI Copilot work?",a:"Copilot reads each lead's full context — their temperature, how long since you've been in touch, their stage, their notes — and drafts a personalized message. You tap approve, edit, or skip. That's it."},
    {q:"Can I actually text leads from the app?",a:"Yes. Brikk has a built-in messaging system. You can draft messages manually or let AI write them, then send directly to your lead's phone number. SMS delivery is included."},
    {q:"Does it work on my phone?",a:"Yes. Brikk is a Progressive Web App. Add it to your home screen on iPhone or Android and it works like a native app with a bottom tab bar. No app store needed."},
    {q:"Is the first 2 months really free?",a:"Yes. No credit card to start. Full access to every feature for 60 days. If it doesn't help you close more deals, you owe nothing."},
    {q:"How is this different from Lofty or Follow Up Boss?",a:"Those platforms cost $300-500/month, require hours of training, and are built for large brokerages. Brikk is $99/month, takes 5 minutes to set up, and is built for solo agents and small teams who want AI that actually does things — not just stores data."},
    {q:"What about my existing leads?",a:"Add them manually in about 2 minutes each, or share your referral link and new leads flow in automatically. We're building CSV import for the next update."},
    {q:"Does the AI learn over time?",a:"The more you use Brikk, the more context AI has about your leads, your deals, and your patterns. After 90 days, it knows your business better than any CRM you've ever used."},
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
          <a href="/login" style={{fontSize:13,fontWeight:600,color:c.bg,background:c.text,padding:"8px 20px",borderRadius:6}}>Start Free</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{padding:"80px 32px 60px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{display:"flex",gap:48,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 380px",maxWidth:460}}>
            <div style={{display:"inline-block",background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:20,padding:"6px 16px",marginBottom:20}}>
              <span style={{fontSize:12,fontWeight:600,color:c.green}}>First 2 months free — no credit card</span>
            </div>
            <h1 style={{fontSize:"clamp(34px,5vw,50px)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.08,margin:"0 0 20px"}}>
              One screen.<br/>Every lead.<br/>AI that acts.
            </h1>
            <p style={{fontSize:16,lineHeight:1.8,color:c.sub,margin:"0 0 12px",maxWidth:420}}>
              Brikk is the command center for real estate agents who are tired of juggling 8 apps and losing leads. Add your leads, and AI handles the follow-ups you keep forgetting.
            </p>
            <p style={{fontSize:14,fontWeight:600,color:c.text,margin:"0 0 28px"}}>
              $99/month. Not $300. Not $500. And the first 60 days are free.
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {!submitted?<>
                <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 18px",fontSize:14,color:c.text,width:240,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={handleSubmit} style={{background:c.text,border:"none",borderRadius:8,padding:"14px 28px",fontSize:14,fontWeight:600,color:c.white,cursor:"pointer"}}>Get 2 Months Free</button>
              </>:<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"14px 28px",fontSize:14,color:c.green,fontWeight:600}}>You're in. Check your email.</div>}
            </div>
          </div>
          <div style={{flex:"1 1 480px",maxWidth:580}}><LiveDemo/></div>
        </div>
      </section>

      {/* Stats */}
      <div style={{borderTop:`1px solid ${c.border}`,borderBottom:`1px solid ${c.border}`,padding:"32px 0"}}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:"0 32px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:24}}>
          {[["78%","of buyers pick the first agent who responds"],["15 hrs","average agent response time"],["80%","of sales happen after the 5th follow-up"],["$99/mo","vs $300-500 for competing platforms"]].map(([val,desc],i)=>(
            <div key={i} style={{textAlign:"center",flex:"1 1 200px"}}><div style={{fontSize:24,fontWeight:700}}>{val}</div><div style={{fontSize:12,color:c.dim,marginTop:4}}>{desc}</div></div>
          ))}
        </div>
      </div>

      {/* Problem/Solution */}
      <section style={{padding:"80px 32px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{maxWidth:680,margin:"0 auto",textAlign:"center",marginBottom:48}}>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 16px"}}>You're losing deals to your own workflow.</h2>
          <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:0}}>Zillow. CRM. Google Sheets. Calendar. Email. Phone. Notes app. By the time you've checked everything, the hot lead from Tuesday went with another agent.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20,maxWidth:800,margin:"0 auto"}}>
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
      <section id="how" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`,background:c.white}}>
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
      <section id="features" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`}}>
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
              ["Messages","Send texts to leads directly from the app. AI drafts messages for you. Full conversation history per lead. SMS delivery when connected."],
              ["Lead Capture Link","A shareable page at brikk.store/refer that anyone can fill out. Leads go straight to your pipeline. Put it on your business card, Instagram, email signature."],
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
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 16px"}}>The longer you use it, the smarter it gets.</h2>
          <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:0}}>After 90 days, Brikk knows your conversion patterns, your message style, your best lead sources, and your client relationships. That intelligence compounds monthly — and it doesn't transfer to a competitor.</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`}}>
        <div style={{maxWidth:560,margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>Simple pricing. No surprises.</h2>
          <p style={{fontSize:15,color:c.sub,marginBottom:32}}>One plan. Everything included. Cancel anytime.</p>

          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,padding:"36px 32px",position:"relative"}}>
            <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:c.green,color:"#fff",fontSize:11,fontWeight:600,padding:"5px 18px",borderRadius:20}}>First 2 months free</div>
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:4,marginBottom:4,marginTop:8}}>
              <span style={{fontSize:48,fontWeight:700,letterSpacing:"-0.02em"}}>$99</span>
              <span style={{fontSize:14,color:c.sub}}>/month</span>
            </div>
            <div style={{fontSize:14,color:c.green,fontWeight:600,marginBottom:24}}>$0 for your first 60 days</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,textAlign:"left",marginBottom:28}}>
              {["Quick Actions Dashboard","AI Copilot","Lead Pipeline","Deal Tracker","Smart Calendar","Marketing ROI","Messages & SMS","Lead Capture Link","Mobile App (PWA)","Notification Alerts","Email Confirmation","Unlimited Leads & Deals"].map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:4,height:4,borderRadius:"50%",background:c.text}}/><span style={{fontSize:13,color:c.sub}}>{f}</span></div>
              ))}
            </div>
            <a href="/login" style={{display:"block",background:c.text,borderRadius:8,padding:"14px 0",fontSize:14,fontWeight:600,color:"#fff",textDecoration:"none"}}>Start Free Trial</a>
            <p style={{fontSize:12,color:c.dim,marginTop:12}}>No credit card required</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`,background:c.white}}>
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
      <section style={{padding:"80px 32px",textAlign:"center",borderTop:`1px solid ${c.border}`}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <div style={{display:"inline-block",background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:20,padding:"6px 16px",marginBottom:20}}>
            <span style={{fontSize:12,fontWeight:600,color:c.green}}>Limited — first 2 months free</span>
          </div>
          <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 12px"}}>Your leads are waiting.</h2>
          <p style={{fontSize:15,color:c.sub,marginBottom:28}}>60 days free. No credit card. Everything included.</p>
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            {!submitted?<>
              <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"14px 18px",fontSize:14,color:c.text,width:240,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={handleSubmit} style={{background:c.text,border:"none",borderRadius:8,padding:"14px 28px",fontSize:14,fontWeight:600,color:c.white,cursor:"pointer"}}>Get 2 Months Free</button>
            </>:<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"14px 28px",fontSize:14,color:c.green,fontWeight:600}}>You're in. Check your email.</div>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop:`1px solid ${c.border}`,padding:"28px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:1120,margin:"0 auto",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:14,fontWeight:700}}>Brikk</span>
        <div style={{display:"flex",gap:20}}>
          <a href="/login" style={{fontSize:12,color:c.sub}}>Sign In</a>
          <a href="/demo" style={{fontSize:12,color:c.sub}}>Full Demo</a>
          <a href="/refer" style={{fontSize:12,color:c.sub}}>Referral Form</a>
        </div>
      </footer>
    </div>
  )
}
