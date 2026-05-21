'use client'

const c = { bg: '#FAFAF9', white: '#FFFFFF', border: '#E8E8E4', text: '#1A1A18', sub: '#6B6B66', dim: '#9C9C96' }

export default function Privacy() {
  return (
    <div style={{ background: c.bg, minHeight: '100vh', fontFamily: "'Instrument Sans',-apple-system,sans-serif", padding: '40px 20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <a href="/" style={{ fontSize: 16, fontWeight: 700, color: c.text, textDecoration: 'none' }}>Brikk</a>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '32px 0 8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: c.dim, marginBottom: 32 }}>Last updated: May 20, 2026</p>

        <div style={{ fontSize: 14, color: c.sub, lineHeight: 1.8 }}>

          <h2 style={h2}>1. Information We Collect</h2>
          <p>When you create a Brikk account, we collect your name, email address, phone number, and brokerage information. When you use Brikk, we store the lead information, deal details, messages, interactions, and any other content you choose to enter into the platform.</p>
          <p>When prospects fill out your lead-capture link, we collect their name, phone number, email, and any details they provide. That data flows directly into your account.</p>

          <h2 style={h2}>2. How We Use Your Information</h2>
          <p>We use your information to provide and improve the Brikk service, including:</p>
          <p style={{ marginLeft: 20 }}>
            • Operating your account and providing customer support<br />
            • Generating AI-powered follow-up drafts using your lead data<br />
            • Routing lead-capture submissions to the correct agent<br />
            • Sending transactional emails (signup confirmations, lead-capture notifications)<br />
            • Sending you service-related notifications<br />
            • Improving our product features
          </p>

          <h2 style={h2}>3. Data Storage and Security</h2>
          <p>Your data is stored securely using Supabase (PostgreSQL database) with row-level security policies. Each user can only access their own data. All data is transmitted over HTTPS encryption. We do not sell your data to third parties.</p>

          <h2 style={h2}>4. AI Processing</h2>
          <p>Brikk uses AI (powered by Anthropic's Claude) to generate follow-up message drafts and to parse voice notes into structured CRM updates. Your lead data is sent to Anthropic's API for these purposes. Per Anthropic's commercial terms, your data is not used to train their models. Generated drafts are only visible to you.</p>

          <h2 style={h2}>5. Communications & Messaging</h2>
          <p>Brikk does not send SMS messages on your behalf from our servers. Outbound text messages are composed in Brikk and opened in your own phone's native messaging app — they are sent from your personal mobile number, on your own carrier. Brikk logs the message content for your records.</p>
          <p>Transactional emails (signup confirmations, password resets, lead-capture notifications) are delivered through Resend on Brikk's behalf.</p>

          <h2 style={h2}>6. Third-Party Services</h2>
          <p>Brikk uses the following third-party services:</p>
          <p style={{ marginLeft: 20 }}>
            • <strong>Supabase</strong> — database and authentication<br />
            • <strong>Anthropic (Claude)</strong> — AI message drafting and voice parsing<br />
            • <strong>Resend</strong> — transactional email delivery<br />
            • <strong>Stripe</strong> — payment processing<br />
            • <strong>Vercel</strong> — application hosting
          </p>

          <h2 style={h2}>7. Data Retention</h2>
          <p>Your data is retained for as long as your account is active. If you delete your account, all associated data (leads, deals, messages, interactions) will be permanently deleted within 30 days.</p>

          <h2 style={h2}>8. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal data at any time through the app's Settings → Privacy page. You may also request a complete data export or account deletion by emailing hello@brikk.store.</p>

          <h2 style={h2}>9. Regional Privacy Rights (GDPR, CCPA, and Others)</h2>
          <p>Brikk respects the privacy rights granted to users by their local laws.</p>
          <p><strong>European Economic Area, UK, and Switzerland (GDPR):</strong> if you reside in these regions, you have the right to (a) access your personal data, (b) correct or delete it, (c) restrict or object to its processing, (d) data portability, and (e) lodge a complaint with your local supervisory authority. To exercise these rights, email hello@brikk.store. We will respond within 30 days. The legal basis for our processing is performance of a contract with you (the Terms) and our legitimate interest in operating the Brikk service.</p>
          <p><strong>California residents (CCPA / CPRA):</strong> you have the right to (a) know what personal information we collect, use, and disclose; (b) request deletion of personal information we hold about you; (c) correct inaccurate information; (d) opt out of the "sale" or "sharing" of personal information — note we do not sell or share personal information for cross-context behavioral advertising; (e) limit use of sensitive personal information. To exercise these rights, email hello@brikk.store. We do not discriminate against users who exercise their privacy rights.</p>
          <p><strong>Other jurisdictions:</strong> if applicable law grants you additional rights, contact hello@brikk.store and we will work in good faith to honor them.</p>

          <h2 style={h2}>10. Lead Contact Information You Collect</h2>
          <p>When prospects submit your lead-capture form, they agree to be contacted by you. You — the agent — are responsible for complying with applicable laws governing lead contact, including the Telephone Consumer Protection Act (TCPA), CAN-SPAM, and any state-level consumer-protection rules. Brikk facilitates the contact but does not initiate calls or texts on your behalf.</p>

          <h2 style={h2}>11. Children's Privacy</h2>
          <p>Brikk is not intended for use by anyone under the age of 18. We do not knowingly collect data from minors.</p>

          <h2 style={h2}>12. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify users of significant changes via email or in-app notification.</p>

          <h2 style={h2}>13. Contact Us</h2>
          <p>If you have questions about this privacy policy or want to exercise any of your rights, contact us at <strong>hello@brikk.store</strong>.</p>
        </div>

        <div style={{ borderTop: `1px solid ${c.border}`, marginTop: 40, paddingTop: 20 }}>
          <a href="/" style={{ fontSize: 13, color: c.dim }}>Back to brikk.store</a>
        </div>
      </div>
    </div>
  )
}

const h2 = { fontSize: 18, fontWeight: 700, color: '#1A1A18', margin: '24px 0 8px' }
