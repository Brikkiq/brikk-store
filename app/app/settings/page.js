'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)"}

export default function SettingsPage(){
  const [user,setUser]=useState(null)
  const [profile,setProfile]=useState(null)
  const [loading,setLoading]=useState(true)
  const [activeTab,setActiveTab]=useState(null)
  const [toast,setToast]=useState(null)
  const [saving,setSaving]=useState(false)

  // Profile
  const [editName,setEditName]=useState('')
  const [editPhone,setEditPhone]=useState('')
  const [editBrokerage,setEditBrokerage]=useState('')
  const [profilePic,setProfilePic]=useState(null)
  const fileInputRef=useRef(null)

  // Password
  const [oldPassword,setOldPassword]=useState('')
  const [newPassword,setNewPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')

  // Appearance
  const [darkMode,setDarkMode]=useState(false)
  const [blueLight,setBlueLight]=useState(0)
  const [brightness,setBrightness]=useState(100)
  const [textSize,setTextSize]=useState('medium')

  const showToast=(msg,type='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3000)}

  useEffect(()=>{
    loadProfile()
    if(typeof window!=='undefined'){
      try{
        const saved=JSON.parse(localStorage.getItem('brikk-appearance')||'{}')
        if(saved.darkMode!==undefined)setDarkMode(saved.darkMode)
        if(saved.blueLight!==undefined)setBlueLight(saved.blueLight)
        if(saved.brightness!==undefined)setBrightness(saved.brightness)
        if(saved.textSize)setTextSize(saved.textSize)
        const pic=localStorage.getItem('brikk-profile-pic')
        if(pic)setProfilePic(pic)
      }catch(e){}
    }
  },[])

  // Apply appearance
  useEffect(()=>{
    if(typeof window==='undefined')return
    localStorage.setItem('brikk-appearance',JSON.stringify({darkMode,blueLight,brightness,textSize}))

    // Dark mode
    if(darkMode){
      document.documentElement.style.setProperty('--brikk-bg','#0D0D0C')
      document.documentElement.style.setProperty('--brikk-white','#1A1A18')
      document.documentElement.style.setProperty('--brikk-text','#FAFAF9')
      document.documentElement.style.setProperty('--brikk-sub','#A0A09A')
      document.documentElement.style.setProperty('--brikk-border','#2A2A28')
      document.body.style.background='#0D0D0C'
      document.body.style.color='#FAFAF9'
    }else{
      document.documentElement.style.setProperty('--brikk-bg','#FAFAF9')
      document.documentElement.style.setProperty('--brikk-white','#FFFFFF')
      document.documentElement.style.setProperty('--brikk-text','#1A1A18')
      document.documentElement.style.setProperty('--brikk-sub','#6B6B66')
      document.documentElement.style.setProperty('--brikk-border','#E8E8E4')
      document.body.style.background='#FAFAF9'
      document.body.style.color='#1A1A18'
    }

    // Brightness
    document.documentElement.style.filter=brightness<100?`brightness(${brightness/100})`:''

    // Blue light
    let overlay=document.getElementById('brikk-bluelight')
    if(blueLight>0){
      if(!overlay){overlay=document.createElement('div');overlay.id='brikk-bluelight';overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:99999;transition:opacity 0.3s ease';document.body.appendChild(overlay)}
      overlay.style.background=`rgba(255,180,50,${blueLight/100*0.3})`
    }else if(overlay){overlay.style.background='transparent'}

    // Text size
    const sizes={small:'14px',medium:'16px',large:'18px'}
    document.documentElement.style.fontSize=sizes[textSize]||'16px'
  },[darkMode,blueLight,brightness,textSize])

  const loadProfile=async()=>{
    const {data:{user}}=await supabase.auth.getUser()
    if(!user)return
    setUser(user)
    const {data}=await supabase.from('profiles').select('*').eq('id',user.id).single()
    if(data){
      setProfile(data)
      setEditName(data.full_name||'')
      setEditPhone(data.phone||'')
      setEditBrokerage(data.brokerage||'')
    }
    setLoading(false)
  }

  const saveProfile=async()=>{
    if(!user)return
    setSaving(true)
    await supabase.from('profiles').update({full_name:editName,phone:editPhone,brokerage:editBrokerage}).eq('id',user.id)
    setSaving(false)
    showToast('Profile saved')
    if(window.brikk?.haptic)window.brikk.haptic('success')
  }

  const handleProfilePic=(e)=>{
    const file=e.target.files?.[0]
    if(!file)return
    const reader=new FileReader()
    reader.onload=(ev)=>{
      const base64=ev.target.result
      setProfilePic(base64)
      localStorage.setItem('brikk-profile-pic',base64)
      showToast('Profile picture updated')
    }
    reader.readAsDataURL(file)
  }

  const changePassword=async()=>{
    if(!oldPassword){showToast('Enter your current password','error');return}
    if(!newPassword||newPassword.length<6){showToast('New password must be at least 6 characters','error');return}
    if(newPassword!==confirmPassword){showToast('Passwords don\'t match','error');return}
    setSaving(true)
    // Verify old password by signing in
    const {error:signInError}=await supabase.auth.signInWithPassword({email:user.email,password:oldPassword})
    if(signInError){setSaving(false);showToast('Current password is incorrect','error');return}
    const {error}=await supabase.auth.updateUser({password:newPassword})
    setSaving(false)
    if(error)showToast(error.message,'error')
    else{showToast('Password updated');setOldPassword('');setNewPassword('');setConfirmPassword('')}
  }

  const handleLogout=async()=>{
    await supabase.auth.signOut()
    window.location.href='/'
  }

  if(loading)return <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:c.text,animation:"pulse 1.2s ease-in-out infinite"}}>Loading...</div><style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style></div>

  const inputStyle={width:"100%",padding:"13px 16px",borderRadius:12,border:`1.5px solid ${c.border}`,fontSize:14,color:c.text,background:c.white,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}

  const tabs=[
    {id:'profile',label:'Profile'},
    {id:'appearance',label:'Appearance'},
    {id:'billing',label:'Billing'},
    {id:'privacy',label:'Privacy'},
    {id:'agreement',label:'User Agreement'},
  ]

  // Wheel menu (no tab selected)
  if(!activeTab)return(
    <div style={{position:"fixed",inset:0,background:c.bg,zIndex:200,display:"flex",flexDirection:"column",fontFamily:"'Instrument Sans',-apple-system,sans-serif",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:300,background:toast.type==='error'?c.redSoft:c.greenSoft,border:`1px solid ${toast.type==='error'?'rgba(190,18,60,0.15)':c.greenBorder}`,borderRadius:12,padding:"12px 24px",fontSize:13,fontWeight:600,color:toast.type==='error'?c.red:c.green,boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}>{toast.msg}</div>}

      {/* Header */}
      <div style={{padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,margin:0,letterSpacing:"-0.02em"}}>Settings</h1>
          <p style={{fontSize:13,color:c.dim,margin:"4px 0 0"}}>{user?.email}</p>
        </div>
        <a href="/app" style={{width:36,height:36,borderRadius:12,background:c.bg,border:`1px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",fontSize:16,color:c.dim}}>×</a>
      </div>

      {/* Profile card */}
      <div style={{padding:"0 24px 24px",flexShrink:0}}>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"24px",display:"flex",alignItems:"center",gap:16}}>
          <div onClick={()=>fileInputRef.current?.click()} style={{width:60,height:60,borderRadius:18,background:profilePic?'transparent':c.bg,border:`2px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",flexShrink:0}}>
            {profilePic?<img src={profilePic} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<span style={{fontSize:20,fontWeight:700,color:c.text}}>{editName?editName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase():'?'}</span>}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleProfilePic} accept="image/*" style={{display:"none"}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:17,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{editName||'No name'}</div>
            <div style={{fontSize:12,color:c.dim,marginTop:2}}>{editBrokerage||'No brokerage set'}</div>
            <div style={{fontSize:11,color:c.dim,marginTop:2}}>Tap photo to change</div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div style={{flex:1,padding:"0 24px",overflow:"auto"}}>
        {tabs.map((t,i)=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"18px 20px",marginBottom:8,cursor:"pointer",fontFamily:"inherit",transition:"transform 0.1s ease"}}>
            <span style={{fontSize:15,fontWeight:600,color:c.text}}>{t.label}</span>
            <span style={{fontSize:16,color:c.dim}}>›</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div style={{padding:"16px 24px calc(16px + env(safe-area-inset-bottom, 0px))",flexShrink:0}}>
        <button onClick={handleLogout} style={{width:"100%",background:c.white,border:`1px solid rgba(190,18,60,0.2)`,borderRadius:14,padding:"16px",fontSize:14,fontWeight:600,color:c.red,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
        <div style={{textAlign:"center",marginTop:10}}><span style={{fontSize:11,color:c.dim}}>Brikk v1.1</span></div>
      </div>
    </div>
  )

  // Tab content — locked in settings overlay
  return(
    <div style={{position:"fixed",inset:0,background:c.bg,zIndex:200,display:"flex",flexDirection:"column",fontFamily:"'Instrument Sans',-apple-system,sans-serif",overflow:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:300,background:toast.type==='error'?c.redSoft:c.greenSoft,border:`1px solid ${toast.type==='error'?'rgba(190,18,60,0.15)':c.greenBorder}`,borderRadius:12,padding:"12px 24px",fontSize:13,fontWeight:600,color:toast.type==='error'?c.red:c.green,boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}>{toast.msg}</div>}

      {/* Back header */}
      <div style={{padding:"16px 24px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${c.border}`,flexShrink:0}}>
        <button onClick={()=>setActiveTab(null)} style={{width:36,height:36,borderRadius:12,background:c.bg,border:`1px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,color:c.text,fontFamily:"inherit"}}>‹</button>
        <span style={{fontSize:17,fontWeight:700}}>{tabs.find(t=>t.id===activeTab)?.label}</span>
      </div>

      {/* Scrollable content */}
      <div style={{flex:1,overflow:"auto",padding:"20px 24px calc(20px + env(safe-area-inset-bottom, 0px))"}}>

        {/* PROFILE */}
        {activeTab==='profile'&&<>
          {/* Profile picture */}
          <div style={{textAlign:"center",marginBottom:28}}>
            <div onClick={()=>fileInputRef.current?.click()} style={{width:80,height:80,borderRadius:24,background:profilePic?'transparent':c.bg,border:`2px solid ${c.border}`,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}}>
              {profilePic?<img src={profilePic} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<span style={{fontSize:28,fontWeight:700,color:c.text}}>{editName?editName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase():'?'}</span>}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleProfilePic} accept="image/*" style={{display:"none"}}/>
            <div style={{fontSize:12,color:c.dim,marginTop:8}}>Tap to change photo</div>
          </div>

          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"24px 20px",marginBottom:16}}>
            <div style={{display:"grid",gap:18}}>
              <div><label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Full Name</label><input value={editName} onChange={e=>setEditName(e.target.value)} style={inputStyle}/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Email</label><div style={{...inputStyle,background:c.bg,color:c.dim}}>{user?.email}</div></div>
              <div><label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Phone</label><input value={editPhone} onChange={e=>setEditPhone(e.target.value)} placeholder="(801) 555-0142" style={inputStyle}/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Brokerage</label><input value={editBrokerage} onChange={e=>setEditBrokerage(e.target.value)} placeholder="Keller Williams, eXp, etc." style={inputStyle}/></div>
            </div>
            <button onClick={saveProfile} disabled={saving} style={{marginTop:20,width:"100%",background:c.text,border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",opacity:saving?0.6:1}}>{saving?'Saving...':'Save Changes'}</button>
          </div>

          {/* Password */}
          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"24px 20px"}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>Change Password</div>
            <div style={{display:"grid",gap:14}}>
              <div><label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Current Password</label><input type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} placeholder="Enter current password" style={inputStyle}/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>New Password</label><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Min 6 characters" style={inputStyle}/></div>
              <div><label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Confirm New Password</label><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={inputStyle}/></div>
            </div>
            <button onClick={changePassword} disabled={saving} style={{marginTop:20,width:"100%",background:c.text,border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",opacity:saving?0.6:1}}>{saving?'Updating...':'Update Password'}</button>
          </div>
        </>}

        {/* APPEARANCE */}
        {activeTab==='appearance'&&<>
          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"24px 20px"}}>

            {/* Dark Mode */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",borderBottom:`1px solid ${c.borderLight}`}}>
              <div><div style={{fontSize:15,fontWeight:600}}>Dark Mode</div><div style={{fontSize:12,color:c.dim,marginTop:3}}>Reduce glare in low light</div></div>
              <button onClick={()=>setDarkMode(!darkMode)} style={{width:56,height:32,borderRadius:16,background:darkMode?c.green:"#D4D4D0",border:"none",cursor:"pointer",position:"relative",transition:"background 0.25s ease"}}>
                <div style={{width:26,height:26,borderRadius:13,background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.18)",position:"absolute",top:3,left:darkMode?27:3,transition:"left 0.25s ease"}}/>
              </button>
            </div>

            {/* Brightness */}
            <div style={{padding:"20px 0",borderBottom:`1px solid ${c.borderLight}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                <div><div style={{fontSize:15,fontWeight:600}}>Brightness</div><div style={{fontSize:12,color:c.dim,marginTop:3}}>Screen brightness level</div></div>
                <span style={{fontSize:14,fontWeight:700,color:c.text,background:c.bg,borderRadius:8,padding:"4px 10px"}}>{brightness}%</span>
              </div>
              <input type="range" min="40" max="100" value={brightness} onChange={e=>setBrightness(parseInt(e.target.value))}
                style={{width:"100%",height:8,borderRadius:4,appearance:"none",WebkitAppearance:"none",background:`linear-gradient(to right, ${c.text} ${(brightness-40)/60*100}%, #D4D4D0 ${(brightness-40)/60*100}%)`,outline:"none",cursor:"pointer"}}/>
            </div>

            {/* Blue Light */}
            <div style={{padding:"20px 0",borderBottom:`1px solid ${c.borderLight}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                <div><div style={{fontSize:15,fontWeight:600}}>Blue Light Filter</div><div style={{fontSize:12,color:c.dim,marginTop:3}}>Warm tones reduce eye strain</div></div>
                <span style={{fontSize:14,fontWeight:700,color:"#D97706",background:"rgba(217,119,6,0.08)",borderRadius:8,padding:"4px 10px"}}>{blueLight}%</span>
              </div>
              <input type="range" min="0" max="100" value={blueLight} onChange={e=>setBlueLight(parseInt(e.target.value))}
                style={{width:"100%",height:8,borderRadius:4,appearance:"none",WebkitAppearance:"none",background:`linear-gradient(to right, #F59E0B ${blueLight}%, #D4D4D0 ${blueLight}%)`,outline:"none",cursor:"pointer"}}/>
            </div>

            {/* Text Size */}
            <div style={{padding:"20px 0"}}>
              <div style={{fontSize:15,fontWeight:600,marginBottom:12}}>Text Size</div>
              <div style={{display:"flex",gap:8}}>
                {[{id:'small',label:'Small',size:13},{id:'medium',label:'Medium',size:15},{id:'large',label:'Large',size:17}].map(s=>(
                  <button key={s.id} onClick={()=>setTextSize(s.id)} style={{flex:1,padding:"14px 8px",borderRadius:12,border:textSize===s.id?`2px solid ${c.text}`:`1.5px solid ${c.border}`,background:textSize===s.id?c.text:"transparent",color:textSize===s.id?"#fff":c.sub,fontSize:s.size,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s ease"}}>{s.label}</button>
                ))}
              </div>
            </div>
          </div>
        </>}

        {/* BILLING */}
        {activeTab==='billing'&&<>
          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"24px 20px",marginBottom:16}}>
            <div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:12,padding:"20px",marginBottom:20,textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:700,color:c.green}}>Free Trial Active</div>
              <div style={{fontSize:13,color:c.sub,marginTop:6}}>Full access to all features for 45 days</div>
            </div>
            <div style={{fontSize:13,color:c.sub,lineHeight:1.7,marginBottom:20}}>After your trial, choose a plan to continue using Brikk. Pro is $75/month for solo agents. Team is $200/month for up to 5 agents. Both include a one-time $125 setup fee.</div>
          </div>

          <div style={{background:c.white,border:`2px solid ${c.text}`,borderRadius:16,padding:"28px 20px",textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Payment Method</div>
            <div style={{fontSize:13,color:c.dim,marginBottom:24}}>Add a payment method to continue after your trial</div>
            <div style={{background:c.bg,border:`1px dashed ${c.border}`,borderRadius:14,padding:"40px 20px",marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:600,color:c.sub}}>No payment method added</div>
              <div style={{fontSize:12,color:c.dim,marginTop:6}}>We accept all major credit cards, debit cards, and Klarna</div>
            </div>
            <button style={{width:"100%",background:c.text,border:"none",borderRadius:12,padding:"16px",fontSize:15,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Add Payment Method</button>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:16}}>
              {['Visa','Mastercard','Amex','Klarna','Apple Pay'].map(p=>(
                <span key={p} style={{fontSize:10,color:c.dim,background:c.bg,borderRadius:6,padding:"4px 8px",border:`1px solid ${c.borderLight}`}}>{p}</span>
              ))}
            </div>
          </div>
        </>}

        {/* PRIVACY */}
        {activeTab==='privacy'&&<>
          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"24px 20px",marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>Data Controls</div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",borderBottom:`1px solid ${c.borderLight}`}}>
              <div><div style={{fontSize:14,fontWeight:600}}>AI Data Processing</div><div style={{fontSize:12,color:c.dim,marginTop:3}}>Let AI analyze leads for better drafts</div></div>
              <button style={{width:56,height:32,borderRadius:16,background:c.green,border:"none",cursor:"pointer",position:"relative"}}><div style={{width:26,height:26,borderRadius:13,background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.18)",position:"absolute",top:3,left:27}}/></button>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0"}}>
              <div><div style={{fontSize:14,fontWeight:600}}>SMS Messaging</div><div style={{fontSize:12,color:c.dim,marginTop:3}}>Allow sending texts to leads</div></div>
              <button style={{width:56,height:32,borderRadius:16,background:c.green,border:"none",cursor:"pointer",position:"relative"}}><div style={{width:26,height:26,borderRadius:13,background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.18)",position:"absolute",top:3,left:27}}/></button>
            </div>
          </div>

          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"24px 20px",marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>Your Data</div>
            <div style={{display:"grid",gap:10}}>
              <button style={{width:"100%",background:c.bg,border:`1px solid ${c.border}`,borderRadius:12,padding:"14px 16px",fontSize:13,fontWeight:600,color:c.sub,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>Export All Data</button>
              <button style={{width:"100%",background:c.redSoft,border:`1px solid rgba(190,18,60,0.15)`,borderRadius:12,padding:"14px 16px",fontSize:13,fontWeight:600,color:c.red,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>Delete Account</button>
            </div>
          </div>

          <a href="/privacy" target="_blank" style={{display:"block",background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"18px 20px",textDecoration:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:14,fontWeight:600,color:c.text}}>View Full Privacy Policy</span><span style={{color:c.dim}}>›</span></div>
          </a>
        </>}

        {/* USER AGREEMENT */}
        {activeTab==='agreement'&&<>
          <a href="/terms" target="_blank" style={{display:"block",background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"18px 20px",textDecoration:"none",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:14,fontWeight:600,color:c.text}}>Terms of Service</span><span style={{color:c.dim}}>›</span></div>
            <div style={{fontSize:12,color:c.dim,marginTop:4}}>Review the terms of use</div>
          </a>
          <a href="/privacy" target="_blank" style={{display:"block",background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"18px 20px",textDecoration:"none",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:14,fontWeight:600,color:c.text}}>Privacy Policy</span><span style={{color:c.dim}}>›</span></div>
            <div style={{fontSize:12,color:c.dim,marginTop:4}}>How we handle your data</div>
          </a>
          <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:16,padding:"24px 20px"}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Acceptable Use</div>
            <div style={{fontSize:13,color:c.sub,lineHeight:1.8}}>By using Brikk you agree to use the service for legitimate real estate business purposes. You must review all AI-generated content before sending to leads. You are responsible for compliance with CAN-SPAM, TCPA, and local real estate regulations. Misuse of the platform may result in account termination.</div>
          </div>
        </>}
      </div>
    </div>
  )
}
