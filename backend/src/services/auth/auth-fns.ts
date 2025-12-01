import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { BadRequestError } from '~/lib/errors'
import type { AuthEmailProps, VerifyPasswordDTO } from './auth-types'

export const TOKEN_EXPIRATION_TIME_MS = 24 * 60 * 60 * 1000 // 3 hours in milliseconds

export const GOOGLE_USER_INFO_API_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

const googleUserInfoSchema = z.object({
	sub: z.string().min(1),
	email: z.email(),
	name: z.string().min(1),
})

export async function hashPassword(password: string, saltRounds = 12) {
	return await bcrypt.hash(password, saltRounds)
}

export async function comparePasswordHash({ password, passwordHash }: VerifyPasswordDTO) {
	return await bcrypt.compare(password, passwordHash)
}

export async function getGoogleUserInfo(googleToken: string) {
	const response = await fetch(GOOGLE_USER_INFO_API_URL, {
		headers: {
			Authorization: `Bearer ${googleToken}`,
		},
	})
	if (!response.ok) throw new BadRequestError('Invalid Google token')

	const data = await response.json()

	const { sub: googleId, email, name } = googleUserInfoSchema.parse(data)

	return { googleId, email, name }
}

export function generateAuthEmail(config: AuthEmailProps) {
	const { actionUrl, title, heading, bodyText, buttonText, footerText } = config
	const year = new Date().getFullYear().toString()

	return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0; padding:0; background-color:#f5f5f7;" bgcolor="#f5f5f7">
    <div style="background-color:#f5f5f7; padding:60px 0;">
      <center>
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.03); font-family:'Inter', sans-serif; color:#1d1d1f;" bgcolor="#ffffff">
          <tr>
            <td align="center" style="padding:50px 40px 30px 40px;">
              <div style="width:40px; height:40px; background-color:#ef476f; border-radius:50%; margin-bottom:25px;"></div>
              <h1 style="color:#1d1d1f; margin:0; font-weight:500; font-size:22px; letter-spacing:-0.5px;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 30px 40px;">
              <p style="margin:0 0 25px 0; font-size:15px; line-height:1.6; color:#4b4b4f; text-align:center;">
                ${bodyText}
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 40px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#ef476f; border-radius:8px;" bgcolor="#ef476f">
                    <a href="${actionUrl}" style="display:inline-block; padding:14px 36px; color:#ffffff; text-decoration:none; font-weight:500; font-size:15px; letter-spacing:-0.2px;">${buttonText}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px; background-color:#f0f0f2;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 40px 50px 40px;">
              <p style="margin:0; font-size:13px; line-height:1.6; color:#8e8e93; text-align:center;">
                ${footerText}
              </p>
            </td>
          </tr>
        </table>

        <table width="560" cellpadding="0" cellspacing="0" style="max-width:100%;" bgcolor="#f5f5f7">
          <tr>
            <td style="padding:30px 40px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#8e8e93;">© ${year} Your Company</p>
            </td>
          </tr>
        </table>
      </center>
    </div>
  </body>
</html>
`
}

export function generateResetPasswordEmail(resetUrl: string) {
	return generateAuthEmail({
		actionUrl: resetUrl,
		title: 'Reset Your Password',
		heading: 'Reset your password',
		bodyText:
			'We received a request to reset your password. Use the button below to set up a new password for your account.',
		buttonText: 'Reset Password',
		footerText:
			"If you didn't request a password reset, you can safely ignore this email. This link will expire in 1 hour.",
	})
}

export function generateVerificationEmail(verifactionUrl: string) {
	return generateAuthEmail({
		actionUrl: verifactionUrl,
		title: 'Verify Your Email',
		heading: 'Verify your email',
		bodyText:
			'Thanks for signing up. To complete your registration and access your account, please verify your email address.',
		buttonText: 'Verify Email',
		footerText:
			"If you didn't create an account, no further action is required. This link will expire in 24 hours.",
	})
}
