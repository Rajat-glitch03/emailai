# Submission notes

**Product:** Tandem — Email, in good hands.

**Problem addressed:** A personal assistant needs a fast, reliable way to separate routine work from decisions that need their client's personal attention.

**Core product decision:** The product is organized around reply responsibility, not traditional folders. Conversations are assigned to the assistant, the client, no one, or human review. Both roles see the same underlying state through different interfaces.

**Prototype demonstration:** Start with the sample workspace so reviewers can immediately test the overview, inbox, classification override, client delegation, reply drafting and inbox question flows. Real Gmail access is optional and must be configured with the submitter's Google OAuth credentials.

**Known boundaries to state clearly:** Gmail uses read-only OAuth and syncs recent threads; Outlook is simulated; demo intelligence uses deterministic rules until a Gemini API key is configured; authentication is a demo identity rather than production multi-user security.
