# Tandem — AI-assisted email management workspace

A responsive prototype for personal assistants and their clients. It demonstrates an assistant workspace, a minimal client portal, email responsibility classification, conversation summaries, reviewed reply drafts, inbox search, and a Gmail read-only OAuth/sync path.

## What is implemented

- **Assistant workspace:** overview, inbox segments, conversation history, unread/important toggles, archive, completion, priority and manual responsibility overrides.
- **Client portal:** only conversations assigned to `Client to reply`; clients can review the original message, mark it handled, or delegate it back to the assistant. These changes update the shared conversation record.
- **AI assistance:** responsibility classification, confidence, reasoning, summary, next-step suggestion, editable reply drafts and inbox questions.
- **Demo mode:** realistic sample messages work immediately without credentials. When `GEMINI_API_KEY` is absent, the server uses transparent keyword-based demo rules; it labels that mode as **Demo intelligence**.
- **Gemini mode:** adding a Gemini API key enables model-based JSON classification, summarization, drafting and inbox questions.
- **Gmail:** server-side OAuth 2.0 with read-only mailbox scope and inbox synchronization. In production, MongoDB and token encryption must be configured before OAuth connection is enabled. The application does not send, delete, archive, or modify messages in Gmail.
- **Outlook:** an explicitly simulated connection flow is included. Microsoft Graph OAuth is not implemented in this version; the UI does not claim that an Outlook mailbox was connected.

## Start here: deploy through GitHub and Vercel

You do not need to run terminal commands on your computer to submit this prototype. Vercel installs the project dependencies and runs the build automatically after you push the source to GitHub.

1. Download and extract the project ZIP.
2. Open the extracted `tandem-inbox` folder. The files `package.json`, `vercel.json`, `index.html`, `src/`, `api/`, `server/`, and `shared/` must sit together at the project root.
3. In your GitHub repository, upload the **contents** of this folder to the repository root. Do not upload the outer `tandem-inbox` folder as one nested directory.
4. Commit the upload. If that repository is connected to Vercel, it will automatically start a new deployment.
5. In Vercel → Project → Settings → Build and Development Settings, confirm the Framework Preset is **Vite** and the Root Directory is the folder containing `package.json` and `vercel.json` (normally `./`). The included `vercel.json` supplies the install command, build command and output directory. The deployment build uses Vite directly; TypeScript checking remains available separately as an optional developer check.
6. Wait for the new deployment to finish, then open the production URL.

The first screen is an onboarding page. Choose **Explore the demo workspace** to use the sample inbox. No API key, database, Gmail account, or Outlook account is needed to demonstrate the main prototype.

### Optional local development

The project can also be run locally by developers with Node.js 20 or later and npm. This is not required for the Vercel-hosted assignment demo.

## Enable Gemini AI

1. Create an API key in Google AI Studio.
2. Add it to `.env`:

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.8-flash
```

3. Restart the local development server.

The API key stays on the server. Do not prefix it with `VITE_` and do not put it in frontend code. Tandem uses Google’s Interactions API in stateless mode (`store: false`) for these requests. If Gemini is unavailable or the key is not set, the product remains usable in demo intelligence mode.

## Enable real Gmail connection

The default experience uses sample conversations. Real Gmail connection is optional and requires your own Google Cloud OAuth application.

1. In Google Cloud Console, create/select a project and enable the **Gmail API**.
2. Configure the Google Auth Platform consent screen. While testing, add the Google account you will use as a test user.
3. Create an OAuth client ID with application type **Web application**.
4. Add an authorized redirect URI. For local testing use exactly:

```text
http://localhost:4000/api/integrations/gmail/callback
```

For the deployed app use:

```text
https://YOUR-VERCEL-DOMAIN/api/integrations/gmail/callback
```

5. Add the following values to `.env` locally, or to Vercel Project → Settings → Environment Variables for deployment:

```dotenv
GMAIL_CLIENT_ID=your_google_oauth_client_id
GMAIL_CLIENT_SECRET=your_google_oauth_client_secret
GMAIL_REDIRECT_URI=http://localhost:4000/api/integrations/gmail/callback
APP_URL=http://localhost:5173
SESSION_SECRET=use-a-long-random-secret
```

On Vercel, set `APP_URL` to your deployed site URL and `GMAIL_REDIRECT_URI` to the deployed callback URI above.

6. Restart the app (locally) or redeploy Vercel. Open **Connect email account → Connect Google Gmail** and complete Google's consent screen.
7. Back in Tandem, choose **Sync now**. The latest 20 inbox threads from the last 90 days are imported.

### Requested Gmail permissions

Tandem requests `openid`, `email`, `profile` and `https://www.googleapis.com/auth/gmail.readonly`. Gmail content is read-only in this prototype. Drafts generated by Tandem are saved locally in the browser; no message is sent to another person.

