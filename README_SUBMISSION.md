# Tandem — reviewer walkthrough

## Product premise

Tandem helps a personal assistant and their client agree on who needs to act next. The interface is intentionally split into a capable assistant workspace and a quiet client-facing attention list.

## Suggested 2-minute demo

1. Open the assistant workspace. Point out the four overview metrics and the conversation list.
2. Open Elena Marlow’s email. Explain the client-to-reply decision and the reason the model surfaced it.
3. Change the responsibility selector to “Assistant to reply.” Show that the manual decision is retained and the item leaves the client's attention list.
4. Open another email and prepare a reply. Edit it and save it as a local draft; explain that no email is sent by the prototype.
5. Switch to Client view. Mark one item as handled or delegate it to Alex, then switch back to the assistant view to show the shared browser state.
6. Ask the inbox assistant “What am I waiting for?” and show the response.
7. Open Connect email to show the simulated Gmail and Outlook onboarding flow, and be transparent that OAuth is not live.

## Product and engineering decisions

- Responsibility is visible in the list and editable from the conversation detail.
- Low-confidence classification is represented by “Needs review” instead of forcing a confident decision.
- The client view shows only items that need a client decision.
- Client actions are reflected in the assistant view within the same browser session.
- Reply drafts are editable and saved locally; the prototype never sends without human review.
- Demo data and local browser storage make the review flow repeatable without API credentials.

## Honest prototype boundaries

The current app is a static browser prototype. It does not include real Gmail/Outlook OAuth, live model inference, a remote database, real authentication, cross-device sync, or real email sending. The assignment explicitly permits sample data and simulated integrations where live integrations are not feasible; this prototype clearly labels those parts.
