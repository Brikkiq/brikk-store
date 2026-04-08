'use client'

import { useState } from "react"
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,LineChart,Line } from "recharts"

const c={
  bg:"#FAFAF9",white:"#FFFFFF",card:"#FFFFFF",raised:"#F4F4F2",
  border:"#E8E8E4",borderLight:"#F0F0EC",
  text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",
  accent:"#4338CA",accentSoft:"rgba(67,56,202,0.05)",accentBorder:"rgba(67,56,202,0.12)",
  green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",
  amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",amberBorder:"rgba(161,98,7,0.15)",
  red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",redBorder:"rgba(190,18,60,0.12)",
  purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)",purpleBorder:"rgba(109,40,217,0.12)",
}
const font="'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif"

/* ── DATA ── */
const monthly=[{m:"Jun",v:8200},{m:"Jul",v:14500},{m:"Aug",v:11800},{m:"Sep",v:19200},{m:"Oct",v:9400},{m:"Nov",v:22100},{m:"Dec",v:16800},{m:"Jan",v:12300},{m:"Feb",v:18700},{m:"Mar",v:24500},{m:"Apr",v:15900},{m:"May",v:21400}]
const sources=[{name:"Zillow",pct:38,conv:"6%",leads:50,closed:3,cpl:"$42",fill:"#4338CA"},{name:"Referrals",pct:24,conv:"42%",leads:12,closed:5,cpl:"$0",fill:"#16803C"},{name:"Open House",pct:16,conv:"18%",leads:18,closed:3,cpl:"$15",fill:"#A16207"},{name:"Social Media",pct:12,conv:"8%",leads:14,closed:1,cpl:"$28",fill:"#BE123C"},{name:"Website",pct:10,conv:"12%",leads:10,closed:1,cpl:"$35",fill:"#6D28D9"}]
const speedData=[{day:"Mon",avg:2.1},{day:"Tue",avg:4.8},{day:"Wed",avg:1.5},{day:"Thu",avg:3.2},{day:"Fri",avg:6.1},{day:"Sat",avg:8.4},{day:"Sun",avg:12.0}]

const leads=[
  {name:"Sarah Mitchell",src:"Zillow",temp:"hot",stage:"Showing Scheduled",days:1,price:"$425K",type:"Buyer",score:87,lifetime:"$0",aiNote:"High intent — viewed 12 listings in 3 days. Predicted close probability: 87%. Prioritize over all warm leads."},
  {name:"James Ortega",src:"Referral",temp:"hot",stage:"Offer Submitted",days:0,price:"$680K",type:"Buyer",score:92,lifetime:"$0",aiNote:"Offer at 97% of asking. 92% probability of acceptance based on your historical data."},
  {name:"Linda Chen",src:"Open House",temp:"warm",stage:"Initial Contact",days:3,price:"$310K",type:"Seller",score:64,lifetime:"$0",aiNote:"Attended open house 22 min. Sellers who ask about comps at open houses list within 30 days 64% of the time."},
  {name:"Marcus Johnson",src:"Social",temp:"hot",stage:"Under Contract",days:0,price:"$520K",type:"Buyer",score:95,lifetime:"$15,600",aiNote:"Contract signed. Inspection period active. Deal Risk: Lender response delayed — see Deals tab."},
  {name:"Emily Watson",src:"Website",temp:"warm",stage:"New Lead",days:5,price:"$275K",type:"Buyer",score:41,lifetime:"$0",aiNote:"SPEED ALERT: 5 days no contact. Your conversion drops 80% after 7 days without contact."},
  {name:"David Park",src:"Zillow",temp:"cold",stage:"Follow Up",days:12,price:"$390K",type:"Seller",score:28,lifetime:"$0",aiNote:"Going cold. Sellers who go 14+ days without contact choose another agent 73% of the time."},
  {name:"Nina Patel",src:"Referral",temp:"warm",stage:"Showing Scheduled",days:2,price:"$550K",type:"Buyer",score:78,lifetime:"$0",aiNote:"Referred by Kevin Ross. Your referral leads close at 42% vs 6% for Zillow. High priority."},
  {name:"The Nguyens",src:"Referral",temp:"past",stage:"Past Client",days:0,price:"—",type:"Past Client",score:0,lifetime:"$30,600",aiNote:"Original purchase $380K, commission $11,400. 2 referrals worth $19,200. Total lifetime value: $30,600. Anniversary in 12 days."},
]

