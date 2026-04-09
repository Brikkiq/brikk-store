'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)",purpleBorder:"rgba(109,40,217,0.12)"}

const sourceColors={"Zillow":"#4338CA","Referral":"#16803C","Open House":"#A16207","Social Media":"#BE123C","Website":"#6D28D9","Cold Call":"#64748B","Other":"#9C9C96"}

export default function MarketingPage(){
  const [leads,setLeads]=useState([])
  const [deals,setDeals]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{loadData()},[])

  const loadData=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){setLoading(false);return}
    const [leadsRes,dealsRes]=await Promise.all([
      supabase.from('leads').select('*').eq('user_id',user.id),
      supabase.from('deals').select('*').eq('user_id',user.id)
    ])
    setLeads(leadsRes.data||[])
    setDeals(dealsRes.data||[])
    setLoading(false)
  }

  // Calculate source metrics
  const sourceMap={}
  leads.forEach(l=>{
    const src=l.source||'Other'
    if(!sourceMap[src])sourceMap[src]={name:src,leads:0,hot:0,warm:0,cold:0,closedWon:0,closedLost:0}
    sourceMap[src].leads++
    if(l.temperature==='hot')sourceMap[src].hot++
    if(l.temperature==='warm')sourceMap[src].warm++
    if(l.temperature==='cold')sourceMap[src].cold++
    if(l.stage==='Closed Won')sourceMap[src].closedWon++
    if(l.stage==='Closed Lost')sourceMap[src].closedLost++
  })

  const sourceData=Object.values(sourceMap).sort((a,b)=>b.leads-a.leads)
  const totalLeads=leads.length
  const pieData=sourceData.map(s=>({name:s.name,value:s.leads,fill:sourceColors[s.name]||c.dim}))

  // Best and worst sources
  const sourcesWithConv=sourceData.map(s=>({
    ...s,
    convRate:s.leads>0?((s.closedWon/s.leads)*100):0,
    hotRate:s.leads>0?((s.hot/s.leads)*100):0,
  }))

  const bestSource=sourcesWithConv.length>0?sourcesWithConv.reduce((best,s)=>s.hotRate>best.hotRate?s:best,sourcesWithConv[0]):null
  const worstSource=sourcesWithConv.length>1?sourcesWithConv.reduce((worst,s)=>s.hotRate<worst.hotRate&&s.leads>0?s:worst,sourcesWithConv[0]):null

  // Temperature distribution
  const hotCount=leads.filter(l=>l.temperature==='hot').length
  const warmCount=leads.filter(l=>l.temperature==='warm').length
  const coldCount=leads.filter(l=>l.temperature==='cold').length

  // Stage funnel
  const stageOrder=['New Lead','Contacted','Showing Scheduled','Offer Submitted','Under Contract','Closed Won','Closed Lost']
  const stageCounts=stageOrder.map(s=>({stage:s,count:leads.filter(l=>l.stage===s).length}))

  if(loading)return <div style={{padding:40,textAlign:"center",color:c.dim}}>Loading marketing data...</div>

  return(
    <div>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.01em",margin:"0 0 4px"}}>Marketing ROI</h1>
        <p style={{fontSize:13,color:c.sub,margin:0}}>See which sources actually close deals — not just generate leads</p>
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px",minWidth:140}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Total Leads</div>
          <div style={{fontSize:22,fontWeight:700}}>{totalLeads}</div>
          <div style={{fontSize:11,color:c.sub,marginTop:4}}>{sourceData.length} sources</div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px",minWidth:140}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Hot Leads</div>
          <div style={{fontSize:22,fontWeight:700,color:c.red}}>{hotCount}</div>
          <div style={{fontSize:11,color:c.sub,marginTop:4}}>{totalLeads>0?((hotCount/totalLeads)*100).toFixed(0):0}% of total</div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px",minWidth:140}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Best Source</div>
          <div style={{fontSize:22,fontWeight:700,color:c.green}}>{bestSource?bestSource.name:'—'}</div>
          <div style={{fontSize:11,color:c.sub,marginTop:4}}>{bestSource?`${bestSource.hotRate.toFixed(0)}% hot rate`:'Add more leads'}</div>
        </div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",flex:"1 1 140px",minWidth:140}}>
          <div style={{fontSize:10,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Active Deals</div>
          <div style={{fontSize:22,fontWeight:700,color:c.green}}>{deals.length}</div>
          <div style={{fontSize:11,color:c.sub,marginTop:4}}>${(deals.reduce((s,d)=>s+(d.commission||0),0)/1000).toFixed(1)}K pending</div>
        </div>
      </div>

      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:20}}>
        {/* Pie chart */}
        <div style={{flex:"1 1 280px",background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px"}}>
          <div style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>Lead Distribution by Source</div>
          {totalLeads===0?(
            <div style={{padding:"30px 0",textAlign:"center",color:c.dim,fontSize:13}}>Add leads to see distribution</div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              <div style={{width:120,height:120,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" stroke="none" paddingAngle={2}>
                    {pieData.map((s,i)=><Cell key={i} fill={s.fill}/>)}
                  </Pie></PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {sourceData.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:2,background:sourceColors[s.name]||c.dim,flexShrink:0}}/>
                    <span style={{fontSize:12,color:c.sub,minWidth:80}}>{s.name}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{s.leads}</span>
                    <span style={{fontSize:11,color:c.dim}}>{totalLeads>0?((s.leads/totalLeads)*100).toFixed(0):0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Source breakdown table */}
        <div style={{flex:"1 1 400px",background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",overflowX:"auto"}}>
          <div style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>Source Performance</div>
          {sourceData.length===0?(
            <div style={{padding:"30px 0",textAlign:"center",color:c.dim,fontSize:13}}>No data yet</div>
          ):<div style={{minWidth:320}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 44px 44px 44px 52px",gap:6,padding:"0 0 8px",borderBottom:`1px solid ${c.border}`}}>
              {["Source","Leads","Hot","Warm","Hot%"].map((h,i)=>(
                <span key={i} style={{fontSize:9,fontWeight:600,color:c.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>{h}</span>
              ))}
            </div>
            {sourceData.map((s,i)=>{
              const hotPct=s.leads>0?((s.hot/s.leads)*100).toFixed(0):0
              return(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 44px 44px 44px 52px",gap:6,padding:"10px 0",borderBottom:`1px solid ${c.borderLight}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:6,height:6,borderRadius:2,background:sourceColors[s.name]||c.dim}}/>
                    <span style={{fontSize:12,color:c.text}}>{s.name}</span>
                  </div>
                  <span style={{fontSize:12,color:c.sub}}>{s.leads}</span>
                  <span style={{fontSize:12,fontWeight:600,color:c.red}}>{s.hot}</span>
                  <span style={{fontSize:12,color:c.amber}}>{s.warm}</span>
                  <span style={{fontSize:12,fontWeight:600,color:parseInt(hotPct)>=30?c.green:parseInt(hotPct)>=15?c.amber:c.red}}>{hotPct}%</span>
                </div>
              )
            })}
          </div>}
        </div>
      </div>

      {/* Pipeline funnel */}
      <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"18px 20px",marginBottom:20}}>
        <div style={{fontSize:11,fontWeight:600,color:c.dim,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:14}}>Pipeline Funnel</div>
        {totalLeads===0?(
          <div style={{padding:"20px 0",textAlign:"center",color:c.dim,fontSize:13}}>Add leads to see your funnel</div>
        ):(
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {stageCounts.filter(s=>s.count>0).map((s,i)=>{
              const pct=totalLeads>0?((s.count/totalLeads)*100):0
              const isPositive=s.stage==='Closed Won'
              const isNegative=s.stage==='Closed Lost'
              return(
                <div key={i} style={{flex:"1 1 100px",minWidth:100,background:isPositive?c.greenSoft:isNegative?c.redSoft:c.bg,border:`1px solid ${isPositive?c.greenBorder:isNegative?'rgba(190,18,60,0.12)':c.border}`,borderRadius:6,padding:"14px 12px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:700,color:isPositive?c.green:isNegative?c.red:c.text}}>{s.count}</div>
                  <div style={{fontSize:10,color:c.sub,marginTop:4}}>{s.stage}</div>
                  <div style={{fontSize:10,color:c.dim,marginTop:2}}>{pct.toFixed(0)}%</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* AI Insights */}
      {totalLeads>0&&(
        <div style={{background:c.purpleSoft,border:`1px solid ${c.purpleBorder}`,borderRadius:8,padding:"16px 18px"}}>
          <div style={{fontSize:10,fontWeight:600,color:c.purple,marginBottom:6}}>AI Insight</div>
          <div style={{fontSize:13,color:c.sub,lineHeight:1.7}}>
            {bestSource&&worstSource&&bestSource.name!==worstSource.name?
              `${bestSource.name} is your strongest source with a ${bestSource.hotRate.toFixed(0)}% hot lead rate from ${bestSource.leads} total leads. ${worstSource.name} has the lowest hot rate at ${worstSource.hotRate.toFixed(0)}%. Consider shifting more effort toward ${bestSource.name}-style lead generation.`
              :totalLeads<5?
              'Add more leads from different sources to start seeing meaningful patterns. Brikk needs at least 10-15 leads across multiple sources to generate actionable insights.'
              :`You have ${totalLeads} leads across ${sourceData.length} source${sourceData.length!==1?'s':''}. ${hotCount} are hot (${((hotCount/totalLeads)*100).toFixed(0)}%). Keep adding leads and tracking sources to build a clear picture of your best ROI channels.`
            }
          </div>
        </div>
      )}
    </div>
  )
}
