# Tandem — change summary

This package is adapted from the exact `aiworkspace-main (1).zip` supplied in the conversation.

## Frontend changes
- Replaced the public QuansAI/AEO landing page with Tandem positioning, a preview of the assistant inbox and an explanation of the assistant/client workflow.
- Rebuilt the signed-in dashboard as a responsive email-management prototype with sample conversations, responsibility segments, conversation detail, sample summaries, editable reply drafts, a client-view preview, archive, importance and local demo persistence.
- Rebranded the signin, signup, password recovery and email verification experiences.
- Replaced the former scan-history screen with a Tandem activity preview.
- Updated application metadata, package name and favicon.

## Authentication preservation
- Existing Firebase email/password signup handler preserved.
- Existing Google signup handler preserved.
- Existing Firebase signin handler preserved.
- Existing email verification and password recovery handlers preserved.
- Firebase client and Admin SDK files preserved.

## Backend preservation
No files under `app/api/` or `lib/` were changed. Existing API routes, Firebase setup, AEO analysis services and server-side logic are byte-identical to the supplied ZIP.

## Honest scope
The Tandem inbox and client workflow are sample-data demonstrations with local browser persistence. This adaptation does not add real Gmail/Outlook synchronization, Gemini classification, or a persistent email backend. Those require additional backend integration and are not represented as live in this version.