const actions=[
  {label:"Call Sarah Mitchell — showing follow-up",priority:"high",time:"9:00 AM"},
  {label:"Inspection deadline: 742 Oak Ave — 48 hours",priority:"high",time:"10:00 AM"},
  {label:"New lead: Emily Watson — 5 days, no contact",priority:"high",time:"10:30 AM"},
  {label:"Lender unresponsive on 742 Oak — call loan officer",priority:"high",time:"11:00 AM"},
  {label:"Follow up David Park — 12 days since contact",priority:"medium",time:"1:00 PM"},
  {label:"Send CMA to Linda Chen — seller evaluation",priority:"medium",time:"2:00 PM"},
  {label:"Post market update to social media",priority:"low",time:"3:00 PM"},
  {label:"Client anniversary: The Nguyens — 2 years",priority:"low",time:"4:00 PM"},
]

const deals=[
  {address:"742 Oak Avenue",client:"Marcus Johnson",price:"$520,000",commission:"$15,600",close:"May 28",daysLeft:19,pct:65,flag:"amber",next:"Inspection deadline in 48 hours",docs:{done:8,total:12},done:[1,1,1,1,0,0],risk:"Lender has been unresponsive for 3 days. Historically, lender silence at this stage correlates with financing issues 40% of the time.",portal:"brikk.store/portal/742oak"},
  {address:"1891 Elm Street",client:"Rachel Torres",price:"$415,000",commission:"$12,450",close:"Jun 12",daysLeft:34,pct:40,flag:"green",next:"Appraisal scheduled for Jun 2",docs:{done:5,total:12},done:[1,1,0,0,0,0],risk:null,portal:"brikk.store/portal/1891elm"},
  {address:"305 Birch Lane",client:"Kevin & Amy Ross",price:"$680,000",commission:"$20,400",close:"Jun 24",daysLeft:46,pct:20,flag:"green",next:"Awaiting lender documentation",docs:{done:3,total:12},done:[1,0,0,0,0,0],risk:null,portal:"brikk.store/portal/305birch"},
]
const steps=["Contract","Inspection","Appraisal","Financing","Title","Closing"]

const copilotQueue=[
  {id:1,lead:"Emily Watson",channel:"Text",urgency:"high",context:"New lead, 5 days no contact",draft:"Hi Emily, this is Alex with Brikk Realty. I saw you were looking at properties in the $275K range — I just pulled 3 new listings that match. Would you have 15 minutes this week for a quick call?",why:"First-time buyers contacted in week one convert at 4x the rate. Your conversion drops 80% after day 7."},
  {id:2,lead:"David Park",channel:"Email",urgency:"medium",context:"Seller going cold, 12 days",draft:"Hi David, I put together an updated comparative market analysis for your property — values in your neighborhood shifted in the last two weeks. Happy to walk through it whenever works.",why:"Sellers who receive a CMA follow-up within 14 days are 2.5x more likely to list with you."},
  {id:3,lead:"The Nguyens",channel:"Text",urgency:"low",context:"Past client, 2-year anniversary",draft:"Hi Sarah and Kevin! Hard to believe it's been 2 years since you moved into your home on Maple Drive. Hope you're loving it. If you ever need anything don't hesitate to reach out.",why:"Past client anniversary texts generate referrals at 8x the rate of cold outreach. Lifetime value: $30,600."},
]
const copilotSent=[
  {lead:"Zillow Lead #247",time:"11:42 PM last night",result:"Replied 6 min later — showing booked",msg:"Auto-responded to after-hours Zillow inquiry."},
  {lead:"Zillow Lead #248",time:"6:15 AM today",result:"Opened, no reply yet",msg:"Auto-responded to early morning inquiry."},
]

const calendarEvents=[
  {date:"Today",time:"9:00 AM",label:"Call Sarah Mitchell — showing follow-up",color:c.accent,ai:"Sarah viewed 3 new listings last night. Mention 445 Pine St — matches her criteria."},
  {date:"Today",time:"10:00 AM",label:"Showing: 1891 Elm St with Rachel Torres",color:c.green,ai:null},
  {date:"Today",time:"2:00 PM",label:"Listing appointment: Linda Chen",color:c.amber,ai:"Bring updated CMA. 280 Oak sold for $315K last week — 2% above asking."},
  {date:"Tomorrow",time:"9:00 AM",label:"Inspection: 742 Oak Avenue",color:c.red,ai:"RISK: Lender unresponsive 3 days. Confirm financing before inspection."},
  {date:"May 20",time:"All day",label:"The Nguyens — 2 year home anniversary",color:c.purple,ai:"Copilot text ready. Lifetime value: $30,600. Anniversary touchpoints generate 8x referrals."},
  {date:"Jun 2",time:"10:00 AM",label:"Appraisal: 1891 Elm Street",color:c.green,ai:"Comparable sales support contract price. Appraiser: Mike Reynolds."},
]

