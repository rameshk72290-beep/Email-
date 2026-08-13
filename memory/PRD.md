# Mailroom CONTROL — Multi-Gmail Aggregator & Cleanup

## Original Problem Statement
Dynamic Multi-Gmail Aggregator & Cleanup platform. Users can link multiple Gmail accounts via Google OAuth from a dashboard. Each linked account gets its own dynamic slot. Duplicate check prevents adding the same Gmail twice. Central Admin Panel lets the Owner (Ramesh) read, filter, and delete (Trash) spam/unwanted emails across all connected accounts. Minimalist, fast UI. Secured via Google Gmail API.

## Core Requirements (Static)
- Multi-account Gmail linking via Google OAuth 2.0 (`gmail.readonly` + `gmail.modify` scopes).
- Dynamic account slots on dashboard, each showing status/stats.
- Duplicate email detection at OAuth callback (redirects with `oauth=duplicate` toast).
- Owner-only admin panel (Ramesh / 212006) — reads and trashes emails across all linked mailboxes.
- Category & search filters (All / Primary / Promotions / Spam).
- Bulk move-to-Trash action via Gmail API `messages.trash`.
- Minimalist UI (Space Grotesk headline, IBM Plex Mono eyebrows, light blue accent).

## Architecture
- **Backend:** FastAPI + Motor (Mongo) + google-auth-oauthlib + googleapiclient. All routes under `/api`.
- **Frontend:** React (single-page App.js) with Sonner toasts, lucide-react icons.
- **DB Collections:** `accounts` (id, email, name, credentials, stats, linked_at), `oauth_states` (CSRF).
- **Auth:** Owner token = base64(sha256(username:secret)), sent as Bearer.

## What's Been Implemented (2026-02-13)
- Google OAuth start/callback endpoints with CSRF state.
- Duplicate account guard at callback.
- Owner login + protected `/api/emails` and `/api/emails/trash`.
- Dynamic account grid + "Connect another mailbox" card.
- Filter bar (account + category + search) + bulk-trash.
- Category detection fixed (Primary/Promotions/Social/Updates/Forums/Spam) via Gmail `labelIds`.

## Verified E2E (Feb 2026)
- Health, admin login (correct + wrong), OAuth start URL, accounts list, emails auth-guard, trash auth-guard — all pass.
- Owner UI login toast + Add-Gmail button redirects correctly to Google Sign-in with app's domain.

## User Personas
- **Owner (Ramesh):** Sole admin. Reads/cleans inboxes for all connected users.
- **End user:** Anyone who wants to hand off their Gmail(s) into the shared workspace.

## Prioritized Backlog
- **P1:** Bulk unsubscribe / sender-block from spam view.
- **P1:** Per-account spam/unread counts refreshed live via a `/api/accounts/refresh` job.
- **P2:** Rules engine ("auto-trash sender X on any account").
- **P2:** Restore-from-trash action.
- **P2:** Audit log of Owner actions.

## Credentials
- Owner: `Ramesh` / `212006` (stored in `/app/backend/.env` + `/app/memory/test_credentials.md`).
- Google OAuth Client ID/Secret configured in `/app/backend/.env`.
- Redirect URI whitelisted by user: `https://email-cleanup-hub-2.preview.emergentagent.com/api/oauth/gmail/callback`.
