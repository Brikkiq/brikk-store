'use client'

import { useState } from "react"
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,LineChart,Line } from "recharts"

const t={bg:"#09090B",surface:"#111113",raised:"#19191C",border:"rgba(255,255,255,0.07)",text:"#EDEDEF",sub:"#8B8B8E",dim:"#5A5A5D",accent:"#3B82F6",accentSoft:"rgba(59,130,246,0.08)",accentBorder:"rgba(59,130,246,0.18)",green:"#22C55E",greenSoft:"rgba(34,197,94,0.08)",greenBorder:"rgba(34,197,94,0.18)",amber:"#EAB308",amberSoft:"rgba(234,179,8,0.08)",amberBorder:"rgba(234,179,8,0.18)",red:"#EF4444",redSoft:"rgba(239,68,68,0.08)",redBorder:"rgba(239,68,68,0.18)",purple:"#8B5CF6",purpleSoft:"rgba(139,92,246,0.06)",purpleBorder:"rgba(139,92,246,0.18)"}
const font="'Inter',-apple-system,BlinkMacSystemFont,sans-serif"

/* ── DATA ── */
const monthly=[{m:"Jun",v:8200},{m:"Jul",v:14500},{m:"Aug",v:11800},{m:"Sep",v:19200},{m:"Oct",v:9400},{m:"Nov",v:22100},{m:"Dec",v:16800},{m:"Jan",v:12300},{m:"Feb",v:18700},{m:"Mar",v:24500},{m:"Apr",v:15900},{m:"May",v:21400}]
const sources=[{name:"Zillow",pct:38,conv:"6%",leads:50,closed:3,cpl:"$42",fill:"#3B82F6"},{name:"Referrals",pct:24,conv:"42%",leads:12,closed:5,cpl:"$0",fill:"#22C55E"},{name:"Open House",pct:16,conv:"18%",leads:18,closed:3,cpl:"$15",fill:"#EAB308"},{name:"Social Media",pct:12,conv:"8%",leads:14,closed:1,cpl:"$28",fill:"#EF4444"},{name:"Website",pct:10,conv:"12%",leads:10,closed:1,cpl:"$35",fill:"#8B5CF6"}]
const speedData=[{day:"Mon",avg:2.1},{day:"Tue",avg:4.8},{day:"Wed",avg:1.5},{day:"Thu",avg:3.2},{day:"Fri",avg:6.1},{day:"Sat",avg:8.4},{day:"Sun",avg:12.0}]

const leads=[
  {name:"Sarah Mitchell",src:"Zillow",temp:"hot",stage:"Showing Scheduled",days:1,price:"$425K",type:"Buyer",score:87,scoreLabel:"High",lifetime:"$0",aiNote:"High intent — viewed 12 listings in 3 days. Predicted close probability: 87%. Recommend prioritizing over all warm leads."},
  {name:"James Ortega",src:"Referral",temp:"hot",stage:"Offer Submitted",days:0,price:"$680K",type:"Buyer",score:92,scoreLabel:"Very High",lifetime:"$0",aiNote:"Offer at 97% of asking. Strong pre-approval. 92% probability of acceptance based on your historical data with similar offers."},
  {name:"Linda Chen",src:"Open House",temp:"warm",stage:"Initial Contact",days:3,price:"$310K",type:"Seller",score:64,scoreLabel:"Medium",lifetime:"$0",aiNote:"Attended open house 22 min. Asked about comps. Sellers who ask about comps at open houses list within 30 days 64% of the time for you."},
  {name:"Marcus Johnson",src:"Social",temp:"hot",stage:"Under Contract",days:0,price:"$520K",type:"Buyer",score:95,scoreLabel:"Closing",lifetime:"$15,600",aiNote:"Contract signed. Inspection period active. Deal Risk: Lender response delayed — see Deals tab for alert."},
  {name:"Emily Watson",src:"Website",temp:"warm",stage:"New Lead",days:5,price:"$275K",type:"Buyer",score:41,scoreLabel:"Low",lifetime:"$0",aiNote:"SPEED ALERT: 5 days no contact. First-time buyer profile. Your conversion rate drops 80% after 7 days without contact."},
  {name:"David Park",src:"Zillow",temp:"cold",stage:"Follow Up",days:12,price:"$390K",type:"Seller",score:28,scoreLabel:"Low",lifetime:"$0",aiNote:"Going cold. Sellers who go 14+ days without contact choose another agent 73% of the time in your market."},
  {name:"Nina Patel",src:"Referral",temp:"warm",stage:"Showing Scheduled",days:2,price:"$550K",type:"Buyer",score:78,scoreLabel:"High",lifetime:"$0",aiNote:"Referred by Kevin Ross. Your referral leads close at 42% vs 6% for Zillow. High priority."},
  {name:"The Nguyens",src:"Referral",temp:"past",stage:"Past Client",days:0,price:"—",type:"Past Client",score:0,scoreLabel:"—",lifetime:"$30,600",aiNote:"Original purchase $380K, commission $11,400. 2 referrals worth $19,200. Total lifetime value: $30,600. Anniversary in 12 days — Copilot text ready."},
]