Google classifies Gmail read access as a restricted OAuth scope. A public production app may need Google's verification and compliance review. For an internship prototype, use your own test account and test-user configuration. Review Google's current requirements before inviting other people to connect mailboxes.

Google documentation:
- [Server-side OAuth for Gmail](https://developers.google.com/workspace/gmail/api/auth/web-server)
- [Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Gemini Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview)

## MongoDB persistence and token encryption

The app seeds the demo conversations automatically when a configured database is empty. Without `MONGODB_URI`, the API uses in-memory storage; this is intended for local demos and resets when the server restarts.

For Vercel deployment with persistent state or Gmail OAuth, configure MongoDB Atlas and a dedicated 32-byte encryption key:

```dotenv
MONGODB_URI=mongodb+srv://USER:PASSWORD@YOUR-CLUSTER/your_database
TOKEN_ENCRYPTION_KEY=64_hex_characters
```

Generate a key locally with Node:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The key is used for AES-256-GCM encryption of stored OAuth tokens. Keep it private, back it up securely, and use the same value across Vercel deployments. Never commit `.env` or paste credentials into source files. In production, Gmail OAuth is intentionally blocked unless MongoDB is connected and a valid `TOKEN_ENCRYPTION_KEY` is present; this prevents OAuth tokens from being saved only in ephemeral serverless memory.

**Prototype limitation:** this version uses a single default workspace and a demo identity rather than production multi-user authentication and authorization. Do not use it to manage confidential client mail or invite real users until proper per-user authentication, workspace isolation, audit logging, retention controls, and security review are implemented.

## GitHub and Vercel deployment

1. Keep the project files at the root of the GitHub repository. The repository root must contain `package.json`, `vercel.json`, `index.html`, `src/`, `api/`, `server/`, and `shared/`.
2. Connect that repository to a Vercel project, or open the existing connected project.
3. Set the Root Directory to `./` (or to the exact folder that contains `package.json` and `vercel.json`).
4. Set Framework Preset to **Vite**. The checked-in `vercel.json` configures Vercel to install development dependencies, run the TypeScript check and Vite production build, publish `dist`, and route `/api/*` to the Express function.
5. No environment variables are required for the sample-data demo. Add optional integrations only after the base deployment and demo flows work.
6. After deployment, open the production URL and verify `/api/health`. It should return JSON showing `ok: true`. Then explore the assistant and client views with the seeded sample conversations.

### Optional environment variables

- `GEMINI_API_KEY` and `GEMINI_MODEL` enable model-based AI. Without them, the app clearly labels its deterministic rules as **Demo intelligence**.
- `MONGODB_URI` enables persistent conversation and integration storage.
- `TOKEN_ENCRYPTION_KEY` is required with MongoDB before real Gmail tokens can be persisted.
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`, `APP_URL`, and `SESSION_SECRET` are only needed for real Gmail OAuth. Gmail stays read-only in this prototype.
- Outlook is intentionally simulated.

Do not add credentials to source files or commit a `.env` file. Keep all real secrets in Vercel Project → Settings → Environment Variables.

## Demo walkthrough checklist

1. Open the app and enter the sample workspace.
2. Show the overview and explain the two responsibilities.
3. Open **Client attention**, then change an assignment from the inspector to demonstrate a manual correction.
4. Open a routine scheduling message, generate a draft, edit it, and save it locally.
5. Open **Client view** from the bottom of the sidebar.
6. Expand a client item and delegate it back to the assistant. Return to the assistant workspace and show the changed assignment.
7. Open **Ask inbox** and ask which conversations need attention.
8. Open **Connect email account** and explain that Gmail is real OAuth when configured and Outlook is explicitly simulated in this prototype.

## Project structure

```text
api/
  index.js                 Vercel serverless entry point
server/
  app.js                   Express API routes and middleware
  ai.js                    Gemini API + deterministic demo fallback
  gmail.js                 Gmail OAuth, message parsing and sync
  index.js                 Local Express server
  store.js                 MongoDB models, encrypted integration tokens, demo memory store
shared/
  demo-conversations.json  Shared realistic sample inbox
src/
  components/              Assistant/client UI components
  data/                    Frontend demo data
  lib/                     API client and format helpers
  App.tsx                  Workspace state and navigation
  styles.css               Visual system and responsive layouts
```

## Important prototype boundaries

- This is a product evaluation prototype, not production-ready multi-tenant email software.
- The sample workspace uses a demo identity and single workspace store.
- Gmail sync is read-only and pulls up to 20 recent inbox threads from the last 90 days.
- Outlook is shown as a simulated connector, not a live Microsoft Graph integration.
- The client portal is a role-specific experience in the same demo workspace, not a secure client login.
- Demo rule-based AI is not a substitute for model inference; the UI labels the active intelligence mode.
- A generated draft is a suggestion. Review and edit it before using it outside the prototype.
