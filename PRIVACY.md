# StudioFlow — Privacy Policy

StudioFlow is a student project built for the MOD8 Advanced Web Programming course (EFREI). It is not a commercial service: each copy runs locally (`http://localhost:5173`) on the machine of whoever starts it, with its own MySQL database. No data is sent to the StudioFlow team.

## What StudioFlow stores

In the local MySQL database of the copy you use:

- **Your account**: full name and email address. With an email/password account, a bcrypt hash of your password (never the password itself).
- **If you sign in with Google**: your Google account identifier (`sub`), your email address and your name, taken from the ID token Google returns. StudioFlow does not store any Google access or refresh token and cannot access your Google data (Gmail, Drive, contacts…). It only asks Google for the basic `openid`, `email` and `profile` information.
- **Sessions**: a SHA-256 hash of each refresh token, its expiry date and the browser's user agent, so that sessions can be revoked ("Sign out of all devices").
- **What you create**: projects, deliverables, tasks, comments and asset links, and your role in each project.

## How it is used

Only to sign you in and run the app: show your projects, your tasks and who is working on what. Nothing is sold, shared with third parties or used for advertising or analytics.

## Third parties

Google is involved only when you click "Sign in with Google": Google authenticates you and the StudioFlow back-end checks the resulting ID token with Google. Google's own privacy policy applies to that step: https://policies.google.com/privacy

## Deleting your data

The data lives in the local database of the copy you used: whoever runs it can delete it (for example with `npm run db:reset` in `backend/`, which erases everything). You can also revoke StudioFlow's access to your Google account at any time from https://myaccount.google.com/permissions

## Contact

Open an issue on the project repository: https://github.com/ElpharienPY/StudioFlow