const actions=[
  {label:"Call Sarah Mitchell — showing follow-up",priority:"high",time:"9:00 AM",type:"call"},
  {label:"Inspection deadline: 742 Oak Ave — 48 hours",priority:"high",time:"10:00 AM",type:"deadline"},
  {label:"New lead: Emily Watson — 5 days, no contact",priority:"high",time:"10:30 AM",type:"speed"},
  {label:"Lender unresponsive on 742 Oak — call loan officer",priority:"high",time:"11:00 AM",type:"risk"},
  {label:"Follow up David Park — 12 days since contact",priority:"medium",time:"1:00 PM",type:"call"},
  {label:"Send CMA to Linda Chen — seller evaluation",priority:"medium",time:"2:00 PM",type:"report"},
  {label:"Post market update to social media",priority:"low",time:"3:00 PM",type:"social"},
  {label:"Client anniversary: The Nguyens — 2 years",priority:"low",time:"4:00 PM",type:"touch"},
]

const deals=[
  {address:"742 Oak Avenue",client:"Marcus Johnson",price:"$520,000",commission:"$15,600",close:"May 28",daysLeft:19,pct:65,flag:"amber",next:"Inspection deadline in 48 hours",docs:{done:8,total:12},done:[1,1,1,1,0,0],risk:{level:"medium",msg:"Lender has been unresponsive for 3 days. Historically, lender silence at this stage correlates with financing issues 40% of the time. Recommend calling loan officer today.",portalUrl:"brikk.store/portal/742oak"}},
  {address:"1891 Elm Street",client:"Rachel Torres",price:"$415,000",commission:"$12,450",close:"Jun 12",daysLeft:34,pct:40,flag:"green",next:"Appraisal scheduled for Jun 2",docs:{done:5,total:12},done:[1,1,0,0,0,0],risk:{level:"low",msg:"All milestones on track. Appraisal scheduled. No concerns detected.",portalUrl:"brikk.store/portal/1891elm"}},
  {address:"305 Birch Lane",client:"Kevin & Amy Ross",price:"$680,000",commission:"$20,400",close:"Jun 24",daysLeft:46,pct:20,flag:"green",next:"Awaiting lender documentation",docs:{done:3,total:12},done:[1,0,0,0,0,0],risk:{level:"low",msg:"Early stage. Lender pre-approval is strong. Monitor for document submission delays.",portalUrl:"brikk.store/portal/305birch"}},
]
const steps=["Contract","Inspection","Appraisal","Financing","Title","Closing"]

const copilotQueue=[
  {id:1,lead:"Emily Watson",channel:"Text",urgency:"high",context:"New lead, 5 days no contact",draft:"Hi Emily, this is Alex with Brikk Realty. I saw you were looking at properties in the $275K range — I just pulled 3 new listings that match. Would you have 15 minutes this week for a quick call?",why:"First-time buyers contacted in week one convert at 4x the rate. Emily has viewed 6 listings but hasn't been contacted. Your conversion drops 80% after day 7."},
  {id:2,lead:"David Park",channel:"Email",urgency:"medium",context:"Seller going cold, 12 days",draft:"Hi David, I put together an updated comparative market analysis for your property — values in your neighborhood shifted in the last two weeks. I've attached the report. Happy to walk through it whenever works.",why:"David requested a valuation 12 days ago. Sellers who receive a CMA follow-up within 14 days are 2.5x more likely to list with you."},
  {id:3,lead:"The Nguyens",channel:"Text",urgency:"low",context:"Past client, 2-year anniversary",draft:"Hi Sarah and Kevin! Hard to believe it's been 2 years since you moved into your home on Maple Drive. Hope you're loving it. If you ever need anything — a contractor rec, a market update — don't hesitate to reach out.",why:"Past client anniversary texts generate referrals at 8x the rate of cold outreach. The Nguyens have referred 1 client previously. Lifetime value: $30,600."},
]
const copilotSent=[
  {lead:"Zillow Lead #247",time:"11:42 PM last night",result:"Replied 6 min later — showing booked Thursday",msg:"Auto-responded to after-hours Zillow inquiry."},
  {lead:"Zillow Lead #248",time:"6:15 AM today",result:"Opened, no reply yet",msg:"Auto-responded to early morning inquiry."},
  {lead:"Maria Gonzalez",time:"Yesterday 3:00 PM",result:"Opened, clicked CMA link (4 min)",msg:"Sent 30-day market update to warm seller lead."},
]

const calendarEvents=[
  {date:"Today",time:"9:00 AM",label:"Call Sarah Mitchell — showing follow-up",type:"call",ai:"Sarah viewed 3 new listings last night. Mention 445 Pine St — it matches her criteria exactly."},
  {date:"Today",time:"10:00 AM",label:"Showing: 1891 Elm St with Rachel Torres",type:"showing",ai:null},
  {date:"Today",time:"2:00 PM",label:"Listing appointment: Linda Chen",type:"meeting",ai:"Bring updated CMA. Comparable at 280 Oak sold for $315K last week — 2% above asking. Strong data point for her list price."},
  {date:"Tomorrow",time:"9:00 AM",label:"Inspection: 742 Oak Avenue",type:"deadline",ai:"RISK: Lender unresponsive 3 days. Confirm financing status before inspection. If financing falls through post-inspection, buyer loses earnest money."},
  {date:"Tomorrow",time:"1:00 PM",label:"Follow up: Nina Patel — second showing",type:"call",ai:"Nina's referral source (Kevin Ross) closed in 22 days. Referral buyers from Kevin move fast — have pre-approval docs ready."},
  {date:"May 12",time:"All day",label:"Financing contingency deadline: 742 Oak Ave",type:"deadline",ai:"Marcus Johnson's lender must provide commitment letter by this date. Current risk level: MEDIUM. Set reminder to confirm 48 hours prior."},
  {date:"May 20",time:"All day",label:"The Nguyens — 2 year home anniversary",type:"touch",ai:"Copilot has a text drafted. The Nguyens have referred 1 client ($19,200 in commission). Anniversary touchpoints generate 8x more referrals than cold outreach."},
  {date:"Jun 2",time:"10:00 AM",label:"Appraisal: 1891 Elm Street",type:"deadline",ai:"Comparable sales support the contract price. No risk detected. Appraiser: Mike Reynolds — he's appraised 3 of your deals this year, all at or above contract."},
]

