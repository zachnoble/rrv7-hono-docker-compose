import { parseFormData } from 'remix-hook-form'
import { redirectWithToast } from 'remix-toast'
import { client } from '~/lib/api/middleware.server'
import { routeAction } from '~/lib/route/action'
import { routeMeta } from '~/lib/route/meta'
import { getSearchParams } from '~/lib/search-params'
import type { Route } from './+types'
import { ResetPasswordForm } from './form'

export const meta = routeMeta({
	title: 'Reset Password',
	description: 'Set your new password',
})

export const action = routeAction(async ({ request, context }: Route.ActionArgs) => {
	const api = client(context)

	await api.post('/auth/reset-password', await parseFormData(request))

	return redirectWithToast('/login', {
		type: 'success',
		message: 'You can now login with your new password.',
	})
})

export function loader({ request }: Route.LoaderArgs) {
	const { token, email } = getSearchParams(request)

	if (!token || !email) {
		return redirectWithToast('/login', {
			type: 'error',
			message: 'Invalid reset link, please request a new one.',
		})
	}

	return {
		email,
		token,
	}
}

export default function ResetPassword({ loaderData }: Route.ComponentProps) {
	const { email, token } = loaderData

	return <ResetPasswordForm email={email} token={token} />
}
