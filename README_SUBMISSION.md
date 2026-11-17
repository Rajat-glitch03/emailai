# Tandem — Internship Demo Notes

## What to demonstrate

**The product idea:** Personal assistants and clients need a shared way to understand who owns the next response. Tandem makes that responsibility visible.

### Suggested walkthrough

1. **Landing page:** Explain the assistant/client coordination problem.
2. **Signup/signin:** Demonstrate the existing Firebase Authentication flow. Signup includes profile creation and email verification.
3. **Assistant workspace:** Show the inbox segments and the four overview metrics.
4. **Conversation detail:** Open the Q4 planning email. Explain the context, suggested owner, reasoning and next step.
5. **Human control:** Change responsibility using the selector and show the updated label.
6. **Client view preview:** Show that the client-facing experience contains only the client-attention conversations.
7. **Client action:** Mark a conversation handled or delegate it back to the assistant.
8. **Reply drafting:** Generate the sample reply draft, edit it and save it locally. Explain that nothing is sent.
9. **Transparency:** Point out the sample/demo labels. Explain that live email-provider and model connections are intentionally outside this version's scope.

## Honest implementation statement

- Firebase signup/signin, Google sign-in, email verification and password recovery are retained from the supplied project.
- The user-facing QuansAI AEO screens have been replaced with Tandem branding and workflows.
- The inbox uses realistic sample conversations. User changes persist in browser local storage for the demonstration.
- AI summaries/classification explanations and generated draft text are sample product-preview content, not live Gemini results.
- Gmail and Outlook are not connected in this version.
- The AEO backend files and Firebase setup have not been modified.

Do not claim that live email synchronization, real AI classification or persistent email management has been implemented.
