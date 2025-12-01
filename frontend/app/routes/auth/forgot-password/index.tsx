import { parseFormData } from 'remix-hook-form'
import { requireGuest } from '~/features/auth/middleware.server'
import { client } from '~/lib/api/middleware.server'
import { routeAction } from '~/lib/route/action'
import { routeData } from '~/lib/route/data'
import { routeMeta } from '~/lib/route/meta'
import type { Route } from './+types'
import { ForgotPasswordForm, type ForgotPasswordSchema } from './form'

export const meta = routeMeta({
	title: 'Forgot your password?',
	description: 'Request a password reset',
})

export const action = routeAction(async ({ request, context }: Route.ActionArgs) => {
	const api = client(context)

	const data = await parseFormData<ForgotPasswordSchema>(request)
	await api.post('/auth/forgot-password', data)

	return data
})

export function loader({ context }: Route.LoaderArgs) {
	return requireGuest(context)
}

export default function ForgotPassword({ actionData }: Route.ComponentProps) {
	const { email } = routeData(actionData)

	return <ForgotPasswordForm email={email} />
}
