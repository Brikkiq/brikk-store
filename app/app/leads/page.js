'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",amber:"#A16207",amberSoft:"rgba(161,98,7,0.06)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",purple:"#6D28D9",purpleSoft:"rgba(109,40,217,0.05)"}

const sourceOptions=["Zillow","Referral","Open House","Social Media","Website","Cold Call","Other"]
const tempOptions=["hot","warm","cold"]
const stageOptions=["New Lead","Contacted","Showing Scheduled","Offer Submitted","Under Contract","Closed Won","Closed Lost"]
const typeOptions=["Buyer","Seller"]

export default function LeadsPage(){
  const [leads,setLeads]=useState([])
  const [loading,setLoading]=useState(true)
  const [showForm,setShowForm]=useState(false)
  const [editId,setEditId]=useState(null)
  const [filter,setFilter]=useState("all")
  const [saving,setSaving]=useState(false)
  const [toast,setToast]=useState(null)
  const [form,setForm]=useState({name:'',phone:'',email:'',source:'Zillow',temperature:'warm',stage:'New Lead',lead_type:'Buyer',price_range:'',notes:'',last_contact_date:'',address:'',preferred_area:'',bedrooms:'',pre_approved:false,pre_approved_amount:'',timeline:'',birthday:'',contact_preference:'text',spouse_name:''})

  const showToast=(msg,type='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3000)}

  useEffect(()=>{loadLeads()},[])

  const loadLeads=async()=>{
    const {data}=await supabase.from('leads').select('*').order('created_at',{ascending:false})
    setLeads(data||[]);setLoading(false)
  }

  const handleSave=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return
    setSaving(true)

    const saveData={...form}
    if(!saveData.last_contact_date){
      saveData.last_contact_date=new Date().toISOString()
    }else{
      saveData.last_contact_date=new Date(saveData.last_contact_date).toISOString()
    }

    try{
      if(editId){
        const {last_contact_date,...rest}=saveData
        await supabase.from('leads').update({...rest,last_contact_date,updated_at:new Date().toISOString()}).eq('id',editId)
        showToast('Lead updated')
      }else{
        await supabase.from('leads').insert({...saveData,user_id:user.id})
        showToast('Lead added')
      }
    }catch(err){showToast('Something went wrong','error')}

    setSaving(false)
    setForm({name:'',phone:'',email:'',source:'Zillow',temperature:'warm',stage:'New Lead',lead_type:'Buyer',price_range:'',notes:'',last_contact_date:'',address:'',preferred_area:'',bedrooms:'',pre_approved:false,pre_approved_amount:'',timeline:'',birthday:'',contact_preference:'text',spouse_name:''})
    setShowForm(false);setEditId(null);loadLeads()
  }

  const handleEdit=(lead)=>{
    const lcd=lead.last_contact_date?new Date(lead.last_contact_date).toISOString().split('T')[0]:''
    const bday=lead.birthday?new Date(lead.birthday).toISOString().split('T')[0]:''
    setForm({name:lead.name||'',phone:lead.phone||'',email:lead.email||'',source:lead.source||'Zillow',temperature:lead.temperature||'warm',stage:lead.stage||'New Lead',lead_type:lead.lead_type||'Buyer',price_range:lead.price_range||'',notes:lead.notes||'',last_contact_date:lcd,address:lead.address||'',preferred_area:lead.preferred_area||'',bedrooms:lead.bedrooms||'',pre_approved:lead.pre_approved||false,pre_approved_amount:lead.pre_approved_amount||'',timeline:lead.timeline||'',birthday:bday,contact_preference:lead.contact_preference||'text',spouse_name:lead.spouse_name||''})
    setEditId(lead.id);setShowForm(true)
  }

  const handleDelete=async(id)=>{
    if(!confirm('Delete this lead?'))return
    await supabase.from('leads').delete().eq('id',id)
    showToast('Lead deleted')
    loadLeads()
  }

  const handleLogContact=async(id)=>{
    await supabase.from('leads').update({last_contact_date:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id)
    const {data:{user}}=await supabase.auth.getUser()
    if(user){await supabase.from('interactions').insert({user_id:user.id,lead_id:id,interaction_type:'contact',notes:'Logged contact'})}
    showToast('Contact logged')
    loadLeads()
  }

  const daysSince=(date)=>{
    if(!date)return 999
    return Math.floor((new Date()-new Date(date))/(1000*60*60*24))
  }

  const filtered=filter==='all'?leads:leads.filter(l=>l.temperature===filter)
  const tempColor=(t)=>({hot:{bg:c.redSoft,color:c.red},warm:{bg:c.amberSoft,color:c.amber},cold:{bg:"rgba(26,26,24,0.04)",color:c.dim}}[t]||{bg:c.bg,color:c.dim})

  if(loading)return <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:c.text,animation:"pulse 1.2s ease-in-out infinite"}}>Loading leads...</div><style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style></div>

  return(
    <div>
      {/* Toast */}
      {toast&&<div style={{position:"fixed",top:80,right:20,zIndex:200,background:toast.type==='error'?c.redSoft:c.greenSoft,border:`1px solid ${toast.type==='error'?'rgba(190,18,60,0.15)':c.greenBorder}`,borderRadius:8,padding:"12px 20px",fontSize:13,fontWeight:600,color:toast.type==='error'?c.red:c.green,animation:"slideUp 0.3s ease-out",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>{toast.msg}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-0.01em",margin:"0 0 4px"}}>Leads</h1>
          <p style={{fontSize:13,color:c.sub,margin:0}}>{leads.length} total leads</p>
        </div>
        <button onClick={()=>{setShowForm(true);setEditId(null);setForm({name:'',phone:'',email:'',source:'Zillow',temperature:'warm',stage:'New Lead',lead_type:'Buyer',price_range:'',notes:'',last_contact_date:'',address:'',preferred_area:'',bedrooms:'',pre_approved:false,pre_approved_amount:'',timeline:'',birthday:'',contact_preference:'text',spouse_name:''})}}
          style={{background:c.text,border:"none",borderRadius:8,padding:"10px 22px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {["all","hot","warm","cold"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?c.text:"transparent",color:filter===f?"#fff":c.dim,border:`1px solid ${filter===f?c.text:c.border}`,borderRadius:6,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{f==='all'?`All (${leads.length})`:f==='hot'?`Hot (${leads.filter(l=>l.temperature==='hot').length})`:f==='warm'?`Warm (${leads.filter(l=>l.temperature==='warm').length})`:`Cold (${leads.filter(l=>l.temperature==='cold').length})`}</button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm&&<div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:10,padding:"24px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontSize:15,fontWeight:700}}>{editId?'Edit Lead':'New Lead'}</span>
          <button onClick={()=>{setShowForm(false);setEditId(null)}} style={{background:"none",border:"none",fontSize:18,color:c.dim,cursor:"pointer"}}>x</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:16}}>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Name *</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Sarah Mitchell"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Phone</label>
            <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="(801) 555-0142"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Email</label>
            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="sarah@email.com"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Source</label>
            <select value={form.source} onChange={e=>setForm({...form,source:e.target.value})}
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,fontFamily:"inherit",boxSizing:"border-box"}}>
              {sourceOptions.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Temperature</label>
            <select value={form.temperature} onChange={e=>setForm({...form,temperature:e.target.value})}
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,fontFamily:"inherit",boxSizing:"border-box"}}>
              {tempOptions.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Stage</label>
            <select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,fontFamily:"inherit",boxSizing:"border-box"}}>
              {stageOptions.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Type</label>
            <select value={form.lead_type} onChange={e=>setForm({...form,lead_type:e.target.value})}
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,fontFamily:"inherit",boxSizing:"border-box"}}>
              {typeOptions.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Price Range</label>
            <input value={form.price_range} onChange={e=>setForm({...form,price_range:e.target.value})} placeholder="$275K - $350K"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Last Contacted</label>
            <input type="date" value={form.last_contact_date} onChange={e=>setForm({...form,last_contact_date:e.target.value})}
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,fontFamily:"inherit",boxSizing:"border-box"}}/>
            <div style={{fontSize:10,color:c.dim,marginTop:3}}>Leave blank for today</div>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Current Address</label>
            <input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="123 Main St, City"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Preferred Area</label>
            <input value={form.preferred_area} onChange={e=>setForm({...form,preferred_area:e.target.value})} placeholder="Downtown, Westside, etc."
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Bedrooms</label>
            <select value={form.bedrooms} onChange={e=>setForm({...form,bedrooms:e.target.value})}
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,fontFamily:"inherit",boxSizing:"border-box"}}>
              <option value="">Any</option>
              {["1","2","3","4","5+"].map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Pre-Approved?</label>
            <div style={{display:"flex",gap:6}}>
              {[{l:"No",v:false},{l:"Yes",v:true}].map(o=>(
                <button key={o.l} type="button" onClick={()=>setForm({...form,pre_approved:o.v})}
                  style={{flex:1,padding:"10px",borderRadius:6,border:`1px solid ${form.pre_approved===o.v?c.text:c.border}`,background:form.pre_approved===o.v?c.text:"transparent",color:form.pre_approved===o.v?"#fff":c.sub,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{o.l}</button>
              ))}
            </div>
          </div>
          {form.pre_approved&&<div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Pre-Approval Amount</label>
            <input value={form.pre_approved_amount} onChange={e=>setForm({...form,pre_approved_amount:e.target.value})} placeholder="$350,000"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>}
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Timeline</label>
            <select value={form.timeline} onChange={e=>setForm({...form,timeline:e.target.value})}
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,fontFamily:"inherit",boxSizing:"border-box"}}>
              <option value="">Not specified</option>
              {["ASAP","1-3 months","3-6 months","6-12 months","Just browsing"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Contact Preference</label>
            <div style={{display:"flex",gap:4}}>
              {["text","call","email"].map(p=>(
                <button key={p} type="button" onClick={()=>setForm({...form,contact_preference:p})}
                  style={{flex:1,padding:"10px",borderRadius:6,border:`1px solid ${form.contact_preference===p?c.text:c.border}`,background:form.contact_preference===p?c.text:"transparent",color:form.contact_preference===p?"#fff":c.sub,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Birthday</label>
            <input type="date" value={form.birthday} onChange={e=>setForm({...form,birthday:e.target.value})}
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Spouse / Partner</label>
            <input value={form.spouse_name} onChange={e=>setForm({...form,spouse_name:e.target.value})} placeholder="Partner's name"
              style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,fontWeight:600,color:c.sub,display:"block",marginBottom:4}}>Notes</label>
          <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Interested in 3br homes near downtown..." rows={3}
            style={{width:"100%",padding:"10px 12px",borderRadius:6,border:`1px solid ${c.border}`,fontSize:13,color:c.text,background:c.bg,outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={handleSave} disabled={!form.name||saving}
            style={{background:c.text,border:"none",borderRadius:6,padding:"10px 24px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",opacity:form.name&&!saving?1:0.5}}>
            {saving?'Saving...':editId?'Update Lead':'Add Lead'}
          </button>
          <button onClick={()=>{setShowForm(false);setEditId(null)}}
            style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,padding:"10px 24px",fontSize:13,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>
            Cancel
          </button>
        </div>
      </div>}

      {/* Lead list */}
      {filtered.length===0?
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:8,padding:"40px 20px",textAlign:"center"}}>
          <div style={{fontSize:14,color:c.sub,marginBottom:8}}>No leads yet</div>
          <div style={{fontSize:13,color:c.dim}}>Click "Add Lead" to start building your pipeline</div>
        </div>
      :filtered.map((l,i)=>{
        const days=daysSince(l.last_contact_date)
        const tc=tempColor(l.temperature)
        const urgent=(l.temperature==='hot'&&days>=2)||(l.temperature==='warm'&&days>=5)
        return(
          <div key={l.id} style={{background:c.white,border:`1px solid ${urgent?c.redSoft:c.border}`,borderRadius:8,padding:"16px 20px",marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:8,background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:tc.color,flexShrink:0}}>{l.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>{l.name}</div>
                  <div style={{fontSize:11,color:c.dim}}>{l.lead_type} / {l.source} / {l.stage}{l.price_range?` / ${l.price_range}`:''}{l.timeline?` / ${l.timeline}`:''}</div>
                  {l.phone&&<div style={{fontSize:11,color:c.sub,marginTop:2}}>{l.phone}{l.email?` / ${l.email}`:''}</div>}
                  {(l.preferred_area||l.bedrooms||l.pre_approved)&&<div style={{fontSize:11,color:c.sub,marginTop:2}}>{l.preferred_area?`Area: ${l.preferred_area}`:''}{l.bedrooms?` / ${l.bedrooms}br`:''}{l.pre_approved?` / Pre-approved${l.pre_approved_amount?' '+l.pre_approved_amount:''}`:''}</div>}
                  {l.contact_preference&&l.contact_preference!=='text'&&<div style={{fontSize:10,color:c.dim,marginTop:2}}>Prefers: {l.contact_preference}</div>}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,color:tc.color}}>{l.temperature?.toUpperCase()}</span>
                <span style={{fontSize:12,fontWeight:600,color:days>=5?c.red:days>=3?c.amber:c.dim}}>{days===0?"Today":`${days}d ago`}</span>
              </div>
            </div>
            {l.notes&&<div style={{fontSize:12,color:c.sub,marginTop:8,paddingTop:8,borderTop:`1px solid ${c.borderLight}`,lineHeight:1.6}}>{l.notes}</div>}
            <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
              <button onClick={()=>handleLogContact(l.id)} style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:4,padding:"5px 12px",fontSize:11,fontWeight:600,color:c.green,cursor:"pointer",fontFamily:"inherit"}}>Log Contact</button>
              <button onClick={()=>handleEdit(l)} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:4,padding:"5px 12px",fontSize:11,fontWeight:500,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
              <button onClick={()=>handleDelete(l.id)} style={{background:"transparent",border:`1px solid ${c.border}`,borderRadius:4,padding:"5px 12px",fontSize:11,fontWeight:500,color:c.dim,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
