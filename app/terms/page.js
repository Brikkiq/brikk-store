'use client'

const c={bg:"#FAFAF9",white:"#FFFFFF",border:"#E8E8E4",text:"#1A1A18",sub:"#6B6B66",dim:"#9C9C96"}

export default function Terms(){
  return(
    <div style={{background:c.bg,minHeight:"100vh",fontFamily:"'Instrument Sans',-apple-system,sans-serif",padding:"40px 20px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <a href="/" style={{fontSize:16,fontWeight:700,color:c.text,textDecoration:"none"}}>Brikk</a>
        <h1 style={{fontSize:28,fontWeight:700,margin:"32px 0 8px"}}>Terms of Service</h1>
        <p style={{fontSize:13,color:c.dim,marginBottom:32}}>Last updated: April 9, 2026</p>

        <div style={{fontSize:14,color:c.sub,lineHeight:1.8}}>
          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>1. Acceptance of Terms</h2>
          <p>By creating an account or using Brikk, you agree to these Terms of Service. If you do not agree, do not use the service.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>2. Description of Service</h2>
          <p>Brikk is an AI-powered command center for real estate agents. The service includes lead management, deal tracking, AI-drafted follow-up messages, smart calendar, marketing analytics, and SMS messaging capabilities.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>3. Account Registration</h2>
          <p>You must provide accurate information when creating your account. You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to use Brikk.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>4. Pricing and Payment</h2>
          <p>Brikk offers a 45-day free trial. After the trial period, the Pro plan is $75 per month and the Team plan is $200 per month. A one-time setup fee of $125 applies. Prices may change with 30 days notice. All fees are non-refundable except as required by law.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>5. Acceptable Use</h2>
          <p>You agree not to use Brikk to:</p>
          <p style={{marginLeft:20}}>• Send unsolicited spam or bulk messages<br/>
          • Violate any applicable laws including CAN-SPAM, TCPA, or real estate regulations<br/>
          • Upload malicious content or attempt to access other users' data<br/>
          • Misrepresent your identity or affiliation<br/>
          • Use the service for any purpose other than real estate business management</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>6. AI-Generated Content</h2>
          <p>Brikk uses AI to draft messages and provide insights. AI-generated content is suggestions only. You are responsible for reviewing and approving all messages before they are sent. Brikk is not liable for any consequences of AI-generated content that you approve and send.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>7. SMS Messaging</h2>
          <p>By using Brikk's messaging features, you confirm that you have obtained proper consent from recipients before sending messages. You are responsible for compliance with all applicable telecommunications laws and regulations.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>8. Data Ownership</h2>
          <p>You retain ownership of all data you input into Brikk, including leads, deals, messages, and notes. Brikk has a license to use this data solely for providing and improving the service.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>9. Service Availability</h2>
          <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. We may perform maintenance with reasonable notice. We are not liable for any loss resulting from service downtime.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>10. Termination</h2>
          <p>You may cancel your account at any time. We may suspend or terminate accounts that violate these terms. Upon termination, your data will be retained for 30 days and then permanently deleted.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>11. Limitation of Liability</h2>
          <p>Brikk is provided "as is" without warranties of any kind. Our total liability for any claims arising from use of the service is limited to the amount you paid in the 12 months prior to the claim.</p>

          <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:"24px 0 8px"}}>12. Contact</h2>
          <p>For questions about these terms, contact us at brikkiq@gmail.com.</p>
        </div>

        <div style={{borderTop:`1px solid ${c.border}`,marginTop:40,paddingTop:20}}>
          <a href="/" style={{fontSize:13,color:c.dim}}>Back to brikk.store</a>
        </div>
      </div>
    </div>
  )
}
