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
const font="'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif"

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
          <span style={{fontSize:13,fontWeight:600,color:c.text}}>Brikk</span>
          <span style={{fontSize:11,color:c.dim,marginLeft:4}}>Live Preview</span>
        </div>
        <div style={{display:"flex",gap:2,background:c.white,borderRadius:6,padding:2,border:`1px solid ${c.border}`}}>
          {["pipeline","money","copilot","deals"].map(s=>(
            <button key={s} onClick={()=>setScreen(s)} style={{background:screen===s?c.text:"transparent",color:screen===s?"#fff":c.dim,border:"none",borderRadius:4,padding:"5px 14px",fontSize:11,fontWeight:600,textTransform:"capitalize",transition:"all 0.15s"}}>{s}</button>
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
    {q:"Is this another CRM?",a:"No. Brikk is the screen you actually look at every morning. It works alongside Follow Up Boss, KVCore, or whatever you already use — or replaces the spreadsheets you're really using. Think of it as the cockpit, not the engine."},
    {q:"How does AI Copilot work?",a:"Copilot reads each lead's full context — source, temperature, days since contact, property interests — and drafts a personalized message that sounds like you wrote it. You review it, tap approve, and it sends. Enable auto-mode and it handles after-hours leads while you sleep."},
    {q:"Does it work on my phone?",a:"Yes. Brikk is a Progressive Web App. Add it to your home screen from your browser and it works like a native app. No app store needed, no downloads, works on iPhone and Android."},
    {q:"What does it cost?",a:"Starter is $500 one-time for a Google Sheets command center. Pro is $99/month with the full web app and AI Copilot. Team is $199/month for up to 5 agents with a broker dashboard. No contracts, cancel anytime."},
    {q:"Can I try it first?",a:"Yes. We're running a free pilot for the first 20 agents. You get full access with your real data. No credit card required."},
    {q:"How is this different from Lofty, KVCore, or Follow Up Boss?",a:"Those are CRMs built to store data. Brikk is a command center built to drive action. We don't replace your CRM — we replace the 7 other tabs you have open. One screen that tells you who to call, what's due, and how much money is coming."},
  ]

  return(
    <div style={{background:c.bg,color:c.text,fontFamily:font}}>
      {/* Nav */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 32px",maxWidth:1120,margin:"0 auto"}}>
        <span style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em"}}>Brikk</span>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <a href="#features" style={{fontSize:13,fontWeight:500,color:c.sub}}>Features</a>
          <a href="#pricing" style={{fontSize:13,fontWeight:500,color:c.sub}}>Pricing</a>
          <a href="#faq" style={{fontSize:13,fontWeight:500,color:c.sub}}>FAQ</a>
          <a href="#signup" style={{fontSize:13,fontWeight:600,color:c.bg,background:c.text,padding:"8px 20px",borderRadius:6}}>Early Access</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{padding:"80px 32px 60px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{display:"flex",gap:60,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 400px",maxWidth:480}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:20}}>For real estate agents</div>
            <h1 style={{fontSize:"clamp(32px,5vw,52px)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.1,margin:"0 0 20px"}}>
              Built to close.
            </h1>
            <p style={{fontSize:16,lineHeight:1.8,color:c.sub,margin:"0 0 32px",maxWidth:420}}>
              Brikk replaces the 8 apps you're juggling with one command center. See your leads, money, deals, and deadlines — then let AI handle the follow-up you keep forgetting.
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {!submitted?<>
                <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)}
                  style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"13px 18px",fontSize:14,color:c.text,width:240,outline:"none"}}/>
                <button onClick={handleSubmit}
                  style={{background:c.text,border:"none",borderRadius:8,padding:"13px 24px",fontSize:14,fontWeight:600,color:c.white}}>
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
      <div style={{borderTop:`1px solid ${c.border}`,borderBottom:`1px solid ${c.border}`,padding:"32px 0",margin:"20px 0 0"}}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:"0 32px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:24}}>
          {[["78%","of buyers pick the first agent who responds"],["15 hrs","average agent lead response time"],["80%","of sales happen after the 5th follow-up"],["$340K","lost per team annually from missed follow-ups"]].map(([val,desc],i)=>(
            <div key={i} style={{textAlign:"center",flex:"1 1 200px"}}>
              <div style={{fontSize:24,fontWeight:700}}>{val}</div>
              <div style={{fontSize:12,color:c.dim,marginTop:4}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{padding:"80px 32px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>What you get</div>
          <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:0}}>Six screens. Zero clutter.</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
          {[
            ["Lead Pipeline","Every lead at a glance. Temperature, source, days since contact, pipeline stage. Know who needs you right now."],
            ["AI Copilot","Drafts personalized follow-ups, queues them for one-tap approval, and auto-responds after hours. The feature that pays for itself."],
            ["Money Dashboard","YTD income, pending commissions, goal progress, monthly trends. Financial clarity that keeps you motivated."],
            ["Transaction Tracker","Visual deal progress with deadline alerts, document checklists, and stage tracking. Never miss an inspection or financing date."],
            ["Speed to Lead","Tracks your response time and shows the revenue impact. See exactly where leads slip through."],
            ["Marketing ROI","Conversion rates by source. Not just lead count — actual closed deals per channel. Stop paying for what doesn't close."],
          ].map(([title,desc],i)=>(
            <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"28px 26px"}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{title}</div>
              <div style={{fontSize:14,color:c.sub,lineHeight:1.7}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Copilot spotlight */}
      <section style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{maxWidth:520,marginBottom:48}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>The difference</div>
            <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 16px"}}>Every CRM tells you to follow up. Brikk does it.</h2>
            <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:0}}>
              80% of real estate sales happen after the 5th contact. Most agents stop after one. Not because they're lazy — because they're showing houses, closing deals, and living their lives. Copilot handles the rest.
            </p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
            {[
              ["Context-aware drafts","Reads each lead's full history — source, temperature, days silent, property interests — and writes a message that sounds like you."],
              ["One-tap approval","Review on your phone at a red light. Tap approve. Done. Your lead gets a personalized text in under 30 seconds."],
              ["After-hours auto-response","A lead comes in at 11 PM. Copilot responds in seconds. You wake up to a booked showing instead of a lost lead."],
              ["Revenue tracking","See exactly how much money Copilot-assisted touchpoints generate. The ROI is visible, not theoretical."],
            ].map(([title,desc],i)=>(
              <div key={i} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:"24px 22px"}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>{title}</div>
                <div style={{fontSize:13,color:c.sub,lineHeight:1.7}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{padding:"80px 32px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Pricing</div>
          <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>Less than your Zillow bill. More useful than your CRM.</h2>
          <p style={{fontSize:15,color:c.sub,margin:0}}>No contracts. Cancel anytime.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
          {[
            {name:"Starter",price:"$500",period:"one-time",desc:"Google Sheets command center.",features:["Lead pipeline with color-coding","Commission tracker with goals","Pre-built formulas and charts","Setup walkthrough included"],primary:false},
            {name:"Pro",price:"$99",period:"/month",extra:"+ $1,500 setup",desc:"Full web app with AI Copilot.",features:["Everything in Starter","All 6 dashboard screens","AI Copilot message drafting","After-hours auto-response","Speed-to-lead tracking","Mobile PWA"],primary:true},
            {name:"Team",price:"$199",period:"/month",extra:"+ $3,000 setup",desc:"Multi-agent with broker view.",features:["Everything in Pro","Up to 5 agent seats","Broker overview dashboard","Team performance metrics","Lead routing","Priority support"],primary:false},
          ].map((tier,i)=>(
            <div key={i} style={{background:c.white,border:`1px solid ${tier.primary?c.text:c.border}`,borderRadius:10,padding:"32px 28px",position:"relative"}}>
              {tier.primary&&<div style={{position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",fontSize:10,fontWeight:600,color:"#fff",background:c.text,padding:"4px 16px",borderRadius:"0 0 6px 6px",letterSpacing:"0.04em"}}>MOST POPULAR</div>}
              <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{tier.name}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:4}}>
                <span style={{fontSize:34,fontWeight:700,letterSpacing:"-0.02em"}}>{tier.price}</span>
                <span style={{fontSize:13,color:c.sub}}>{tier.period}</span>
              </div>
              {tier.extra&&<div style={{fontSize:12,color:c.dim,marginBottom:8}}>{tier.extra}</div>}
              <p style={{fontSize:13,color:c.sub,lineHeight:1.6,marginBottom:20}}>{tier.desc}</p>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
                {tier.features.map((f,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:4,height:4,borderRadius:"50%",background:tier.primary?c.text:c.dim,flexShrink:0}}/>
                    <span style={{fontSize:13,color:c.sub}}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{background:tier.primary?c.text:c.bg,border:tier.primary?"none":`1px solid ${c.border}`,borderRadius:8,padding:"12px 0",textAlign:"center",fontSize:14,fontWeight:600,color:tier.primary?"#fff":c.sub}}>{tier.primary?"Start Free Trial":"Get Started"}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>FAQ</div>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 32px"}}>Common questions</h2>
          {faqs.map((f,i)=>(
            <div key={i} style={{borderBottom:`1px solid ${c.border}`}}>
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:15,fontWeight:600,color:c.text,textAlign:"left"}}>{f.q}</span>
                <span style={{fontSize:16,color:c.dim,flexShrink:0,marginLeft:16,transform:openFaq===i?"rotate(45deg)":"none",transition:"transform 0.2s"}}>+</span>
              </button>
              {openFaq===i&&<div style={{paddingBottom:20,fontSize:14,color:c.sub,lineHeight:1.7}}>{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section id="signup" style={{padding:"80px 32px",textAlign:"center",borderTop:`1px solid ${c.border}`}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 12px"}}>Stop losing deals to chaos.</h2>
          <p style={{fontSize:15,color:c.sub,marginBottom:28}}>Join the first 20 agents building with Brikk.</p>
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            {!submitted?<>
              <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)}
                style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"13px 18px",fontSize:14,color:c.text,width:240,outline:"none"}}/>
              <button onClick={handleSubmit} style={{background:c.text,border:"none",borderRadius:8,padding:"13px 24px",fontSize:14,fontWeight:600,color:c.white}}>Get Early Access</button>
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