const voiceNotes=[
  {id:1,time:"Today 11:15 AM",dur:"0:28",text:"Just showed Elm Street house to Sarah Mitchell. She loved the kitchen but worried about the school district. Wants two more in the same area under 450. Lease is up in August.",extracted:[["Lead","Sarah Mitchell"],["Interest","Kitchen, backyard"],["Concern","School district"],["Budget","Under $450K"],["Timeline","Lease up August"],["Action","Queue 2 listings under $450K"]]},
  {id:2,time:"Today 9:45 AM",dur:"0:18",text:"Quick note on James Ortega. His lender called back, pre-approval is solid. Expect clear to close by next Friday. Deal is looking smooth.",extracted:[["Lead","James Ortega"],["Update","Pre-approval confirmed"],["Timeline","Clear to close next Friday"],["Risk","Low"],["Action","No action needed"]]},
]

/* ── COMPONENTS ── */
const Label=({children})=><div style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>{children}</div>

const Stat=({label,value,note,color=c.text})=>(
  <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px",minWidth:140}}>
    <div style={{fontSize:10,fontWeight:600,color:c.dim,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:8}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color,letterSpacing:"-0.02em",lineHeight:1}}>{value}</div>
    {note&&<div style={{fontSize:11,color:c.sub,marginTop:6}}>{note}</div>}
  </div>
)

const Progress=({value,max,color})=>(
  <div style={{background:c.raised,borderRadius:3,height:4,width:"100%",overflow:"hidden"}}>
    <div style={{width:`${Math.min((value/max)*100,100)}%`,height:"100%",background:color,borderRadius:3}}/>
  </div>
)

const Tag2=({children,bg,color,border})=><span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:bg,color,border:border?`1px solid ${border}`:"none",letterSpacing:"0.02em"}}>{children}</span>

const AIBox=({title,children})=>(
  <div style={{background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:8,padding:"14px 16px",marginTop:14}}>
    {title&&<div style={{fontSize:10,fontWeight:600,color:c.purple,marginBottom:4}}>{title}</div>}
    <div style={{fontSize:13,color:c.sub,lineHeight:1.6}}>{children}</div>
  </div>
)

const ScoreBadge=({score})=>{
  if(!score)return null
  const cl=score>=80?c.green:score>=50?c.amber:c.red
  const bg=score>=80?c.greenSoft:score>=50?c.amberSoft:c.redSoft
  return <span style={{fontSize:10,fontWeight:600,color:cl,background:bg,padding:"2px 8px",borderRadius:4}}>{score}%</span>
}

