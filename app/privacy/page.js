'use client'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96"}

export default function Privacy(){
  return(
    <div style={{background:c.bg,minHeight:"100vh",fontFamily:"'Instrument Sans',-apple-system,sans-serif",padding:"40px 20px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <a href="/" style={{fontSize:16,fontWeight:700,color:c.text,textDecoration:"none"}}>Brikk</a>
        <h1 style={{fontSize:28,fontWeight:700,margin:"32px 0 8px"}}>Privacy Policy</h1>
        <p style={{fontSize:13,color:c.dim,marginBottom:32}}>Last updated: April 9, 2026</p>

        <div style={{fontSize:14,color:c.sub,lineHeight:1.8}}>
          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>1. Information We Collect</h2>
          <p>When you create a Brikk account, we collect your name, email address, phone number, and brokerage information. When you use Brikk, we store the lead information, deal details, messages, and interactions you enter into the platform.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>2. How We Use Your Information</h2>
          <p>We use your information to provide and improve the Brikk service, including:</p>
          <p style={{marginLeft:20}}>• Operating your account and providing customer support<br/>
          • Generating AI-powered follow-up drafts using your lead data<br/>
          • Sending SMS messages on your behalf through our messaging service<br/>
          • Sending you service-related notifications<br/>
          • Improving our AI models and product features</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>3. Data Storage and Security</h2>
          <p>Your data is stored securely using Supabase (PostgreSQL database) with row-level security policies. Each user can only access their own data. All data is transmitted over HTTPS encryption. We do not sell your data to third parties.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>4. AI Processing</h2>
          <p>Brikk uses AI (powered by Anthropic's Claude) to generate follow-up message drafts. Your lead data is sent to Anthropic's API for processing. Anthropic does not use your data to train their models. Generated drafts are only visible to you.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>5. SMS Messaging</h2>
          <p>When you send messages through Brikk, we use Twilio to deliver SMS messages. Phone numbers and message content are transmitted to Twilio for delivery purposes only. Message logs are stored in your account.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>6. Third-Party Services</h2>
          <p>Brikk uses the following third-party services:</p>
          <p style={{marginLeft:20}}>• Supabase — database and authentication<br/>
          • Anthropic (Claude AI) — AI message drafting<br/>
          • Twilio — SMS messaging<br/>
          • Vercel — hosting</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>7. Data Retention</h2>
          <p>Your data is retained for as long as your account is active. If you delete your account, all associated data (leads, deals, messages, interactions) will be permanently deleted within 30 days.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>8. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal data at any time through the app. You may also request a complete data export or account deletion by contacting us.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>9. Children's Privacy</h2>
          <p>Brikk is not intended for use by anyone under the age of 18. We do not knowingly collect data from minors.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>10. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify users of significant changes via email or in-app notification.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>11. Contact Us</h2>
          <p>If you have questions about this privacy policy, contact us at brikkiq@gmail.com.</p>
        </div>

        <div style={{borderTop:`1px solid ${c.border}`,marginTop:40,paddingTop:20}}>
          <a href="/" style={{fontSize:13,color:c.dim}}>Back to brikk.store</a>
        </div>
      </div>
    </div>
  )
}
