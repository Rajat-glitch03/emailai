# Tandem — Email management prototype

A polished, responsive prototype for the AI Full-Stack Engineer internship assignment.

## Run it

There are no install commands, package managers, build scripts, or external JavaScript libraries.

Open `index.html` in a modern browser, or deploy the folder directly to Vercel Drop: https://vercel.com/drop

## Deploy to Vercel (browser only)

1. Open https://vercel.com/drop.
2. Upload `tandem-studio.zip` (or drag the extracted `tandem-studio` folder).
3. Choose your Vercel team and a project name, then deploy.
4. Vercel serves the root `index.html` as a static site. No framework, build command, install command, environment variables, or CLI are required.

For an existing GitHub-connected Vercel project:

1. Upload the contents of this folder to the root of the GitHub repository using GitHub's **Add file → Upload files** page.
2. In Vercel → Project → Settings → Build and Development Settings, choose **Other** as the Framework Preset.
3. Leave the Build Command blank (disable its override if necessary). Set Output Directory to `.` if Vercel does not detect the root automatically.
4. Save and redeploy from the Deployments page.

## Prototype guide

- The assistant and client views are switchable from the top-right control.
- The assistant can browse segments, search conversations, inspect conversation history, change responsibility, star, mark read, archive, mark handled, and prepare/save reply drafts.
- The client can mark a conversation handled or hand it back to the assistant. The changes appear in the other view in the same browser.
- “Ask your inbox” answers common questions using the sample dataset.
- “New demo email” adds a sample conversation so the workflow can be demonstrated live.
- Gmail and Outlook connection buttons intentionally simulate OAuth. They do not request credentials, connect a real mailbox, or read messages.
- The AI classification, summaries and reply drafting are curated demo behavior, not calls to an external LLM. This keeps the prototype dependable and safe to demo without secret keys or network services.

All state is saved in this browser using `localStorage`. Use Settings → Reset demo data to restore the starting workspace.

## Scope and honesty

This is an interview prototype, not a production mailbox integration. It uses realistic sample email threads to demonstrate the product journey allowed by the assignment. No email is actually sent, no external mailbox is accessed, and there is no real sign-in or multi-user synchronization. The client and assistant views share state in the same browser only.