export default function Demo(){
  const [tab,setTab]=useState("overview")
  const [selectedLead,setSelectedLead]=useState(null)
  const [approvedIds,setApprovedIds]=useState([])
  const [expandedVoice,setExpandedVoice]=useState(0)
  const goal=200000,closed=127400,pending=52300,pctDone=((closed/goal)*100).toFixed(1)
  const ps={high:{dot:c.red,w:600,cl:c.text},medium:{dot:c.amber,w:500,cl:c.sub},low:{dot:c.dim,w:400,cl:c.sub}}
  const ts={hot:{bg:c.redSoft,color:c.red,border:c.redBorder},warm:{bg:c.amberSoft,color:c.amber,border:c.amberBorder},cold:{bg:c.raised,color:c.dim,border:c.border},past:{bg:c.purpleSoft,color:c.purple,border:c.purpleBorder}}
  const tabs=["overview","copilot","voice","leads","deals","calendar","marketing","speed"]

  return(
    <div style={{background:c.bg,minHeight:"100vh",color:c.text,fontFamily:font,WebkitFontSmoothing:"antialiased"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* NAV */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 28px",borderBottom:`1px solid ${c.border}`,background:c.white,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,letterSpacing:"-0.01em"}}>Brikk</div>
          <div style={{fontSize:12,color:c.dim,marginTop:1}}>Command Center</div>
        </div>
        <nav style={{display:"flex",gap:2,background:c.bg,borderRadius:8,padding:3,border:`1px solid ${c.border}`,overflowX:"auto"}}>
          {tabs.map(v=><button key={v} onClick={()=>{setTab(v);setSelectedLead(null)}} style={{background:tab===v?c.text:"transparent",color:tab===v?"#fff":c.dim,border:"none",borderRadius:6,padding:"7px 14px",fontSize:11,fontWeight:600,fontFamily:font,textTransform:"capitalize",whiteSpace:"nowrap",cursor:"pointer",position:"relative"}}>{v}{v==="copilot"&&copilotQueue.filter(q=>!approvedIds.includes(q.id)).length>0&&<span style={{position:"absolute",top:3,right:3,width:5,height:5,borderRadius:"50%",background:c.purple}}/>}</button>)}
        </nav>
      </header>

      <main style={{padding:"24px 28px 60px",maxWidth:1200,margin:"0 auto"}}>

{/* ═══ OVERVIEW ═══ */}
{tab==="overview"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
    <Stat label="YTD Closed" value={`$${(closed/1000).toFixed(1)}K`} note={`${pctDone}% of $200K goal`} color={c.green}/>
    <Stat label="Pending" value={`$${(pending/1000).toFixed(1)}K`} note="3 deals in pipeline" color={c.amber}/>
    <Stat label="Active Leads" value="24" note="6 hot / 11 warm / 7 cold"/>
    <Stat label="Copilot Saves" value="$36.2K" note="Revenue from AI actions" color={c.purple}/>
  </div>
  <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"16px 20px",marginBottom:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <span style={{fontSize:11,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>Annual Goal</span>
      <span style={{fontSize:12,fontWeight:600,color:c.green}}>${(closed/1000).toFixed(1)}K of $200K</span>
    </div>
    <Progress value={closed} max={goal} color={c.green}/>
  </div>
  <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16}}>
    <div style={{flex:"1 1 340px",background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px"}}>
      <Label>Today's Actions</Label>
      {actions.map((a,i)=>{const s=ps[a.priority];return(
        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"10px 12px",marginBottom:4,borderRadius:6,background:a.priority==="high"?c.redSoft:"transparent",border:`1px solid ${a.priority==="high"?c.redBorder:"transparent"}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
            <span style={{fontSize:12,color:s.cl,fontWeight:s.w,lineHeight:1.4}}>{a.label}</span>
          </div>
          <span style={{fontSize:10,color:c.dim,whiteSpace:"nowrap"}}>{a.time}</span>
        </div>
      )})}
    </div>
    <div style={{flex:"1 1 340px",background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px"}}>
      <Label>Monthly Income</Label>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={monthly} barSize={16}><XAxis dataKey="m" tick={{fill:c.dim,fontSize:10,fontFamily:font}} axisLine={false} tickLine={false}/><YAxis tick={{fill:c.dim,fontSize:10,fontFamily:font}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}K`} width={32}/><Tooltip cursor={{fill:"rgba(0,0,0,0.03)"}} contentStyle={{background:c.white,border:`1px solid ${c.border}`,borderRadius:6,color:c.text,fontSize:12}} formatter={v=>[`$${v.toLocaleString()}`,"Income"]}/><Bar dataKey="v" fill={c.text} radius={[3,3,0,0]} opacity={0.85}/></BarChart>
      </ResponsiveContainer>
    </div>
  </div>
  <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px"}}>
    <Label>Active Deals</Label>
    {deals.map((d,i)=>(
      <div key={i} style={{padding:"14px 16px",marginBottom:8,borderRadius:6,border:`1px solid ${c.border}`,background:c.bg}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:13,fontWeight:600}}>{d.address}</span>
            {d.risk&&<Tag2 bg={c.amberSoft} color={c.amber} border={c.amberBorder}>Risk Alert</Tag2>}
          </div>
          <span style={{fontSize:13,fontWeight:700,color:c.green}}>{d.price}</span>
        </div>
        <Progress value={d.pct} max={100} color={d.flag==="amber"?c.amber:c.green}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
          <span style={{fontSize:11,color:d.flag==="amber"?c.amber:c.sub}}>{d.next}</span>
          <span style={{fontSize:11,color:c.dim}}>{d.daysLeft}d to close</span>
        </div>
      </div>
    ))}
  </div>
</>}

{/* ═══ COPILOT ═══ */}
{tab==="copilot"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
    <Stat label="Queued" value={copilotQueue.filter(q=>!approvedIds.includes(q.id)).length} note="Awaiting approval" color={c.purple}/>
    <Stat label="Sent This Week" value="14" note="By Copilot" color={c.green}/>
    <Stat label="Reply Rate" value="57%" note="3x industry average" color={c.accent}/>
    <Stat label="Revenue Impact" value="$36.2K" note="Copilot-assisted deals" color={c.purple}/>
  </div>
  <Label>Pending Your Approval</Label>
  {copilotQueue.filter(q=>!approvedIds.includes(q.id)).length===0?
    <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"24px",textAlign:"center",marginBottom:20}}><span style={{color:c.sub}}>All messages approved.</span></div>
  :<div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
    {copilotQueue.filter(q=>!approvedIds.includes(q.id)).map(q=>{
      const uc={high:{bg:c.redSoft,color:c.red,border:c.redBorder},medium:{bg:c.amberSoft,color:c.amber,border:c.amberBorder},low:{bg:c.raised,color:c.dim,border:c.border}}[q.urgency]
      return(
        <div key={q.id} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"20px 22px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:14,fontWeight:700}}>{q.lead}</span><Tag2 bg={uc.bg} color={uc.color} border={uc.border}>{q.urgency}</Tag2><Tag2 bg={c.purpleSoft} color={c.purple} border={c.purpleBorder}>{q.channel}</Tag2></div>
            <span style={{fontSize:11,color:c.dim}}>{q.context}</span>
          </div>
          <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Draft Message</div>
            <div style={{fontSize:13,color:c.text,lineHeight:1.7}}>{q.draft}</div>
          </div>
          <div style={{background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:6,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:600,color:c.purple,marginBottom:3}}>Why This Message, Why Now</div>
            <div style={{fontSize:12,color:c.sub,lineHeight:1.6}}>{q.why}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setApprovedIds(p=>[...p,q.id])} style={{background:c.green,border:"none",borderRadius:6,padding:"8px 20px",fontSize:12,fontWeight:600,color:"#fff",fontFamily:font,cursor:"pointer"}}>Approve & Send</button>
            <button style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"8px 20px",fontSize:12,fontWeight:500,color:c.sub,fontFamily:font,cursor:"pointer"}}>Edit</button>
            <button style={{background:"transparent",border:`1px solid ${c.border}`,borderRadius:6,padding:"8px 20px",fontSize:12,fontWeight:500,color:c.dim,fontFamily:font,cursor:"pointer"}}>Skip</button>
          </div>
        </div>
      )
    })}
  </div>}
  <Label>Auto-Sent (Off-Hours)</Label>
  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
    {copilotSent.map((s,i)=><div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"16px 18px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:6}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:600}}>{s.lead}</span><Tag2 bg={c.greenSoft} color={c.green} border={c.greenBorder}>Auto-Sent</Tag2></div>
        <span style={{fontSize:11,color:c.dim}}>{s.time}</span>
      </div>
      <div style={{fontSize:12,color:c.sub,marginBottom:4}}>{s.msg}</div>
      <div style={{fontSize:12,fontWeight:600,color:s.result.includes("Replied")?c.green:c.amber}}>{s.result}</div>
    </div>)}
  </div>
  <AIBox title="Copilot Summary">This week Copilot handled 3 after-hours inquiries, converted 1 to a showing in 6 minutes, and maintained a 57% reply rate. Projected: 2-3 additional closings per quarter worth $18K-$27K.</AIBox>
</>}

{/* ═══ VOICE ═══ */}
{tab==="voice"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
    <Stat label="Voice Notes" value="2" note="Processed today" color={c.accent}/>
    <Stat label="Time Saved" value="30 min" note="vs manual data entry" color={c.green}/>
    <Stat label="Leads Updated" value="2" note="Auto-updated" color={c.purple}/>
  </div>
  <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"28px",textAlign:"center",marginBottom:20}}>
    <div style={{width:64,height:64,borderRadius:"50%",background:c.redSoft,border:`2px solid ${c.red}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",cursor:"pointer"}}>
      <div style={{width:24,height:24,borderRadius:"50%",background:c.red}}/>
    </div>
    <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Tap to Record</div>
    <div style={{fontSize:12,color:c.dim}}>Talk about your showing, meeting, or update. Brikk handles the rest.</div>
  </div>
  <Label>Recent Voice Notes</Label>
  {voiceNotes.map((v,i)=>(
    <div key={v.id} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"20px 22px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:c.green}}/>
          <span style={{fontSize:13,fontWeight:600}}>{v.time}</span>
          <span style={{fontSize:12,color:c.dim}}>{v.dur}</span>
          <Tag2 bg={c.greenSoft} color={c.green} border={c.greenBorder}>Processed</Tag2>
        </div>
        <button onClick={()=>setExpandedVoice(expandedVoice===v.id?null:v.id)} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:4,padding:"4px 12px",fontSize:11,fontWeight:500,color:c.sub,fontFamily:font,cursor:"pointer"}}>{expandedVoice===v.id?"Collapse":"Expand"}</button>
      </div>
      <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Transcript</div>
        <div style={{fontSize:13,color:c.sub,lineHeight:1.7,fontStyle:"italic"}}>"{v.text}"</div>
      </div>
      {(expandedVoice===v.id||i===0)&&<>
        <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>AI Extracted</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:6}}>
          {v.extracted.map(([k,val],j)=>(
            <div key={j} style={{background:c.bg,borderRadius:6,padding:"8px 10px",border:`1px solid ${c.border}`}}>
              <div style={{fontSize:9,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>{k}</div>
              <div style={{fontSize:12,fontWeight:600,marginTop:2,color:k==="Action"?c.purple:c.text}}>{val}</div>
            </div>
          ))}
        </div>
      </>}
    </div>
  ))}
</>}

{/* ═══ LEADS ═══ */}
{tab==="leads"&&<>
  {selectedLead!==null?(()=>{const l=leads[selectedLead];const s=ts[l.temp];return(
    <div>
      <button onClick={()=>setSelectedLead(null)} style={{background:"none",border:"none",color:c.sub,fontSize:12,fontWeight:500,fontFamily:font,marginBottom:16,padding:0,cursor:"pointer"}}>Back to all leads</button>
      <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:8,background:s.bg,border:`1px solid ${s.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:s.color}}>{l.name.split(" ").map(n=>n[0]).join("")}</div>
            <div><div style={{fontSize:18,fontWeight:700}}>{l.name}</div><div style={{fontSize:12,color:c.sub,marginTop:2}}>{l.type} / {l.src}</div></div>
          </div>
          <div style={{display:"flex",gap:8}}><Tag2 bg={s.bg} color={s.color} border={s.border}>{l.temp==="past"?"PAST CLIENT":l.temp.toUpperCase()}</Tag2><ScoreBadge score={l.score}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:20}}>
          {[["Price",l.price,c.text],["Last Contact",l.days===0?"Today":`${l.days}d ago`,l.days>=5?c.red:l.days>=3?c.amber:c.green],["Source",l.src,c.text],["Lifetime Value",l.lifetime,l.lifetime!=="$0"?c.purple:c.dim]].map(([lb,vl,cl],i)=>(
            <div key={i} style={{background:c.bg,borderRadius:6,padding:"12px 14px",border:`1px solid ${c.border}`}}>
              <div style={{fontSize:10,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>{lb}</div>
              <div style={{fontSize:16,fontWeight:700,color:cl}}>{vl}</div>
            </div>
          ))}
        </div>
        <AIBox title="AI Insight">{l.aiNote}</AIBox>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16}}>
          {["Called","Texted","Emailed","Met In Person","Voice Note"].map((a,i)=>(
            <button key={i} style={{background:a==="Voice Note"?c.purpleSoft:c.bg,border:`1px solid ${a==="Voice Note"?c.purpleBorder:c.border}`,borderRadius:6,padding:"8px 16px",fontSize:12,fontWeight:500,color:a==="Voice Note"?c.purple:c.sub,fontFamily:font,cursor:"pointer"}}>Log: {a}</button>
          ))}
        </div>
      </div>
    </div>
  )})():<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:12,color:c.sub}}>8 leads with predictive scoring + lifetime value</div>
    </div>
    {leads.map((l,i)=>{const s=ts[l.temp];return(
      <div key={i} onClick={()=>setSelectedLead(i)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:`1px solid ${c.border}`,background:i%2===0?c.bg:c.white,cursor:"pointer",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:6,background:s.bg,border:`1px solid ${s.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:s.color,flexShrink:0}}>{l.name.split(" ").map(n=>n[0]).join("")}</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:600}}>{l.name}</span><ScoreBadge score={l.score}/></div>
            <div style={{fontSize:11,color:c.dim}}>{l.type} / {l.src} / {l.stage}{l.lifetime!=="$0"?` / LTV: ${l.lifetime}`:""}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Tag2 bg={s.bg} color={s.color} border={s.border}>{l.temp==="past"?"PAST":l.temp.toUpperCase()}</Tag2>
          <span style={{fontSize:12,fontWeight:600,width:44,textAlign:"right"}}>{l.price}</span>
          {l.temp!=="past"&&<span style={{fontSize:12,fontWeight:600,color:l.days>=5?c.red:l.days>=3?c.amber:c.dim,width:30,textAlign:"right"}}>{l.days===0?"Now":`${l.days}d`}</span>}
        </div>
      </div>
    )})}
  </>}
</>}

{/* ═══ DEALS ═══ */}
{tab==="deals"&&<>
  <div style={{fontSize:12,color:c.sub,marginBottom:16}}>3 active transactions — ${(deals.reduce((s2,d)=>s2+parseInt(d.commission.replace(/[$,]/g,"")),0)/1000).toFixed(1)}K pending commission</div>
  {deals.map((d,i)=>(
    <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"22px 24px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16,fontWeight:700}}>{d.address}</span>{d.risk&&<Tag2 bg={c.amberSoft} color={c.amber} border={c.amberBorder}>Risk Alert</Tag2>}</div><div style={{fontSize:12,color:c.sub,marginTop:3}}>{d.client} / Closing {d.close}</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:700,color:c.green}}>{d.price}</div><div style={{fontSize:11,color:c.dim}}>Commission: {d.commission}</div></div>
      </div>
      <Progress value={d.pct} max={100} color={d.flag==="amber"?c.amber:c.green}/>
      <div style={{display:"flex",gap:6,marginTop:14,flexWrap:"wrap"}}>
        {steps.map((s2,si)=><div key={si} style={{fontSize:11,fontWeight:500,padding:"5px 14px",borderRadius:4,background:d.done[si]?c.greenSoft:c.bg,color:d.done[si]?c.green:c.dim,border:`1px solid ${d.done[si]?c.greenBorder:c.border}`}}>{s2}</div>)}
      </div>
      {d.risk&&<div style={{background:c.amberSoft,border:`1px solid ${c.amberBorder}`,borderRadius:6,padding:"12px 14px",marginTop:14}}>
        <div style={{fontSize:10,fontWeight:600,color:c.amber,marginBottom:3}}>Deal Risk Alert</div>
        <div style={{fontSize:12,color:c.sub,lineHeight:1.6}}>{d.risk}</div>
      </div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:12,borderTop:`1px solid ${c.border}`,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:11,color:c.dim}}>Docs: {d.docs.done}/{d.docs.total}</span>
          <span style={{fontSize:11,color:c.purple,fontWeight:500}}>Portal: {d.portal}</span>
        </div>
        <span style={{fontSize:12,fontWeight:600,color:c.dim}}>{d.daysLeft} days</span>
      </div>
    </div>
  ))}
  <AIBox title="Client Portal">Each deal has a shareable portal link. Clients see deal progress, upcoming dates, and documents needed. They stop calling you. They start telling friends.</AIBox>
</>}

{/* ═══ CALENDAR ═══ */}
{tab==="calendar"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
    <Stat label="Today" value="3" note="Events auto-populated" color={c.accent}/>
    <Stat label="Deadlines" value="2" note="This week — 1 high risk" color={c.red}/>
    <Stat label="Touchpoints" value="1" note="Anniversary coming" color={c.purple}/>
  </div>
  <Label>Upcoming Events</Label>
  {calendarEvents.map((e,i)=>(
    <div key={i} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"16px 18px",marginBottom:6}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:e.ai?8:0}}>
        <div style={{width:4,height:28,borderRadius:2,background:e.color,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600}}>{e.label}</div>
          <div style={{fontSize:11,color:c.dim}}>{e.date} at {e.time}</div>
        </div>
      </div>
      {e.ai&&<div style={{marginLeft:14,background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:6,padding:"8px 10px",marginTop:4}}>
        <div style={{fontSize:9,fontWeight:600,color:c.purple,marginBottom:2}}>AI Context</div>
        <div style={{fontSize:11,color:c.sub,lineHeight:1.5}}>{e.ai}</div>
      </div>}
    </div>
  ))}
  <AIBox title="Calendar Intelligence">Your calendar auto-syncs with your pipeline. When you add a deal, every milestone lands here. AI adds context to each event — not just reminders, intelligence.</AIBox>
</>}

{/* ═══ MARKETING ═══ */}
{tab==="marketing"&&<>
  <div style={{fontSize:12,color:c.sub,marginBottom:16}}>Lead source performance + content tools</div>
  <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16}}>
    <div style={{flex:"1 1 280px",background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px"}}>
      <Label>Lead Distribution</Label>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <div style={{width:110,height:110,flexShrink:0}}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sources} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="pct" stroke="none" paddingAngle={2}>{sources.map((s2,i)=><Cell key={i} fill={s2.fill}/>)}</Pie></PieChart></ResponsiveContainer></div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>{sources.map((s2,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:6,height:6,borderRadius:2,background:s2.fill}}/><span style={{fontSize:12,color:c.sub,minWidth:80}}>{s2.name}</span><span style={{fontSize:12,fontWeight:600}}>{s2.pct}%</span></div>)}</div>
      </div>
    </div>
    <div style={{flex:"1 1 400px",background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px"}}>
      <Label>Conversion by Source</Label>
      <div style={{display:"grid",gridTemplateColumns:"100px 50px 50px 50px 50px",gap:8,padding:"0 0 8px",borderBottom:`1px solid ${c.border}`}}>{["Source","Leads","Closed","Conv.","CPL"].map((h,i)=><span key={i} style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase"}}>{h}</span>)}</div>
      {sources.map((s2,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"100px 50px 50px 50px 50px",gap:8,padding:"10px 0",borderBottom:`1px solid ${c.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:2,background:s2.fill}}/><span style={{fontSize:12}}>{s2.name}</span></div>
        <span style={{fontSize:12,color:c.sub}}>{s2.leads}</span>
        <span style={{fontSize:12,fontWeight:600,color:c.green}}>{s2.closed}</span>
        <span style={{fontSize:12,fontWeight:600,color:parseFloat(s2.conv)>=20?c.green:parseFloat(s2.conv)>=10?c.amber:c.red}}>{s2.conv}</span>
        <span style={{fontSize:12,color:c.sub}}>{s2.cpl}</span>
      </div>)}
    </div>
  </div>
  {/* Market Report */}
  <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"20px 22px",marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <Label>AI Market Report</Label>
      <button style={{background:c.text,border:"none",borderRadius:6,padding:"8px 18px",fontSize:12,fontWeight:600,color:"#fff",fontFamily:font,cursor:"pointer"}}>Generate</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
      {[["Median Price","$387,500","Up 4.2%"],["Days on Market","18","Down from 24"],["Inventory","142 homes","1.8 months"],["Sale/List","98.2%","Sellers market"]].map(([k,v,d],i)=>(
        <div key={i} style={{background:c.bg,borderRadius:6,padding:"12px 14px"}}>
          <div style={{fontSize:9,color:c.dim,textTransform:"uppercase"}}>{k}</div>
          <div style={{fontSize:16,fontWeight:700,marginTop:2}}>{v}</div>
          <div style={{fontSize:10,color:c.green,marginTop:2}}>{d}</div>
        </div>
      ))}
    </div>
  </div>
  {/* Social */}
  <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"20px 22px"}}>
    <Label>Social Content Generator</Label>
    <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:13,color:c.text,lineHeight:1.8}}>Median home prices in Westfield are up 4.2% this quarter with just 1.8 months of supply. If you've been thinking about selling, this is a window worth paying attention to.</div>
    </div>
    <div style={{display:"flex",gap:8}}>
      <button style={{background:c.text,border:"none",borderRadius:6,padding:"8px 18px",fontSize:12,fontWeight:600,color:"#fff",fontFamily:font,cursor:"pointer"}}>Copy</button>
      <button style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"8px 18px",fontSize:12,fontWeight:500,color:c.sub,fontFamily:font,cursor:"pointer"}}>Regenerate</button>
    </div>
  </div>
  <AIBox title="AI Insight">Referrals convert at 7x the rate of Zillow at $0 cost. Consider reallocating $500/mo from paid channels to a past-client touchpoint program.</AIBox>
