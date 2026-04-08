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
    <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${c.border}`,background:c.bg}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:c.green}}/>
          <span style={{fontSize:13,fontWeight:600}}>Brikk</span>
          <span style={{fontSize:11,color:c.dim}}>Live Preview</span>
        </div>
      </div>
      {/* Tab bar */}
      <div style={{display:"flex",gap:2,padding:"8px 16px",borderBottom:`1px solid ${c.border}`,overflowX:"auto"}}>
        {screens.map(s=>(
          <button key={s} onClick={()=>setScreen(s)} style={{background:screen===s?c.text:"transparent",color:screen===s?"#fff":c.dim,border:"none",borderRadius:4,padding:"4px 10px",fontSize:10,fontWeight:600,textTransform:"capitalize",cursor:"pointer",whiteSpace:"nowrap"}}>{s}</button>
        ))}
      </div>
      <div style={{padding:"16px",minHeight:360}}>

        {/* PIPELINE */}
        {screen==="pipeline"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div><div style={{fontSize:13,fontWeight:700}}>Lead Pipeline</div><div style={{fontSize:11,color:c.dim}}>24 active leads with predictive scoring</div></div>
          </div>
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
                <span style={{fontSize:10,fontWeight:600,color:l.days>=5?c.red:l.days>=3?c.amber:c.dim,width:24,textAlign:"right"}}>{l.days===0?"Now":`${l.days}d`}</span>
              </div>
            </div>
          )})}
        </div>}

        {/* MONEY */}
        {screen==="money"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[["YTD Closed","$127.4K",c.green],["Pending","$52.3K",c.amber]].map(([l,v,cl],i)=>(
              <div key={i} style={{background:c.bg,borderRadius:6,padding:"14px 16px",border:`1px solid ${c.borderLight}`}}>
                <div style={{fontSize:9,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>{l}</div>
                <div style={{fontSize:20,fontWeight:700,color:cl}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase"}}>Annual Goal</span>
              <span style={{fontSize:11,fontWeight:600,color:c.green}}>63.7% of $200K</span>
            </div>
            <MiniProgress value={63.7} color={c.green}/>
          </div>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",marginBottom:8}}>Monthly Income</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlyData} barSize={12}><XAxis dataKey="m" tick={{fill:c.dim,fontSize:9}} axisLine={false} tickLine={false}/><YAxis hide/><Bar dataKey="v" fill={c.text} radius={[3,3,0,0]} opacity={0.8}/></BarChart>
          </ResponsiveContainer>
        </div>}

        {/* COPILOT */}
        {screen==="copilot"&&<div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700}}>AI Copilot</div>
            <Tag bg={c.indigoSoft} color={c.indigo}>2 drafts ready</Tag>
          </div>
          {copilotDrafts.map((d,i)=>(
            <div key={i} style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:6,padding:"14px 16px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:700}}>{d.lead}</span>
                <Tag bg={d.priority==="Urgent"?c.redSoft:c.amberSoft} color={d.priority==="Urgent"?c.red:c.amber}>{d.priority}</Tag>
              </div>
              <div style={{fontSize:11,color:c.sub,lineHeight:1.6,marginBottom:8,padding:"8px 10px",background:c.white,borderRadius:4,border:`1px solid ${c.borderLight}`,fontStyle:"italic"}}>"{d.msg}"</div>
              <div style={{fontSize:10,color:c.indigo,lineHeight:1.5,marginBottom:10}}>{d.reason}</div>
              <div style={{display:"flex",gap:6}}>
                <span style={{fontSize:10,fontWeight:600,color:"#fff",background:c.green,padding:"5px 14px",borderRadius:4}}>Approve</span>
                <span style={{fontSize:10,fontWeight:600,color:c.dim,background:c.white,border:`1px solid ${c.border}`,padding:"5px 14px",borderRadius:4}}>Edit</span>
              </div>
            </div>
          ))}
        </div>}

        {/* VOICE */}
        {screen==="voice"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Voice-to-CRM</div>
          <div style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:8,padding:"20px",textAlign:"center",marginBottom:12}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:c.redSoft,border:`2px solid ${c.red}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:c.red}}/>
            </div>
            <div style={{fontSize:12,fontWeight:600}}>Tap to Record</div>
            <div style={{fontSize:10,color:c.dim,marginTop:2}}>Talk about your showing. Brikk handles the rest.</div>
          </div>
          <div style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:6,padding:"12px 14px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:c.green}}/>
              <span style={{fontSize:11,fontWeight:600}}>Today 11:15 AM</span>
              <span style={{fontSize:10,color:c.dim}}>0:28</span>
              <Tag bg={c.greenSoft} color={c.green}>Processed</Tag>
            </div>
            <div style={{fontSize:11,color:c.sub,lineHeight:1.6,fontStyle:"italic",marginBottom:8}}>"Just showed Elm Street to Sarah Mitchell. She loved the kitchen but worried about schools. Wants two more under 450."</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {[["Lead","Sarah Mitchell"],["Budget","Under $450K"],["Interest","Kitchen positive"],["Concern","School district"]].map(([k,v],i)=>(
                <div key={i} style={{background:c.white,borderRadius:4,padding:"6px 8px",border:`1px solid ${c.borderLight}`}}>
                  <div style={{fontSize:8,color:c.dim,textTransform:"uppercase"}}>{k}</div>
                  <div style={{fontSize:11,fontWeight:600,marginTop:1}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* CALENDAR */}
        {screen==="calendar"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Smart Calendar</div>
          {[
            {time:"9:00 AM",label:"Call Sarah Mitchell — showing follow-up",type:"call",color:c.indigo,ai:"Sarah viewed 3 new listings last night. Mention 445 Pine St."},
            {time:"10:00 AM",label:"Showing: 1891 Elm St with Rachel Torres",type:"showing",color:c.green,ai:null},
            {time:"2:00 PM",label:"Listing appointment: Linda Chen",type:"meeting",color:c.amber,ai:"Bring updated CMA. 280 Oak sold for $315K — 2% above asking."},
            {time:"Tomorrow",label:"Inspection: 742 Oak Avenue",type:"deadline",color:c.red,ai:"RISK: Lender unresponsive 3 days. Confirm financing first."},
            {time:"May 20",label:"The Nguyens — 2 year home anniversary",type:"touch",color:"#8B5CF6",ai:"Copilot text ready. Lifetime value: $30,600."},
          ].map((e,i)=>(
            <div key={i} style={{marginBottom:6,padding:"10px 12px",background:c.bg,borderRadius:6,border:`1px solid ${c.borderLight}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:e.ai?6:0}}>
                <div style={{width:3,height:24,borderRadius:2,background:e.color,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600}}>{e.label}</div>
                  <div style={{fontSize:10,color:c.dim}}>{e.time}</div>
                </div>
              </div>
              {e.ai&&<div style={{marginLeft:11,background:"rgba(67,56,202,0.04)",borderRadius:4,padding:"6px 8px",marginTop:4}}>
                <div style={{fontSize:9,fontWeight:600,color:"#8B5CF6",marginBottom:2}}>AI Context</div>
                <div style={{fontSize:10,color:c.sub,lineHeight:1.5}}>{e.ai}</div>
              </div>}
            </div>
          ))}
        </div>}

        {/* DEALS */}
        {screen==="deals"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Active Deals</div>
          {[
            {addr:"742 Oak Avenue",client:"Marcus Johnson",price:"$520,000",pct:65,days:19,flag:"amber",next:"Inspection — 48 hrs",risk:true},
            {addr:"1891 Elm Street",client:"Rachel Torres",price:"$415,000",pct:40,days:34,flag:"green",next:"Appraisal Jun 2",risk:false},
            {addr:"305 Birch Lane",client:"Kevin & Amy Ross",price:"$680,000",pct:20,days:46,flag:"green",next:"Awaiting lender docs",risk:false},
          ].map((d,i)=>(
            <div key={i} style={{padding:"12px 14px",marginBottom:8,borderRadius:6,border:`1px solid ${c.borderLight}`,background:c.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:12,fontWeight:600}}>{d.addr}</span>
                    {d.risk&&<Tag bg={c.amberSoft} color={c.amber}>Risk Alert</Tag>}
                  </div>
                  <div style={{fontSize:10,color:c.dim}}>{d.client}</div>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:c.green}}>{d.price}</span>
              </div>
              <MiniProgress value={d.pct} color={d.flag==="amber"?c.amber:c.green}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <span style={{fontSize:10,color:d.flag==="amber"?c.amber:c.sub}}>{d.next}</span>
                <span style={{fontSize:10,color:c.dim}}>{d.days}d to close</span>
              </div>
              {d.risk&&<div style={{background:c.amberSoft,borderRadius:4,padding:"6px 8px",marginTop:6}}>
                <div style={{fontSize:9,fontWeight:600,color:c.amber}}>Lender unresponsive 3 days — call loan officer today</div>
              </div>}
            </div>
          ))}
        </div>}

        {/* MARKETING */}
        {screen==="marketing"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Marketing ROI + Content</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
            {[["Top Source","Referrals — 42% conv",c.green],["Worst ROI","Zillow — 6% conv",c.red],["Cost/Close","$0 referrals vs $700 Zillow",c.amber],["Social Posts","3 AI-generated this week","#8B5CF6"]].map(([k,v,cl],i)=>(
              <div key={i} style={{background:c.bg,borderRadius:6,padding:"10px 12px",border:`1px solid ${c.borderLight}`}}>
                <div style={{fontSize:9,fontWeight:600,color:c.dim,textTransform:"uppercase"}}>{k}</div>
                <div style={{fontSize:11,fontWeight:600,color:cl,marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:6,padding:"12px 14px",marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",marginBottom:6}}>AI Market Report</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
              {[["Median","$387.5K"],["DOM","18 days"],["Supply","1.8 mo"]].map(([k,v],i)=>(
                <div key={i} style={{background:c.white,borderRadius:4,padding:"6px 8px",textAlign:"center"}}>
                  <div style={{fontSize:8,color:c.dim,textTransform:"uppercase"}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:700,marginTop:1}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:c.bg,border:`1px solid ${c.borderLight}`,borderRadius:6,padding:"12px 14px"}}>
            <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",marginBottom:6}}>Social Content Generator</div>
            <div style={{fontSize:11,color:c.sub,lineHeight:1.6,fontStyle:"italic"}}>"Median home prices in Westfield are up 4.2% this quarter with 1.8 months of supply. If you've been thinking about selling, this is a window worth paying attention to."</div>
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <span style={{fontSize:10,fontWeight:600,color:"#fff",background:c.text,padding:"4px 12px",borderRadius:4}}>Post</span>
              <span style={{fontSize:10,fontWeight:600,color:c.dim,background:c.white,border:`1px solid ${c.border}`,padding:"4px 12px",borderRadius:4}}>Regenerate</span>
            </div>
          </div>
        </div>}

        {/* SPEED */}
        {screen==="speed"&&<div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Speed to Lead</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[["Avg Response","4.2 min",c.green],["Under 5 Min","71%",c.green],["Missed This Week","2",c.amber],["Revenue Saved","$18.2K",c.indigo]].map(([k,v,cl],i)=>(
              <div key={i} style={{background:c.bg,borderRadius:6,padding:"12px 14px",border:`1px solid ${c.borderLight}`}}>
                <div style={{fontSize:9,fontWeight:600,color:c.dim,textTransform:"uppercase",marginBottom:4}}>{k}</div>
                <div style={{fontSize:18,fontWeight:700,color:cl}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{background:"rgba(67,56,202,0.04)",border:`1px solid ${c.indigoBorder}`,borderRadius:6,padding:"12px 14px"}}>
            <div style={{fontSize:10,fontWeight:600,color:c.indigo,marginBottom:4}}>AI Insight</div>
            <div style={{fontSize:11,color:c.sub,lineHeight:1.6}}>Weekend response times average 10.2 min vs 2.9 min weekdays. Enabling Copilot auto-response for weekends could capture 4 extra appointments/month — approximately $36K/year.</div>
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
    {q:"Is this another CRM?",a:"No. Brikk is the one screen you open every morning that tells you what to do. It works alongside your existing CRM or replaces the spreadsheets you're actually using."},
    {q:"How does AI Copilot work?",a:"Copilot reads each lead's full context and drafts a personalized message. You tap approve and it sends. Enable auto-mode and it handles after-hours leads while you sleep."},
    {q:"What is Voice-to-CRM?",a:"Leave a showing, talk into your phone for 30 seconds. Brikk transcribes it, updates the lead record, adjusts their temperature, and queues a follow-up. Zero typing."},
    {q:"Does it work on my phone?",a:"Yes. Brikk is a Progressive Web App. Add it to your home screen and it works like a native app. No app store needed."},
    {q:"Can my clients see their deal progress?",a:"Yes. The Client Portal gives each buyer or seller a link to track their deal — like a pizza tracker for real estate."},
    {q:"What does it cost?",a:"Pro is $99/month. Team is $199/month for up to 5 agents. No contracts, cancel anytime."},
    {q:"Does the AI learn my style?",a:"Yes. After 30 days, Brikk learns your conversion patterns, message tone, best lead sources, and response timing. It gets smarter every month."},
    {q:"How is this different from KVCore or Follow Up Boss?",a:"Those store data. Brikk drives action. One screen, AI that acts, intelligence that compounds over time."},
  ]

  return(
    <div style={{background:c.bg,color:c.text,fontFamily:"'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 32px",maxWidth:1120,margin:"0 auto"}}>
        <span style={{fontSize:18,fontWeight:700,letterSpacing:"-0.02em"}}>Brikk</span>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <a href="#features" style={{fontSize:13,fontWeight:500,color:c.sub}}>Features</a>
          <a href="#pricing" style={{fontSize:13,fontWeight:500,color:c.sub}}>Pricing</a>
          <a href="#faq" style={{fontSize:13,fontWeight:500,color:c.sub}}>FAQ</a>
          <a href="#signup" style={{fontSize:13,fontWeight:600,color:c.bg,background:c.text,padding:"8px 20px",borderRadius:6}}>Early Access</a>
        </div>
      </nav>

      <section style={{padding:"80px 32px 60px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{display:"flex",gap:48,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:"1 1 380px",maxWidth:460}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:20}}>The operating system for real estate agents</div>
            <h1 style={{fontSize:"clamp(32px,5vw,52px)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.1,margin:"0 0 20px"}}>Built to close.</h1>
            <p style={{fontSize:16,lineHeight:1.8,color:c.sub,margin:"0 0 32px",maxWidth:420}}>Brikk replaces the 8 apps you're juggling with one AI-powered command center. It sees your leads, manages your deals, drafts your follow-ups, and gets smarter every month you use it.</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {!submitted?<>
                <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"13px 18px",fontSize:14,color:c.text,width:240,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={handleSubmit} style={{background:c.text,border:"none",borderRadius:8,padding:"13px 24px",fontSize:14,fontWeight:600,color:c.white,cursor:"pointer"}}>Get Early Access</button>
              </>:<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"13px 24px",fontSize:14,color:c.green,fontWeight:600}}>You're on the list.</div>}
            </div>
            <p style={{fontSize:11,color:c.dim,marginTop:12}}>Free for the first 20 agents. No credit card.</p>
          </div>
          <div style={{flex:"1 1 480px",maxWidth:580}}><LiveDemo/></div>
        </div>
      </section>

      <div style={{borderTop:`1px solid ${c.border}`,borderBottom:`1px solid ${c.border}`,padding:"32px 0"}}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:"0 32px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:24}}>
          {[["78%","of buyers pick the first agent who responds"],["15 hrs","average agent lead response time"],["80%","of sales happen after the 5th follow-up"],["$340K","lost per team annually from missed follow-ups"]].map(([val,desc],i)=>(
            <div key={i} style={{textAlign:"center",flex:"1 1 200px"}}><div style={{fontSize:24,fontWeight:700}}>{val}</div><div style={{fontSize:12,color:c.dim,marginTop:4}}>{desc}</div></div>
          ))}
        </div>
      </div>

      <section id="features" style={{padding:"80px 32px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Everything you need</div>
          <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>14 features. One screen. Zero clutter.</h2>
          <p style={{fontSize:15,color:c.sub,margin:0,maxWidth:500}}>Command center, AI copilot, voice input, smart calendar, and more.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
          {[
            ["Lead Pipeline","Every lead color-coded by temperature with predictive scoring and days-since-contact alerts."],
            ["AI Copilot","Drafts personalized follow-ups. One-tap approve. Auto-responds after hours."],
            ["Voice-to-CRM","Talk after a showing. Brikk transcribes, updates the lead, and queues follow-up. Zero typing."],
            ["Smart Calendar","Auto-populated from deals. AI context on every event — not just reminders, intelligence."],
            ["Money Dashboard","YTD income, pending commissions, goal progress, 90-day forecast."],
            ["Transaction Tracker","Visual deal progress with deadline alerts and document checklists."],
            ["Deal Risk Alerts","AI flags problems before you notice. Lender silent? Financing at risk? You'll know first."],
            ["Client Portal","Shareable link for clients to track their deal. They stop calling. They start referring."],
            ["Predictive Scoring","After 90 days, AI learns which leads close for you specifically. Not industry averages — yours."],
            ["Client Lifetime Tracker","See total revenue per client including referrals. The Nguyens: $30,600 lifetime value."],
            ["AI Market Reports","One tap. Branded neighborhood report with real data. Text it to a seller lead instantly."],
            ["Social Content Generator","Market updates, just-listed posts, tips — in your voice, with real data."],
            ["Speed to Lead","Tracks response time and shows revenue impact. See where leads slip through."],
            ["Marketing ROI","Conversion by source. Not just lead count — actual closed deals per channel."],
          ].map(([title,desc],i)=>(
            <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"22px 20px"}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{title}</div>
              <div style={{fontSize:13,color:c.sub,lineHeight:1.6}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{padding:"64px 32px",borderTop:`1px solid ${c.border}`,textAlign:"center",background:c.white}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <h2 style={{fontSize:28,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 16px"}}>The longer you use Brikk, the harder it is to leave.</h2>
          <p style={{fontSize:15,color:c.sub,lineHeight:1.8,margin:0}}>After 90 days, Brikk knows your conversion patterns, your message style, your best lead sources, and your client relationships. That intelligence compounds every month.</p>
        </div>
      </section>

      <section id="pricing" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{marginBottom:48}}>
            <div style={{fontSize:12,fontWeight:600,color:c.sub,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:12}}>Pricing</div>
            <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 8px"}}>Less than your Zillow bill.</h2>
            <p style={{fontSize:15,color:c.sub,margin:0}}>No contracts. Cancel anytime.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:14}}>
            {[
              {name:"Pro",price:"$99",period:"/month",desc:"The full Brikk experience for solo agents.",features:["All 14 features","AI Copilot with auto-response","Voice-to-CRM","Smart Calendar","Client Portal","Market Reports","Social Content Generator","Mobile PWA"],primary:true},
              {name:"Team",price:"$199",period:"/month",desc:"Everything in Pro, built for teams.",features:["Everything in Pro","Up to 5 agent seats","Broker overview dashboard","Predictive Lead Scoring","Client Lifetime Tracker","Team performance metrics","Lead routing","Priority support"],primary:false},
            ].map((tier,i)=>(
              <div key={i} style={{background:c.white,border:`1px solid ${tier.primary?c.text:c.border}`,borderRadius:10,padding:"36px 32px",position:"relative"}}>
                {tier.primary&&<div style={{position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",fontSize:10,fontWeight:600,color:"#fff",background:c.text,padding:"4px 16px",borderRadius:"0 0 6px 6px"}}>MOST POPULAR</div>}
                <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>{tier.name}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:8}}><span style={{fontSize:40,fontWeight:700,letterSpacing:"-0.02em"}}>{tier.price}</span><span style={{fontSize:14,color:c.sub}}>{tier.period}</span></div>
                <p style={{fontSize:14,color:c.sub,lineHeight:1.6,marginBottom:24}}>{tier.desc}</p>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
                  {tier.features.map((f,j)=><div key={j} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:4,height:4,borderRadius:"50%",background:tier.primary?c.text:c.dim,flexShrink:0}}/><span style={{fontSize:13,color:c.sub}}>{f}</span></div>)}
                </div>
                <div style={{background:tier.primary?c.text:c.bg,border:tier.primary?"none":`1px solid ${c.border}`,borderRadius:8,padding:"14px 0",textAlign:"center",fontSize:14,fontWeight:600,color:tier.primary?"#fff":c.sub,cursor:"pointer"}}>{tier.primary?"Start Free Trial":"Contact Us"}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" style={{padding:"80px 32px",borderTop:`1px solid ${c.border}`,background:c.white}}>
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

      <section id="signup" style={{padding:"80px 32px",textAlign:"center",borderTop:`1px solid ${c.border}`}}>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <h2 style={{fontSize:32,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 12px"}}>Stop losing deals to chaos.</h2>
          <p style={{fontSize:15,color:c.sub,marginBottom:28}}>Join the first 20 agents building with Brikk.</p>
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            {!submitted?<>
              <input type="email" placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"13px 18px",fontSize:14,color:c.text,width:240,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={handleSubmit} style={{background:c.text,border:"none",borderRadius:8,padding:"13px 24px",fontSize:14,fontWeight:600,color:c.white,cursor:"pointer"}}>Get Early Access</button>
            </>:<div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:8,padding:"13px 24px",fontSize:14,color:c.green,fontWeight:600}}>You're on the list.</div>}
          </div>
        </div>
      </section>

      <footer style={{borderTop:`1px solid ${c.border}`,padding:"28px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:1120,margin:"0 auto"}}>
        <span style={{fontSize:14,fontWeight:700}}>Brikk</span>
        <span style={{fontSize:12,color:c.dim}}>Built to close.</span>
      </footer>
    </div>
  )
}
