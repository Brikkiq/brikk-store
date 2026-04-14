'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsPage(){
  const [user,setUser]=useState(null)
  const [profile,setProfile]=useState(null)
  const [loading,setLoading]=useState(true)
  const [activeTab,setActiveTab]=useState('profile')
  const [toast,setToast]=useState(null)
  const [saving,setSaving]=useState(false)

  // Appearance state
  const [darkMode,setDarkMode]=useState(false)
  const [blueLight,setBlueLight]=useState(0)
  const [brightness,setBrightness]=useState(100)

  // Profile edit state
  const [editName,setEditName]=useState('')
  const [editPhone,setEditPhone]=useState('')
  const [editBrokerage,setEditBrokerage]=useState('')
  const [editGoal,setEditGoal]=useState('')

  // Password state
  const [newPassword,setNewPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')

  const showToast=(msg,type='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3000)}

  useEffect(()=>{
    loadProfile()
    // Load saved appearance settings
    if(typeof window!=='undefined'){
      const saved=localStorage.getItem('brikk-appearance')
      if(saved){
        try{
          const s=JSON.parse(saved)
          setDarkMode(s.darkMode||false)
          setBlueLight(s.blueLight||0)
          setBrightness(s.brightness||100)
        }catch(e){}
      }
    }
  },[])

  // Apply appearance effects
  useEffect(()=>{
    if(typeof window==='undefined')return
    // Save settings
    localStorage.setItem('brikk-appearance',JSON.stringify({darkMode,blueLight,brightness}))
    // Apply dark mode
    document.documentElement.style.filter=`brightness(${brightness/100})`
    // Blue light filter overlay
    let overlay=document.getElementById('brikk-bluelight')
    if(blueLight>0){
      if(!overlay){
        overlay=document.createElement('div')
        overlay.id='brikk-bluelight'
        overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:99999;transition:opacity 0.3s ease'
        document.body.appendChild(overlay)
      }
      overlay.style.background=`rgba(255,180,50,${blueLight/100*0.25})`
    }else if(overlay){
      overlay.style.background='transparent'
    }
  },[darkMode,blueLight,brightness])

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
      setEditGoal(data.annual_goal?.toString()||'')
    }
    setLoading(false)
  }

  const saveProfile=async()=>{
    if(!user)return
    setSaving(true)
    await supabase.from('profiles').update({
      full_name:editName,
      phone:editPhone,
      brokerage:editBrokerage,
      annual_goal:parseFloat(editGoal)||null
    }).eq('id',user.id)
    setSaving(false)
    showToast('Profile updated')
    if(window.brikk?.haptic)window.brikk.haptic('success')
  }

  const changePassword=async()=>{
    if(!newPassword||newPassword.length<6){showToast('Password must be at least 6 characters','error');return}
    if(newPassword!==confirmPassword){showToast('Passwords don\'t match','error');return}
    setSaving(true)
    const {error}=await supabase.auth.updateUser({password:newPassword})
    setSaving(false)
    if(error)showToast(error.message,'error')
    else{showToast('Password updated');setNewPassword('');setConfirmPassword('')}
  }

  const handleLogout=async()=>{
    await supabase.auth.signOut()
    window.location.href='/'
  }

  const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",borderLight:"#F0F0EC",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96",green:"#16803C",greenSoft:"rgba(22,128,60,0.06)",greenBorder:"rgba(22,128,60,0.15)",red:"#BE123C",redSoft:"rgba(190,18,60,0.06)",amber:"#A16207"}

  if(loading)return <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:c.text,animation:"pulse 1.2s ease-in-out infinite"}}>Loading settings...</div><style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style></div>

  const tabs=[
    {id:'profile',label:'Profile',icon:'👤'},
    {id:'appearance',label:'Appearance',icon:'🎨'},
    {id:'billing',label:'Billing',icon:'💳'},
    {id:'privacy',label:'Privacy',icon:'🔒'},
    {id:'agreement',label:'User Agreement',icon:'📄'},
  ]

  const inputStyle={width:"100%",padding:"12px 16px",borderRadius:10,border:`1px solid ${c.border}`,fontSize:14,color:c.text,background:c.white,outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border-color 0.15s ease,box-shadow 0.15s ease"}

  return(
    <div className="page-enter">
      {/* Toast */}
      {toast&&<div className="toast" style={{position:"fixed",top:80,right:20,zIndex:200,background:toast.type==='error'?c.redSoft:c.greenSoft,border:`1px solid ${toast.type==='error'?'rgba(190,18,60,0.15)':c.greenBorder}`,borderRadius:10,padding:"12px 20px",fontSize:13,fontWeight:600,color:toast.type==='error'?c.red:c.green,boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>{toast.msg}</div>}

      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",margin:"0 0 4px"}}>Settings</h1>
        <p style={{fontSize:13,color:c.sub,margin:0}}>Manage your account and preferences</p>
      </div>

      {/* Tab selector */}
      <div style={{display:"flex",gap:4,marginBottom:24,overflowX:"auto",paddingBottom:4}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6,background:activeTab===t.id?c.text:"transparent",color:activeTab===t.id?"#fff":c.dim,border:`1px solid ${activeTab===t.id?c.text:c.border}`,borderRadius:10,padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",transition:"all 0.15s ease"}}>
            <span style={{fontSize:14}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab==='profile'&&<div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"28px 24px",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Your Profile</div>
          <div style={{fontSize:12,color:c.dim,marginBottom:20}}>This information is private and only visible to you.</div>

          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
            <div style={{width:56,height:56,borderRadius:16,background:c.bg,border:`2px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:c.text}}>{editName?editName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase():'?'}</div>
            <div>
              <div style={{fontSize:16,fontWeight:700}}>{editName||'No name set'}</div>
              <div style={{fontSize:12,color:c.dim}}>{user?.email}</div>
            </div>
          </div>

          <div style={{display:"grid",gap:16}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Full Name</label>
              <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Your full name" style={inputStyle}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Phone</label>
              <input value={editPhone} onChange={e=>setEditPhone(e.target.value)} placeholder="(801) 555-0142" style={inputStyle}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Brokerage</label>
              <input value={editBrokerage} onChange={e=>setEditBrokerage(e.target.value)} placeholder="Keller Williams, eXp, etc." style={inputStyle}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Annual Commission Goal</label>
              <input value={editGoal} onChange={e=>setEditGoal(e.target.value)} placeholder="150000" style={inputStyle}/>
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} style={{marginTop:20,background:c.text,border:"none",borderRadius:10,padding:"12px 28px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",opacity:saving?0.6:1}}>{saving?'Saving...':'Save Changes'}</button>
        </div>

        {/* Change password */}
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"28px 24px"}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Change Password</div>
          <div style={{fontSize:12,color:c.dim,marginBottom:20}}>Enter a new password below.</div>
          <div style={{display:"grid",gap:16}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>New Password</label>
              <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Min 6 characters" style={inputStyle}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:c.sub,display:"block",marginBottom:6}}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={inputStyle}/>
            </div>
          </div>
          <button onClick={changePassword} disabled={saving} style={{marginTop:20,background:c.text,border:"none",borderRadius:10,padding:"12px 28px",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:"inherit",opacity:saving?0.6:1}}>{saving?'Updating...':'Update Password'}</button>
        </div>
      </div>}

      {/* Appearance Tab */}
      {activeTab==='appearance'&&<div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"28px 24px",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:20}}>Display</div>

          {/* Dark Mode Toggle */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",borderBottom:`1px solid ${c.borderLight}`}}>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>Dark Mode</div>
              <div style={{fontSize:12,color:c.dim,marginTop:2}}>Switch to dark theme</div>
            </div>
            <button onClick={()=>setDarkMode(!darkMode)} style={{width:52,height:30,borderRadius:15,background:darkMode?c.green:c.borderLight,border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s ease"}}>
              <div style={{width:24,height:24,borderRadius:12,background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.15)",position:"absolute",top:3,left:darkMode?25:3,transition:"left 0.2s ease"}}/>
            </button>
          </div>

          {/* Brightness */}
          <div style={{padding:"20px 0",borderBottom:`1px solid ${c.borderLight}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>Brightness</div>
                <div style={{fontSize:12,color:c.dim,marginTop:2}}>Adjust screen brightness</div>
              </div>
              <span style={{fontSize:13,fontWeight:600,color:c.sub}}>{brightness}%</span>
            </div>
            <input type="range" min="50" max="100" value={brightness} onChange={e=>setBrightness(parseInt(e.target.value))}
              style={{width:"100%",height:6,borderRadius:3,appearance:"none",WebkitAppearance:"none",background:`linear-gradient(to right, ${c.text} ${(brightness-50)/50*100}%, ${c.borderLight} ${(brightness-50)/50*100}%)`,outline:"none",cursor:"pointer"}}/>
          </div>

          {/* Blue Light Filter */}
          <div style={{padding:"20px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>Blue Light Filter</div>
                <div style={{fontSize:12,color:c.dim,marginTop:2}}>Reduce eye strain with warm tones</div>
              </div>
              <span style={{fontSize:13,fontWeight:600,color:c.sub}}>{blueLight}%</span>
            </div>
            <input type="range" min="0" max="100" value={blueLight} onChange={e=>setBlueLight(parseInt(e.target.value))}
              style={{width:"100%",height:6,borderRadius:3,appearance:"none",WebkitAppearance:"none",background:`linear-gradient(to right, #F59E0B ${blueLight}%, ${c.borderLight} ${blueLight}%)`,outline:"none",cursor:"pointer"}}/>
          </div>
        </div>

        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"28px 24px"}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>Text Size</div>
          <div style={{fontSize:12,color:c.dim,marginBottom:16}}>Adjust the text size across the app. Coming soon.</div>
          <div style={{display:"flex",gap:8}}>
            {['Small','Medium','Large'].map(s=>(
              <button key={s} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${s==='Medium'?c.text:c.border}`,background:s==='Medium'?c.text:"transparent",color:s==='Medium'?"#fff":c.dim,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>
            ))}
          </div>
        </div>
      </div>}

      {/* Billing Tab */}
      {activeTab==='billing'&&<div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"28px 24px",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Current Plan</div>
          <div style={{fontSize:12,color:c.dim,marginBottom:20}}>Your subscription details.</div>

          <div style={{background:c.greenSoft,border:`1px solid ${c.greenBorder}`,borderRadius:10,padding:"20px",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:c.green}}>Free Trial</div>
                <div style={{fontSize:13,color:c.sub,marginTop:4}}>Full access to all features</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:24,fontWeight:700}}>$0</div>
                <div style={{fontSize:11,color:c.dim}}>for 45 days</div>
              </div>
            </div>
          </div>

          <div style={{fontSize:13,color:c.sub,lineHeight:1.7,marginBottom:16}}>After your trial ends, you'll need to subscribe to continue using Brikk. Plans start at $75/month for Pro and $200/month for Teams.</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{border:`2px solid ${c.text}`,borderRadius:12,padding:"20px 16px"}}>
              <div style={{fontSize:14,fontWeight:700}}>Pro</div>
              <div style={{fontSize:24,fontWeight:700,margin:"8px 0 4px"}}>$75<span style={{fontSize:13,fontWeight:400,color:c.dim}}>/mo</span></div>
              <div style={{fontSize:11,color:c.dim}}>+ $125 setup fee</div>
              <div style={{fontSize:12,color:c.sub,marginTop:8}}>For solo agents</div>
            </div>
            <div style={{border:`1px solid ${c.border}`,borderRadius:12,padding:"20px 16px"}}>
              <div style={{fontSize:14,fontWeight:700}}>Team</div>
              <div style={{fontSize:24,fontWeight:700,margin:"8px 0 4px"}}>$200<span style={{fontSize:13,fontWeight:400,color:c.dim}}>/mo</span></div>
              <div style={{fontSize:11,color:c.dim}}>+ $125 setup fee</div>
              <div style={{fontSize:12,color:c.sub,marginTop:8}}>Up to 5 agents</div>
            </div>
          </div>
        </div>

        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"28px 24px"}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Payment Method</div>
          <div style={{fontSize:12,color:c.dim,marginBottom:16}}>No payment method required during trial.</div>
          <button style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:"12px 20px",fontSize:13,fontWeight:600,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Add Payment Method</button>
        </div>
      </div>}

      {/* Privacy Tab */}
      {activeTab==='privacy'&&<div>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"28px 24px",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Data & Privacy</div>
          <div style={{fontSize:12,color:c.dim,marginBottom:20}}>Manage how your data is used.</div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",borderBottom:`1px solid ${c.borderLight}`}}>
            <div><div style={{fontSize:14,fontWeight:600}}>AI Data Processing</div><div style={{fontSize:12,color:c.dim,marginTop:2}}>Allow AI to analyze your leads for better drafts</div></div>
            <button style={{width:52,height:30,borderRadius:15,background:c.green,border:"none",cursor:"pointer",position:"relative"}}><div style={{width:24,height:24,borderRadius:12,background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.15)",position:"absolute",top:3,left:25}}/></button>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0",borderBottom:`1px solid ${c.borderLight}`}}>
            <div><div style={{fontSize:14,fontWeight:600}}>SMS Messaging</div><div style={{fontSize:12,color:c.dim,marginTop:2}}>Send texts to leads through the app</div></div>
            <button style={{width:52,height:30,borderRadius:15,background:c.green,border:"none",cursor:"pointer",position:"relative"}}><div style={{width:24,height:24,borderRadius:12,background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.15)",position:"absolute",top:3,left:25}}/></button>
          </div>

          <div style={{padding:"16px 0"}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>Your Data</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:"10px 16px",fontSize:12,fontWeight:600,color:c.sub,cursor:"pointer",fontFamily:"inherit"}}>Export My Data</button>
              <button style={{background:c.redSoft,border:`1px solid rgba(190,18,60,0.15)`,borderRadius:10,padding:"10px 16px",fontSize:12,fontWeight:600,color:c.red,cursor:"pointer",fontFamily:"inherit"}}>Delete Account</button>
            </div>
          </div>
        </div>

        <a href="/privacy" target="_blank" style={{display:"block",background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"20px 24px",textDecoration:"none",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:14,fontWeight:600,color:c.text}}>Privacy Policy</div><span style={{fontSize:14,color:c.dim}}>→</span></div>
          <div style={{fontSize:12,color:c.dim,marginTop:4}}>Read our full privacy policy</div>
        </a>
      </div>}

      {/* User Agreement Tab */}
      {activeTab==='agreement'&&<div>
        <a href="/terms" target="_blank" style={{display:"block",background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"20px 24px",textDecoration:"none",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:14,fontWeight:600,color:c.text}}>Terms of Service</div><span style={{fontSize:14,color:c.dim}}>→</span></div>
          <div style={{fontSize:12,color:c.dim,marginTop:4}}>Review the terms of use</div>
        </a>
        <a href="/privacy" target="_blank" style={{display:"block",background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"20px 24px",textDecoration:"none",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:14,fontWeight:600,color:c.text}}>Privacy Policy</div><span style={{fontSize:14,color:c.dim}}>→</span></div>
          <div style={{fontSize:12,color:c.dim,marginTop:4}}>How we handle your data</div>
        </a>
        <div style={{background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"28px 24px"}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>Acceptable Use</div>
          <div style={{fontSize:13,color:c.sub,lineHeight:1.8}}>By using Brikk you agree to use the service for legitimate real estate business purposes only. You agree not to send unsolicited messages, violate any applicable laws, or misuse the AI features. All AI-generated content should be reviewed before sending to leads. You are responsible for ensuring compliance with CAN-SPAM, TCPA, and local real estate regulations.</div>
        </div>
      </div>}

      {/* Logout — always visible at bottom */}
      <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${c.border}`}}>
        <button onClick={handleLogout}
          style={{width:"100%",background:c.white,border:`1px solid ${c.border}`,borderRadius:14,padding:"16px",fontSize:14,fontWeight:600,color:c.red,cursor:"pointer",fontFamily:"inherit",transition:"background 0.15s ease"}}>
          Sign Out
        </button>
        <div style={{textAlign:"center",marginTop:12}}>
          <span style={{fontSize:11,color:c.dim}}>Brikk v1.1 — Built to close.</span>
        </div>
      </div>
    </div>
  )
}
