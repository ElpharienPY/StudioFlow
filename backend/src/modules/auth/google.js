import { env } from '../../config/env.js'
import { HttpError, unauthorized } from '../../utils/httpError.js'

// Verifies a Google Identity Services ID token ("credential") through Google's tokeninfo
// endpoint, which checks the signature and expiry for us. We still check audience/issuer/email.
export async function verifyGoogleIdToken(idToken) {
  if (!env.GOOGLE_CLIENT_ID) throw new HttpError(501, 'Google sign-in is not configured on this server.')

  let info
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
    if (!res.ok) throw unauthorized('Invalid Google token.', { code: 'invalid_google_token' })
    info = await res.json()
  } catch (err) {
    if (err instanceof HttpError) throw err
    throw new HttpError(502, 'Could not reach Google to verify the token.', { code: 'google_unreachable' })
  }

  const issuerOk = ['accounts.google.com', 'https://accounts.google.com'].includes(info.iss)
  if (info.aud !== env.GOOGLE_CLIENT_ID || !issuerOk) throw unauthorized('Invalid Google token.', { code: 'invalid_google_token' })
  if (String(info.email_verified) !== 'true' || !info.email) throw unauthorized('Your Google email is not verified.', { code: 'email_not_verified' })

  return { sub: String(info.sub), email: String(info.email).toLowerCase(), name: info.name || String(info.email).split('@')[0] }
}
