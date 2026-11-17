# Tandem

**Communication, in good hands.**

Tandem is an AI-assisted email coordination workspace for personal assistants and their clients. It helps teams see who should respond, what needs a decision, and which conversations can be left alone.

## Product experience

- A public product landing page introducing Tandem.
- Existing Firebase email/password and Google authentication flows.
- Email verification and password recovery using the existing Firebase setup.
- An assistant workspace with inbox segments, sample conversations, responsibility labels, summaries, suggested next steps and editable reply drafts.
- A client-facing preview that focuses on conversations requiring personal attention.
- A recent activity page.
- Responsive layouts for desktop and mobile.

## Important implementation notes

The existing Firebase authentication and Admin SDK setup has been preserved. The signup flow still creates Firebase Authentication users, updates their display name, stores the user profile in Firestore and sends email verification. The signin, Google sign-in, verification and password-recovery handlers remain in place.

The current Tandem inbox is a **product demonstration experience**. Its sample conversations and local actions are stored in browser local storage so a reviewer can explore the workflow after signing in. This ZIP does not add a live Gmail/Outlook connection, new AI provider integration, or persistent email/conversation backend. The sample insights are illustrative and are labelled as such in the workspace.

The original AEO-related API and library files have been left untouched as requested. They are no longer part of the Tandem user-facing flow.

## Existing Firebase configuration

The project continues to use the Firebase environment variables already expected by `lib/firebase.ts` and `lib/firebase-admin.ts`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

The existing Admin SDK private key normalization in `lib/firebase-admin.ts` is unchanged.

## Deployment

This is the original Next.js project, not a static HTML replacement. Keep the existing project settings and dependency installation/build configuration in Vercel:

- Framework: Next.js
- Build command: `next build` (Vercel default is fine)
- Output directory: leave the Next.js default
- Root directory: the folder containing this `package.json`

Push the extracted project contents to the connected GitHub repository or import the ZIP as a new Vercel project. Configure the existing Firebase environment variables in Vercel before testing signup/signin.

## Demo walkthrough

1. Open the Tandem landing page.
2. Create an account using the existing Firebase signup flow.
3. Complete the email verification step.
4. Sign in.
5. Explore the assistant inbox and change a conversation's responsibility.
6. Open the Client view preview and review a decision.
7. Mark the item handled or delegate it back to the assistant.
8. Open a conversation and review the sample AI insight and editable draft.

## Scope and limitations

This is an internship prototype. The connected account and AI controls are intentionally presented as demonstration affordances until real provider credentials and corresponding services are integrated. Do not connect confidential mailboxes or present sample insights as live AI analysis.