const voiceNotes=[
  {id:1,time:"Today 11:15 AM",duration:"0:28",transcript:"Just showed the Elm Street house to Sarah Mitchell. She loved the kitchen and the backyard but she's worried about the school district. Wants to see two more places in the same area, ideally under 450. She mentioned her lease is up in August so there's some urgency.",extracted:{lead:"Sarah Mitchell",interest:"Kitchen, backyard positive",concern:"School district",budget:"Under $450K",timeline:"Lease up August — 3 month window",action:"Queue 2 similar listings under $450K, same area"},status:"processed"},
  {id:2,time:"Today 9:45 AM",duration:"0:18",transcript:"Quick note on James Ortega. His lender called me back and said the pre-approval is solid, no issues. They expect clear to close by next Friday. I think this deal is going to go smooth.",extracted:{lead:"James Ortega",update:"Lender confirmed pre-approval solid",timeline:"Clear to close expected next Friday",risk:"Low — financing looks secure",action:"Updated deal status. No action needed."},status:"processed"},
  {id:3,time:"Yesterday 4:30 PM",duration:"0:35",transcript:"Met David Park at his property today for the listing presentation. Nice guy, house is in good shape. He's motivated to sell but thinks his place is worth about 420. Based on comps I think we're looking at 385 to 395 range. I need to have a pricing conversation with him before we list. He wants to think about it over the weekend.",extracted:{lead:"David Park",update:"Listing presentation completed",pricing:"Seller expects $420K, comps suggest $385-395K",concern:"Pricing gap — needs pricing conversation",timeline:"Decision expected after weekend",action:"Copilot drafting pricing discussion email with CMA attachment"},status:"processed"},
]

/* ── COMPONENTS ── */
const Label=({children})=><div style={{fontSize:11,fontWeight:500,color:t.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>{children}</div>
const Stat=({label,value,note,color=t.text})=><div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px",minWidth:140}}><div style={{fontSize:10,fontWeight:500,color:t.dim,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:8}}>{label}</div><div style={{fontSize:22,fontWeight:700,color,letterSpacing:"-0.02em",lineHeight:1}}>{value}</div>{note&&<div style={{fontSize:11,color:t.sub,marginTop:6}}>{note}</div>}</div>
const Progress=({value,max,color})=><div style={{background:t.raised,borderRadius:3,height:4,width:"100%",overflow:"hidden"}}><div style={{width:`${Math.min((value/max)*100,100)}%`,height:"100%",background:color,borderRadius:3}}/></div>
const Tag2=({children,bg,color,border})=><span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:bg,color,border:`1px solid ${border}`,letterSpacing:"0.02em"}}>{children}</span>
const AIBox=({title,children,color:cl=t.accent,bgColor=t.accentSoft,borderColor=t.accentBorder})=><div style={{background:bgColor,border:`1px solid ${borderColor}`,borderRadius:8,padding:"16px 18px"}}>{title&&<div style={{fontSize:11,fontWeight:600,color:cl,marginBottom:6}}>{title}</div>}<div style={{fontSize:13,color:t.text,lineHeight:1.6}}>{children}</div></div>

const ScoreBadge=({score,label})=>{
  const cl=score>=80?t.green:score>=50?t.amber:score>=1?t.red:t.dim
  const bg=score>=80?t.greenSoft:score>=50?t.amberSoft:score>=1?t.redSoft:t.raised
  const bd=score>=80?t.greenBorder:score>=50?t.amberBorder:score>=1?t.redBorder:t.border
  return score>0?<Tag2 bg={bg} color={cl} border={bd}>{score}% {label}</Tag2>:null
}

