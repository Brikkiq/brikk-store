# Granting your freelancer access to your Apple Developer account

You (Henry) don't need to give your freelancer your password. Apple's developer team management lets you invite them with a specific role and revoke them after submission. This doc walks you through it.

**Time:** ~5 minutes to grant, ~30 seconds to revoke later.

---

## Step 1: Add to Apple Developer team

1. Sign into https://developer.apple.com/account on your phone or any browser
2. In the left sidebar, click **People** (or **Users and Roles** depending on UI version)
3. Click **+ Invite People**
4. Enter the freelancer's Apple ID email address (they must already have a free Apple ID — they almost certainly do)
5. **Role: `Developer`** — NOT Admin, NOT Account Holder. Developer can:
   - Build and run apps signed with your team's certs
   - Create provisioning profiles
   - Test on registered devices
   
   Developer **cannot**:
   - View or modify billing
   - Add/remove other team members
   - Transfer or delete the developer account
   - Access App Store payouts
6. Click **Send Invite**

The freelancer receives an email with a link to accept. Once they do, they can sign into Xcode using their Apple ID and select your team for code-signing.

---

## Step 2: Add to App Store Connect

App Store Connect is a separate permission system from Apple Developer. To let the freelancer submit the app:

1. Sign into https://appstoreconnect.apple.com
2. Click **Users and Access** in the top nav
3. Click **+** next to "Users"
4. Enter the same email address you used in Step 1
5. **Role: `App Manager`** — they can:
   - Upload builds via Xcode
   - Edit app metadata
   - Submit for review
   - Respond to App Review messages
   
   They **cannot**:
   - View financial reports
   - Change agreements
   - Manage users
6. **Apps:** select **Brikk** (or "All Apps" if it's the only app — but Brikk-only is more conservative)
7. Click **Invite**

They get a second email. Once accepted, they have what they need.

---

## Step 3: Tell them what you did

Reply to your freelancer's last message with something like:

> "I've added you to both my Apple Developer team (Developer role) and App Store Connect (App Manager, Brikk app only). Check your inbox for the two Apple invite emails. Once you accept, you'll be able to sign builds and submit. Let me know if either link doesn't work and I'll re-send."

---

## Step 4: After submission is approved, REVOKE access

Once Apple has approved the app and it's live, remove the freelancer's access. This is standard practice — you don't want a former contractor able to upload new builds to your account.

### Remove from Apple Developer

1. https://developer.apple.com/account → **People**
2. Click the freelancer's name
3. Click **Remove from Team** at the bottom
4. Confirm

### Remove from App Store Connect

1. https://appstoreconnect.apple.com → **Users and Access**
2. Find the freelancer
3. Click their name → top right corner click **Remove User**
4. Confirm

That's it. They no longer have any access. Future updates (icon swaps, splash changes, new builds) you either do yourself by borrowing a Mac, or re-invite them temporarily.

---

## Red flags — refuse to do these even if asked

- **Sharing your Apple ID password.** Never. Use the team invite. Apple uses 2FA so they couldn't sign in anyway without your phone.
- **Letting them submit under THEIR developer account "for speed."** No. The app would be owned by them. You'd lose control. If they push back on this, walk away.
- **Granting Admin or Account Holder role.** They don't need it. Developer + App Manager are sufficient. Anything more lets them lock you out.
- **Giving them your phone number for 2FA.** Apple won't ask. If they say they need this, they're trying to bypass team management — walk away.

---

## What if you don't have an Apple Developer account yet?

You mentioned you have one — good. If you didn't, you'd need to:

1. Go to https://developer.apple.com/programs/enroll/
2. Pay the $99/year fee (annual subscription)
3. Verify your identity (driver's license or business EIN)
4. Wait 24-48 hours for approval

Skip this if you're already enrolled.

---

## Quick sanity check — confirm your enrollment status

Before involving the freelancer, confirm your account is active:

1. https://developer.apple.com/account
2. Top left should say "Apple Developer Program" with a green checkmark, not "Free" or "Enroll Now"
3. Bottom should show your team ID (10-character alphanumeric like `ABCDE12345`)

Note your team ID — your freelancer will need it for signing. They'll ask. Share it via Fiverr DM, not anywhere public.
