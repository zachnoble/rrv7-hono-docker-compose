import { Resend } from 'resend'
import { config } from './config'

type Options = {
	from?: string
	to: string
	subject: string
	html: string
}

export type EmailClient = {
	sendEmail: (options: Options) => Promise<void>
}

export function emailClientFactory(): EmailClient {
	const resend = new Resend(config.RESEND_API_KEY)

	async function sendEmail(options: Options) {
		if (config.NODE_ENV === 'test') return

		await resend.emails.send({
			...options,
			from: options.from ?? config.DEFAULT_EMAIL_FROM,
		})
	}

	return {
		sendEmail,
	}
}