export default function Demo(){
  const [tab,setTab]=useState("overview")
  const [selectedLead,setSelectedLead]=useState(null)
  const [approvedIds,setApprovedIds]=useState([])
  const [expandedVoice,setExpandedVoice]=useState(null)
  const [socialDraft,setSocialDraft]=useState("Median home prices in Westfield are up 4.2% this quarter with just 1.8 months of supply on the market. If you've been thinking about selling, this is a window worth paying attention to. Happy to run a free market analysis for your home anytime.")
  const goal=200000,closed=127400,pending=52300,pctDone=((closed/goal)*100).toFixed(1)
  const ps={high:{dot:t.red,weight:600,color:t.text},medium:{dot:t.amber,weight:500,color:t.sub},low:{dot:t.dim,weight:400,color:t.sub}}
  const ts2={hot:{bg:t.redSoft,color:t.red,border:t.redBorder},warm:{bg:t.amberSoft,color:t.amber,border:t.amberBorder},cold:{bg:t.raised,color:t.dim,border:t.border},past:{bg:t.purpleSoft,color:t.purple,border:t.purpleBorder}}
  const tabs=["overview","copilot","voice","leads","deals","calendar","marketing","speed"]
  const eventColors={call:t.accent,showing:t.green,meeting:t.amber,deadline:t.red,touch:t.purple}

  return(
    <div style={{background:t.bg,minHeight:"100vh",color:t.text,fontFamily:font,WebkitFontSmoothing:"antialiased"}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",borderBottom:`1px solid ${t.border}`,flexWrap:"wrap",gap:12}}>
        <div><div style={{fontSize:15,fontWeight:700}}>Brikk</div><div style={{fontSize:12,color:t.sub,marginTop:2}}>Command Center</div></div>
        <nav style={{display:"flex",gap:2,background:t.surface,borderRadius:8,padding:3,border:`1px solid ${t.border}`,overflowX:"auto"}}>
          {tabs.map(v=><button key={v} onClick={()=>{setTab(v);setSelectedLead(null)}} style={{background:tab===v?t.raised:"transparent",color:tab===v?t.text:t.sub,border:"none",borderRadius:6,padding:"7px 12px",fontSize:11,fontWeight:600,fontFamily:font,textTransform:"capitalize",whiteSpace:"nowrap",position:"relative",cursor:"pointer"}}>{v}{v==="copilot"&&copilotQueue.filter(q=>!approvedIds.includes(q.id)).length>0&&<span style={{position:"absolute",top:2,right:2,width:5,height:5,borderRadius:"50%",background:t.purple}}/>}</button>)}
        </nav>
      </header>
      <main style={{padding:"20px 24px 60px",maxWidth:1200,margin:"0 auto"}}>

{/* ══════ OVERVIEW ══════ */}
{tab==="overview"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
    <Stat label="YTD Closed" value={`$${(closed/1000).toFixed(1)}K`} note={`${pctDone}% of $200K goal`} color={t.green}/>
    <Stat label="Pending" value={`$${(pending/1000).toFixed(1)}K`} note="3 deals in pipeline" color={t.amber}/>
    <Stat label="Active Leads" value="24" note="6 hot / 11 warm / 7 cold"/>
    <Stat label="Copilot Saves" value="$36.2K" note="Revenue from AI actions" color={t.purple}/>
  </div>
  <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"16px 20px",marginBottom:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <span style={{fontSize:11,fontWeight:500,color:t.dim,letterSpacing:"0.04em",textTransform:"uppercase"}}>Annual Goal</span>
      <span style={{fontSize:12,fontWeight:600,color:t.green}}>${(closed/1000).toFixed(1)}K of $200K</span>
    </div>
    <Progress value={closed} max={goal} color={t.green}/>
  </div>
  <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16}}>
    <div style={{flex:"1 1 340px",background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"18px 20px"}}>
      <Label>Today's Actions</Label>
      {actions.map((a,i)=>{const s=ps[a.priority];return(
        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"10px 12px",marginBottom:4,borderRadius:6,background:a.priority==="high"?t.redSoft:"transparent",border:`1px solid ${a.priority==="high"?t.redBorder:"transparent"}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
            <span style={{fontSize:12,color:s.color,fontWeight:s.weight,lineHeight:1.4}}>{a.label}</span>
          </div>
          <span style={{fontSize:10,color:t.dim,whiteSpace:"nowrap"}}>{a.time}</span>
        </div>
      )})}
    </div>
    <div style={{flex:"1 1 340px",background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"18px 20px"}}>
      <Label>Monthly Income</Label>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={monthly} barSize={16}><XAxis dataKey="m" tick={{fill:t.dim,fontSize:10,fontFamily:font}} axisLine={false} tickLine={false}/><YAxis tick={{fill:t.dim,fontSize:10,fontFamily:font}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}K`} width={32}/><Tooltip cursor={{fill:"rgba(255,255,255,0.03)"}} contentStyle={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:6,color:t.text,fontSize:12}} formatter={v=>[`$${v.toLocaleString()}`,"Income"]}/><Bar dataKey="v" fill={t.accent} radius={[3,3,0,0]}/></BarChart>
      </ResponsiveContainer>
    </div>
  </div>
  <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"18px 20px"}}>
    <Label>Active Deals</Label>
    {deals.map((d,i)=>{const fc=d.flag==="amber"?t.amber:t.green;return(
      <div key={i} style={{padding:"14px 16px",marginBottom:8,borderRadius:6,border:`1px solid ${t.border}`,background:t.bg}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:13,fontWeight:600}}>{d.address}</span>
            {d.risk.level==="medium"&&<Tag2 bg={t.amberSoft} color={t.amber} border={t.amberBorder}>Risk Alert</Tag2>}
          </div>
          <span style={{fontSize:13,fontWeight:700,color:t.green}}>{d.price}</span>
        </div>
        <Progress value={d.pct} max={100} color={fc}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
          <span style={{fontSize:11,color:d.flag==="amber"?t.amber:t.sub}}>{d.next}</span>
          <span style={{fontSize:11,color:t.dim}}>{d.daysLeft}d to close</span>
        </div>
      </div>
    )})}
  </div>
</>}