</>}

{/* ═══ SPEED ═══ */}
{tab==="speed"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
    <Stat label="Avg Response" value="4.2 min" note="Goal: under 5 min" color={c.green}/>
    <Stat label="Under 5 Min" value="71%" note="Industry avg: under 10%"/>
    <Stat label="Missed" value="2" note="Down from 5 last week" color={c.amber}/>
    <Stat label="Revenue Saved" value="$18.2K" note="By fast response" color={c.accent}/>
  </div>
  <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",marginBottom:16}}>
    <Label>Avg Response Time by Day</Label>
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={speedData}><XAxis dataKey="day" tick={{fill:c.dim,fontSize:10,fontFamily:font}} axisLine={false} tickLine={false}/><YAxis tick={{fill:c.dim,fontSize:10,fontFamily:font}} axisLine={false} tickLine={false} domain={[0,15]} tickFormatter={v=>`${v}m`} width={32}/><Tooltip contentStyle={{background:c.white,border:`1px solid ${c.border}`,borderRadius:6,color:c.text,fontSize:12}} formatter={v=>[`${v} min`,"Avg"]}/><Line type="monotone" dataKey="avg" stroke={c.accent} strokeWidth={2} dot={{fill:c.accent,r:3}}/><Line type="monotone" dataKey={()=>5} stroke={c.red} strokeWidth={1} strokeDasharray="4 4" dot={false}/></LineChart>
    </ResponsiveContainer>
    <div style={{display:"flex",gap:16,marginTop:8}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:2,background:c.accent}}/><span style={{fontSize:10,color:c.dim}}>Your avg</span></div>
      <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:2,background:c.red,opacity:0.5}}/><span style={{fontSize:10,color:c.dim}}>5 min target</span></div>
    </div>
  </div>
  <AIBox title="AI Insight">Weekend response times average 10.2 min vs 2.9 min weekdays. Enabling Copilot auto-response for weekends could capture 4 extra appointments/month — approximately $36K in annual commission.</AIBox>
</>}

      </main>
      <footer style={{textAlign:"center",padding:"24px 28px",borderTop:`1px solid ${c.border}`,background:c.white}}>
        <span style={{fontSize:12,fontWeight:600,color:c.dim}}>Brikk — Built to Close</span>
      </footer>
    </div>
  )
}
