'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",red:"#BE123C"}

const stageOptions=["Contract","Inspection","Appraisal","Financing","Title","Closing","Closed"]
const stageProgress={"Contract":10,"Inspection":25,"Appraisal":40,"Financing":60,"Title":80,"Closing":90,"Closed":100}

const Progress=({value,max,color})=>(
  <div style={{background:"#F0F0EC",borderRadius:3,height:4,width:"100%",overflow:"hidden"}}>
    <div style={{width:`${Math.min((value/max)*100,100)}%`,height:"100%",background:color,borderRadius:3}}/>
  </div>
)

export default function DealsPage(){
  const [deals,setDeals]=useState([])
  const [loading,setLoading]=useState(true)
  const [showForm,setShowForm]=useState(false)
  const [editId,setEditId]=useState(null)
  const [saving,setSaving]=useState(false)
  const [toast,setToast]=useState(null)
  const [form,setForm]=useState({address:'',client_name:'',price:'',commission:'',close_date:'',stage:'Contract',notes:''})

  const showToast=(msg,type='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3000)}

  useEffect(()=>{loadDeals()},[])

  const loadDeals=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return
    const {data}=await supabase.from('deals').select('*').eq('user_id',user.id).order('created_at',{ascending:false})
    setDeals(data||[]);setLoading(false)
  }

  const handleSave=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return
    setSaving(true)
    const saveData={
      ...form,
      price:parseFloat(form.price)||0,
      commission:parseFloat(form.commission)||0,
      progress:stageProgress[form.stage]||0,
      user_id:user.id
    }
    try{
      if(editId){
        const {user_id,...updateData}=saveData
        await supabase.from('deals').update({...updateData,updated_at:new Date().toISOString()}).eq('id',editId)
        showToast('Deal updated')
      }else{
        await supabase.from('deals').insert(saveData)
        showToast('Deal added')
      }
      if(window.brikk?.haptic)window.brikk.haptic('success')
    }catch(err){showToast('Something went wrong','error')}
    setSaving(false)
    setForm({address:'',client_name:'',price:'',commission:'',close_date:'',stage:'Contract',notes:''})
    setShowForm(false);setEditId(null);loadDeals()
  }

  const handleEdit=(deal)=>{
    setForm({address:deal.address||'',client_name:deal.client_name||'',price:deal.price?.toString()||'',commission:deal.commission?.toString()||'',close_date:deal.close_date||'',stage:deal.stage||'Contract',notes:deal.notes||''})
    setEditId(deal.id);setShowForm(true)
  }

  const handleDelete=async(id)=>{
    if(!confirm('Delete this deal?'))return
    await supabase.from('deals').delete().eq('id',id)
    showToast('Deal deleted')
    loadDeals()
  }

  const handleStageUpdate=async(id,newStage)=>{
    await supabase.from('deals').update({stage:newStage,progress:stageProgress[newStage]||0,updated_at:new Date().toISOString()}).eq('id',id)
    loadDeals()
  }

  const daysUntil=(date)=>{
    if(!date)return null
    const d=Math.ceil((new Date(date)-new Date())/(1000*60*60*24))
    return d
  }

  const totalCommission=deals.reduce((s,d)=>s+(d.commission||0),0)
  const totalValue=deals.reduce((s,d)=>s+(d.price||0),0)

  if(loading)return <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:c.text,animation:"pulse 1.2s ease-in-out infinite"}}>Loading deals...</div><style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style></div>

  return(
    <div className="page-content">
      {toast&&<div className="toast" style={{position:"fixed",top:80,right:20,zIndex:200,background:toast.type==='error'?"rgba(190,18,60,0.06)":"rgba(22,128,60,0.06)",border:`1px solid ${toast.type==='error'?'rgba(190,18,60,0.15)':"rgba(22,128,60,0.15)"}`,borderRadius:8,padding:"12px 20px",fontSize:13,fontWeight:600,color:toast.type==='error'?"#BE123C":"#16803C",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>{toast.msg}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.01em",margin:"0 0 4px"}}>Deals</h1>
          <p style={{fontSize:13,color:c.sub,margin:0}}>{deals.length} active — ${(totalCommission/1000).toFixed(1)}K pending commission</p>
        </div>
        <button onClick={()=>{setShowForm(true);setEditId(null);setForm({address:'',client_name:'',price:'',commission:'',close_date:'',stage:'Contract',notes:''})}}
          style={{background:c.text,border:"none",borderRadius:8,padding:"10px 22px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
          Add Deal
        </button>
      </div>

      {/* Form */}
      {showForm&&<div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"24px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontSize:15,fontWeight:700}}>{editId?'Edit Deal':'New Deal'}</span>
          <button onClick={()=>{setShowForm(false);setEditId(null)}} style={{background:"none",border:"none",fontSize:18,color:c.dim,cursor:"pointer"}}>x</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:16}}>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Property Address *</label>
            <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="742 Oak Avenue"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Client Name</label>
            <input value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})} placeholder="Marcus Johnson"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Price ($)</label>
            <input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="520000"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Commission ($)</label>
            <input type="number" value={form.commission} onChange={e=>setForm({...form,commission:e.target.value})} placeholder="15600"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Close Date</label>
            <input type="date" value={form.close_date} onChange={e=>setForm({...form,close_date:e.target.value})}
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Stage</label>
            <select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,fontFamily:"inherit",boxSizing:"border-box"}}>
              {stageOptions.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Notes</label>
          <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Deal notes, lender info, special terms..." rows={3}
            style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={handleSave} disabled={!form.address||saving}
            style={{background:c.text,border:"none",borderRadius:6,padding:"10px 24px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",opacity:form.address&&!saving?1:0.5}}>
            {saving?'Saving...':editId?'Update Deal':'Add Deal'}
          </button>
          <button onClick={()=>{setShowForm(false);setEditId(null)}}
            style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"10px 24px",fontSize:13,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        </div>
      </div>}

      {/* Deal list */}
      {deals.length===0?
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"40px 20px",textAlign:"center"}}>
          <div style={{fontSize:14,color:c.sub,marginBottom:8}}>No deals yet</div>
          <div style={{fontSize:13,color:c.dim}}>Click "Add Deal" when you get something under contract</div>
        </div>
      :deals.map((d,i)=>{
        const daysLeft=daysUntil(d.close_date)
        const urgent=daysLeft!==null&&daysLeft<=7&&daysLeft>0
        return(
          <div key={d.id} style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"22px 24px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:16,fontWeight:700}}>{d.address}</div>
                <div style={{fontSize:12,color:c.sub,marginTop:3}}>{d.client_name}{d.close_date?` / Closing ${new Date(d.close_date).toLocaleDateString()}`:''}</div>
              </div>
              <div style={{textAlign:"right"}}>
                {d.price>0&&<div style={{fontSize:16,fontWeight:700,color:c.green}}>${d.price.toLocaleString()}</div>}
                {d.commission>0&&<div style={{fontSize:11,color:c.dim}}>Commission: ${d.commission.toLocaleString()}</div>}
              </div>
            </div>
            <Progress value={d.progress||0} max={100} color={urgent?c.amber:c.green}/>

            {/* Stage pills */}
            <div style={{display:"flex",gap:4,marginTop:12,flexWrap:"wrap"}}>
              {stageOptions.filter(s=>s!=="Closed").map((s,si)=>{
                const currentIdx=stageOptions.indexOf(d.stage)
                const thisIdx=stageOptions.indexOf(s)
                const done=thisIdx<=currentIdx
                return(
                  <button key={s} onClick={()=>handleStageUpdate(d.id,s)}
                    style={{fontSize:10,fontWeight:500,padding:"4px 12px",borderRadius:4,background:done?c.greenSoft:c.bg,color:done?c.green:c.dim,border:`1px solid ${done?c.greenBorder:c.border}`,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>
                )
              })}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:12,borderTop:`1px solid ${c.borderLight}`,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:c.sub}}>Stage: {d.stage}</span>
                {daysLeft!==null&&<span style={{fontSize:12,fontWeight:600,color:urgent?c.amber:daysLeft<0?c.red:c.dim}}>{daysLeft>0?`${daysLeft} days to close`:daysLeft===0?'Closing today':'Overdue'}</span>}
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>handleEdit(d)} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:4,padding:"5px 12px",fontSize:11,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
                <button onClick={()=>handleDelete(d.id)} style={{background:"transparent",border:`1px solid ${c.border}`,borderRadius:4,padding:"5px 12px",fontSize:11,fontWeight:500,color:c.dim,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
              </div>
            </div>
            {d.notes&&<div style={{fontSize:12,color:c.sub,marginTop:10,lineHeight:1.6}}>{d.notes}</div>}
          </div>
        )
      })}
    </div>
  )
}