{/* ══════ COPILOT ══════ */}
{tab==="copilot"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
    <Stat label="Queued" value={copilotQueue.filter(q=>!approvedIds.includes(q.id)).length} note="Awaiting approval" color={t.purple}/>
    <Stat label="Sent This Week" value="14" note="By Copilot" color={t.green}/>
    <Stat label="Reply Rate" value="57%" note="3x industry average" color={t.accent}/>
    <Stat label="Revenue Impact" value="$36.2K" note="Copilot-assisted deals" color={t.purple}/>
  </div>
  <Label>Pending Your Approval</Label>
  {copilotQueue.filter(q=>!approvedIds.includes(q.id)).length===0?
    <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"24px",textAlign:"center",marginBottom:20}}><span style={{fontSize:14,color:t.sub}}>All messages approved.</span></div>
  :<div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
    {copilotQueue.filter(q=>!approvedIds.includes(q.id)).map(q=>{
      const u={high:{bg:t.redSoft,color:t.red,border:t.redBorder},medium:{bg:t.amberSoft,color:t.amber,border:t.amberBorder},low:{bg:t.raised,color:t.dim,border:t.border}}[q.urgency]
      return(
        <div key={q.id} style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"20px 22px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:14,fontWeight:700}}>{q.lead}</span><Tag2 bg={u.bg} color={u.color} border={u.border}>{q.urgency}</Tag2><Tag2 bg={t.purpleSoft} color={t.purple} border={t.purpleBorder}>{q.channel}</Tag2></div>
            <span style={{fontSize:11,color:t.dim}}>{q.context}</span>
          </div>
          <div style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:6,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:600,color:t.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Draft Message</div>
            <div style={{fontSize:13,color:t.text,lineHeight:1.7}}>{q.draft}</div>
          </div>
          <div style={{background:t.purpleSoft,border:`1px solid ${t.purpleBorder}`,borderRadius:6,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:600,color:t.purple,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>Why This Message, Why Now</div>
            <div style={{fontSize:12,color:t.sub,lineHeight:1.6}}>{q.why}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setApprovedIds(p=>[...p,q.id])} style={{background:t.green,border:"none",borderRadius:6,padding:"8px 20px",fontSize:12,fontWeight:600,color:"#fff",fontFamily:font,cursor:"pointer"}}>Approve & Send</button>
            <button style={{background:t.raised,border:`1px solid ${t.border}`,borderRadius:6,padding:"8px 20px",fontSize:12,fontWeight:500,color:t.sub,fontFamily:font,cursor:"pointer"}}>Edit</button>
            <button style={{background:"transparent",border:`1px solid ${t.border}`,borderRadius:6,padding:"8px 20px",fontSize:12,fontWeight:500,color:t.dim,fontFamily:font,cursor:"pointer"}}>Skip</button>
          </div>
        </div>
      )
    })}
  </div>}
  <Label>Auto-Sent (Off-Hours)</Label>
  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
    {copilotSent.map((s,i)=><div key={i} style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"16px 18px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:6}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:600}}>{s.lead}</span><Tag2 bg={t.greenSoft} color={t.green} border={t.greenBorder}>Auto-Sent</Tag2></div>
        <span style={{fontSize:11,color:t.dim}}>{s.time}</span>
      </div>
      <div style={{fontSize:12,color:t.sub,marginBottom:4}}>{s.msg}</div>
      <div style={{fontSize:12,fontWeight:600,color:s.result.includes("Replied")?t.green:t.amber}}>{s.result}</div>
    </div>)}
  </div>
  <AIBox title="Copilot Summary" color={t.purple} bgColor={t.purpleSoft} borderColor={t.purpleBorder}>This week Copilot handled 3 after-hours inquiries, converted 1 to a showing in 6 minutes, and maintained a 57% reply rate (3x industry average). Projected impact: 2-3 additional closings per quarter worth $18K-$27K.</AIBox>
</>}

{/* ══════ VOICE-TO-CRM ══════ */}
{tab==="voice"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
    <Stat label="Voice Notes" value="3" note="Processed today" color={t.accent}/>
    <Stat label="Time Saved" value="45 min" note="vs manual data entry" color={t.green}/>
    <Stat label="Leads Updated" value="3" note="Auto-updated from voice" color={t.purple}/>
  </div>
  {/* Record button */}
  <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"24px",textAlign:"center",marginBottom:20}}>
    <div style={{width:64,height:64,borderRadius:"50%",background:t.redSoft,border:`2px solid ${t.red}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",cursor:"pointer"}}>
      <div style={{width:24,height:24,borderRadius:"50%",background:t.red}}/>
    </div>
    <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Tap to Record</div>
    <div style={{fontSize:12,color:t.dim}}>Talk about your showing, meeting, or lead update. Brikk handles the rest.</div>
  </div>
  <Label>Recent Voice Notes</Label>
  {voiceNotes.map((v,i)=>(
    <div key={v.id} style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"20px 22px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:t.green}}/>
          <span style={{fontSize:13,fontWeight:600}}>{v.time}</span>
          <span style={{fontSize:12,color:t.dim}}>{v.duration}</span>
          <Tag2 bg={t.greenSoft} color={t.green} border={t.greenBorder}>Processed</Tag2>
        </div>
        <button onClick={()=>setExpandedVoice(expandedVoice===v.id?null:v.id)} style={{background:t.raised,border:`1px solid ${t.border}`,borderRadius:4,padding:"4px 12px",fontSize:11,fontWeight:500,color:t.sub,fontFamily:font,cursor:"pointer"}}>{expandedVoice===v.id?"Collapse":"Expand"}</button>
      </div>
      {/* Transcript */}
      <div style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:6,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:600,color:t.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>Transcript</div>
        <div style={{fontSize:13,color:t.sub,lineHeight:1.7,fontStyle:"italic"}}>"{v.transcript}"</div>
      </div>
      {/* Extracted data */}
      {(expandedVoice===v.id||i===0)&&<>
        <div style={{fontSize:10,fontWeight:600,color:t.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>AI Extracted</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:6,marginBottom:12}}>
          {Object.entries(v.extracted).map(([k,val])=>(
            <div key={k} style={{background:t.bg,borderRadius:6,padding:"8px 10px",border:`1px solid ${t.border}`}}>
              <div style={{fontSize:9,color:t.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>{k}</div>
              <div style={{fontSize:12,fontWeight:600,marginTop:2,color:k==="action"?t.purple:t.text}}>{val}</div>
            </div>
          ))}
        </div>
      </>}
    </div>
  ))}
</>}

{/* ══════ LEADS ══════ */}
{tab==="leads"&&<>
  {selectedLead!==null?(()=>{const l=leads[selectedLead];const ts=ts2[l.temp];return(
    <div>
      <button onClick={()=>setSelectedLead(null)} style={{background:"none",border:"none",color:t.sub,fontSize:12,fontWeight:500,fontFamily:font,marginBottom:16,padding:0,cursor:"pointer"}}>Back to all leads</button>
      <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:8,background:ts.bg,border:`1px solid ${ts.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:ts.color}}>{l.name.split(" ").map(n=>n[0]).join("")}</div>
            <div><div style={{fontSize:18,fontWeight:700}}>{l.name}</div><div style={{fontSize:12,color:t.sub,marginTop:2}}>{l.type} / {l.src}</div></div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Tag2 bg={ts.bg} color={ts.color} border={ts.border}>{l.temp==="past"?"PAST CLIENT":l.temp.toUpperCase()}</Tag2>
            <ScoreBadge score={l.score} label={l.scoreLabel}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12,marginBottom:20}}>
          {[["Price",l.price,t.text],["Last Contact",l.days===0?"Today":`${l.days}d ago`,l.days>=5?t.red:l.days>=3?t.amber:t.green],["Source",l.src,t.text],["Lifetime Value",l.lifetime,l.lifetime!=="$0"?t.purple:t.dim]].map(([lb,vl,cl],i)=>(
            <div key={i} style={{background:t.bg,borderRadius:6,padding:"12px 14px",border:`1px solid ${t.border}`}}>
              <div style={{fontSize:10,color:t.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>{lb}</div>
              <div style={{fontSize:16,fontWeight:700,color:cl}}>{vl}</div>
            </div>
          ))}
        </div>
        <AIBox title="AI Insight">{l.aiNote}</AIBox>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16}}>
          {["Called","Texted","Emailed","Met In Person","Voice Note"].map((a,i)=>(
            <button key={i} style={{background:a==="Voice Note"?t.purpleSoft:t.raised,border:`1px solid ${a==="Voice Note"?t.purpleBorder:t.border}`,borderRadius:6,padding:"8px 16px",fontSize:12,fontWeight:500,color:a==="Voice Note"?t.purple:t.sub,fontFamily:font,cursor:"pointer"}}>Log: {a}</button>
          ))}
        </div>
      </div>
    </div>
  )})():<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:12,color:t.sub}}>8 leads + 1 past client — with predictive scoring</div>
      <div style={{display:"flex",gap:6}}>
        {["All","Hot","Warm","Cold","Past"].map((f,i)=><span key={i} style={{fontSize:11,fontWeight:500,color:i===0?t.text:t.dim,padding:"4px 12px",borderRadius:4,background:i===0?t.raised:"transparent",border:`1px solid ${i===0?t.border:"transparent"}`,cursor:"pointer"}}>{f}</span>)}
      </div>
    </div>
    {leads.map((l,i)=>{const ts=ts2[l.temp];return(
      <div key={i} onClick={()=>setSelectedLead(i)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:`1px solid ${t.border}`,background:i%2===0?"transparent":t.surface,cursor:"pointer",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:6,background:ts.bg,border:`1px solid ${ts.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:ts.color,flexShrink:0}}>{l.name.split(" ").map(n=>n[0]).join("")}</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:600}}>{l.name}</span><ScoreBadge score={l.score} label={l.scoreLabel}/></div>
            <div style={{fontSize:11,color:t.dim}}>{l.type} / {l.src} / {l.stage}{l.lifetime!=="$0"?` / LTV: ${l.lifetime}`:""}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Tag2 bg={ts.bg} color={ts.color} border={ts.border}>{l.temp==="past"?"PAST":l.temp.toUpperCase()}</Tag2>
          <span style={{fontSize:12,fontWeight:600,width:44,textAlign:"right"}}>{l.price}</span>
          {l.temp!=="past"&&<span style={{fontSize:12,fontWeight:600,color:l.days>=5?t.red:l.days>=3?t.amber:t.dim,width:36,textAlign:"right"}}>{l.days===0?"Now":`${l.days}d`}</span>}
        </div>
      </div>
    )})}
  </>}
</>}

{/* ══════ DEALS ══════ */}
{tab==="deals"&&<>
  <div style={{fontSize:12,color:t.sub,marginBottom:16}}>3 active transactions — ${(deals.reduce((s,d)=>s+parseInt(d.commission.replace(/[$,]/g,"")),0)/1000).toFixed(1)}K pending commission</div>
  {deals.map((d,i)=>{const fc=d.flag==="amber"?t.amber:t.green;return(
    <div key={i} style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"22px 24px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16,fontWeight:700}}>{d.address}</span>{d.risk.level==="medium"&&<Tag2 bg={t.amberSoft} color={t.amber} border={t.amberBorder}>Risk Alert</Tag2>}</div><div style={{fontSize:12,color:t.sub,marginTop:3}}>{d.client} / Closing {d.close}</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:700,color:t.green}}>{d.price}</div><div style={{fontSize:11,color:t.dim}}>Commission: {d.commission}</div></div>
      </div>
      <Progress value={d.pct} max={100} color={fc}/>
      <div style={{display:"flex",gap:6,marginTop:14,flexWrap:"wrap"}}>
        {steps.map((s,si)=><div key={si} style={{fontSize:11,fontWeight:500,padding:"5px 14px",borderRadius:4,background:d.done[si]?t.greenSoft:t.bg,color:d.done[si]?t.green:t.dim,border:`1px solid ${d.done[si]?t.greenBorder:t.border}`}}>{s}</div>)}
      </div>
      {/* Risk Alert */}
      {d.risk.level==="medium"&&<div style={{background:t.amberSoft,border:`1px solid ${t.amberBorder}`,borderRadius:6,padding:"12px 14px",marginTop:14}}>
        <div style={{fontSize:10,fontWeight:600,color:t.amber,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>Deal Risk Alert</div>
        <div style={{fontSize:12,color:t.sub,lineHeight:1.6}}>{d.risk.msg}</div>
      </div>}
      {/* Client Portal + Docs */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:12,borderTop:`1px solid ${t.border}`,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:11,color:t.dim}}>Docs: {d.docs.done}/{d.docs.total}</span>
          <span style={{fontSize:11,color:t.purple,fontWeight:500}}>Portal: {d.risk.portalUrl}</span>
        </div>
        <span style={{fontSize:12,fontWeight:600,color:t.dim}}>{d.daysLeft} days remaining</span>
      </div>
    </div>
  )})}
  <AIBox title="Client Portal" color={t.purple} bgColor={t.purpleSoft} borderColor={t.purpleBorder}>Each deal has a shareable portal link. Your clients see their deal progress, upcoming dates, and documents needed — like a pizza tracker for real estate. They stop calling you every day, and every client who sees it sees the Brikk brand.</AIBox>
</>}

{/* ══════ CALENDAR ══════ */}
{tab==="calendar"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
    <Stat label="Events Today" value="3" note="Auto-populated from deals" color={t.accent}/>
    <Stat label="Deadlines This Week" value="2" note="1 high risk flagged" color={t.red}/>
    <Stat label="Client Touchpoints" value="1" note="Anniversary coming up" color={t.purple}/>
  </div>
  <Label>Upcoming Events</Label>
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {calendarEvents.map((e,i)=>{
      const ec=eventColors[e.type]||t.accent
      return(
        <div key={i} style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"16px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:4,height:32,borderRadius:2,background:ec,flexShrink:0}}/>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{e.label}</div>
                <div style={{fontSize:11,color:t.dim}}>{e.date} {e.time!==""?`at ${e.time}`:""}</div>
              </div>
            </div>
            <Tag2 bg={`${ec}15`} color={ec} border={`${ec}30`}>{e.type}</Tag2>
          </div>
          {e.ai&&<div style={{background:t.purpleSoft,border:`1px solid ${t.purpleBorder}`,borderRadius:6,padding:"10px 12px",marginLeft:14}}>
            <div style={{fontSize:10,fontWeight:600,color:t.purple,marginBottom:3}}>AI Context</div>
            <div style={{fontSize:12,color:t.sub,lineHeight:1.6}}>{e.ai}</div>
          </div>}
        </div>
      )
    })}
  </div>
  <div style={{marginTop:16}}><AIBox title="Calendar Intelligence" color={t.purple} bgColor={t.purpleSoft} borderColor={t.purpleBorder}>Your calendar auto-syncs with your pipeline. When you add a deal, every milestone lands here automatically. AI adds context to each event so you walk into every meeting prepared — not just reminded.</AIBox></div>
</>}

{/* ══════ MARKETING ══════ */}
{tab==="marketing"&&<>
  <div style={{fontSize:12,color:t.sub,marginBottom:16}}>Lead source performance + content tools</div>
  <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16}}>
    <div style={{flex:"1 1 280px",background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"18px 20px"}}>
      <Label>Lead Distribution</Label>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <div style={{width:110,height:110,flexShrink:0}}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sources} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="pct" stroke="none" paddingAngle={2}>{sources.map((s,i)=><Cell key={i} fill={s.fill}/>)}</Pie></PieChart></ResponsiveContainer></div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>{sources.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:6,height:6,borderRadius:2,background:s.fill}}/><span style={{fontSize:12,color:t.sub,minWidth:80}}>{s.name}</span><span style={{fontSize:12,fontWeight:600}}>{s.pct}%</span></div>)}</div>
      </div>
    </div>
    <div style={{flex:"1 1 400px",background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"18px 20px"}}>
      <Label>Conversion by Source</Label>
      <div style={{display:"grid",gridTemplateColumns:"100px 50px 50px 50px 50px",gap:8,padding:"0 0 8px",borderBottom:`1px solid ${t.border}`}}>{["Source","Leads","Closed","Conv.","CPL"].map((h,i)=><span key={i} style={{fontSize:10,fontWeight:600,color:t.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>{h}</span>)}</div>
      {sources.map((s,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"100px 50px 50px 50px 50px",gap:8,padding:"10px 0",borderBottom:`1px solid ${t.border}`}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:2,background:s.fill}}/><span style={{fontSize:12}}>{s.name}</span></div><span style={{fontSize:12,color:t.sub}}>{s.leads}</span><span style={{fontSize:12,fontWeight:600,color:t.green}}>{s.closed}</span><span style={{fontSize:12,fontWeight:600,color:parseFloat(s.conv)>=20?t.green:parseFloat(s.conv)>=10?t.amber:t.red}}>{s.conv}</span><span style={{fontSize:12,color:t.sub}}>{s.cpl}</span></div>)}
    </div>
  </div>

  {/* AI Market Report */}
  <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"20px 22px",marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <Label>AI Market Report Generator</Label>
      <button style={{background:t.accent,border:"none",borderRadius:6,padding:"8px 18px",fontSize:12,fontWeight:600,color:"#fff",fontFamily:font,cursor:"pointer"}}>Generate Report</button>
    </div>
    <div style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:6,padding:"16px 18px"}}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>Westfield Market Report — May 2025</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:12}}>
        {[["Median Price","$387,500","Up 4.2%"],["Days on Market","18","Down from 24"],["Active Inventory","142","1.8 months supply"],["Avg Sale/List","98.2%","Sellers market"]].map(([k,v,d],i)=>(
          <div key={i} style={{background:t.surface,borderRadius:6,padding:"10px 12px"}}>
            <div style={{fontSize:9,color:t.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>{k}</div>
            <div style={{fontSize:16,fontWeight:700,marginTop:2}}>{v}</div>
            <div style={{fontSize:10,color:t.green,marginTop:2}}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:12,color:t.sub,lineHeight:1.6}}>One-tap branded report you can text to any seller lead. Your name, your branding, real data. Instant credibility.</div>
    </div>
  </div>

  {/* Social Content Generator */}
  <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"20px 22px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <Label>Social Content Generator</Label>
      <div style={{display:"flex",gap:6}}>
        {["Market Update","Just Listed","Tip of the Week"].map((type,i)=><button key={i} style={{background:i===0?t.raised:"transparent",border:`1px solid ${i===0?t.border:"transparent"}`,borderRadius:4,padding:"4px 12px",fontSize:11,fontWeight:500,color:i===0?t.text:t.dim,fontFamily:font,cursor:"pointer"}}>{type}</button>)}
      </div>
    </div>
    <div style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:6,padding:"16px 18px",marginBottom:12}}>
      <div style={{fontSize:13,color:t.text,lineHeight:1.8}}>{socialDraft}</div>
    </div>
    <div style={{display:"flex",gap:8}}>
      <button style={{background:t.accent,border:"none",borderRadius:6,padding:"8px 18px",fontSize:12,fontWeight:600,color:"#fff",fontFamily:font,cursor:"pointer"}}>Copy to Clipboard</button>
      <button style={{background:t.raised,border:`1px solid ${t.border}`,borderRadius:6,padding:"8px 18px",fontSize:12,fontWeight:500,color:t.sub,fontFamily:font,cursor:"pointer"}}>Regenerate</button>
    </div>
    <AIBox title="AI Insight" color={t.purple} bgColor={t.purpleSoft} borderColor={t.purpleBorder}>
      Referrals convert at 7x the rate of Zillow at $0 cost per lead. Consider reallocating $500/mo from paid channels to a past-client touchpoint program. Consistent social content builds the trust that drives referrals.
    </AIBox>
  </div>
</>}

{/* ══════ SPEED ══════ */}
{tab==="speed"&&<>
  <div style={{fontSize:12,color:t.sub,marginBottom:16}}>Response time tracking</div>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
    <Stat label="Avg Response" value="4.2 min" note="Goal: under 5 min" color={t.green}/>
    <Stat label="Under 5 Min" value="71%" note="Industry avg: under 10%"/>
    <Stat label="Missed" value="2" note="Down from 5 last week" color={t.amber}/>
    <Stat label="Revenue Saved" value="$18.2K" note="By fast response" color={t.accent}/>
  </div>
  <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:8,padding:"18px 20px",marginBottom:16}}>
    <Label>Avg Response Time by Day</Label>
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={speedData}><XAxis dataKey="day" tick={{fill:t.dim,fontSize:10,fontFamily:font}} axisLine={false} tickLine={false}/><YAxis tick={{fill:t.dim,fontSize:10,fontFamily:font}} axisLine={false} tickLine={false} domain={[0,15]} tickFormatter={v=>`${v}m`} width={32}/><Tooltip contentStyle={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:6,color:t.text,fontSize:12}} formatter={v=>[`${v} min`,"Avg"]}/><Line type="monotone" dataKey="avg" stroke={t.accent} strokeWidth={2} dot={{fill:t.accent,r:3}}/><Line type="monotone" dataKey={()=>5} stroke={t.red} strokeWidth={1} strokeDasharray="4 4" dot={false}/></LineChart>
    </ResponsiveContainer>
    <div style={{display:"flex",gap:16,marginTop:8}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:2,background:t.accent}}/><span style={{fontSize:10,color:t.dim}}>Your avg</span></div>
      <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:2,background:t.red,opacity:0.5}}/><span style={{fontSize:10,color:t.dim}}>5 min target</span></div>
    </div>
  </div>
  <AIBox title="AI Insight" color={t.purple} bgColor={t.purpleSoft} borderColor={t.purpleBorder}>Weekend response times average 10.2 min vs 2.9 min weekdays. Enabling Copilot auto-response for Saturday/Sunday could capture 4 additional appointments per month — approximately $36K in annual commission.</AIBox>
</>}

      </main>
      <footer style={{textAlign:"center",padding:"24px",borderTop:`1px solid ${t.border}`}}><span style={{fontSize:10,fontWeight:500,color:t.dim,letterSpacing:"0.08em",textTransform:"uppercase"}}>Brikk — Built to Close</span></footer>
    </div>
  )
}
