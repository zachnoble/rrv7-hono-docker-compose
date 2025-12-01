import { redirectWithToast } from 'remix-toast'
import { client } from '~/lib/api/middleware.server'
import { routeMeta } from '~/lib/route/meta'
import { getSearchParams } from '~/lib/search-params'
import type { Route } from './+types'

export const meta = routeMeta({
	title: 'Verify Account',
	description: 'Verify your account',
})

export async function loader({ request, context }: Route.LoaderArgs) {
	const api = client(context)

	const { token, email } = getSearchParams(request)

	if (!token || !email) throw new Error('Token and email are required')

	await api.post('/auth/verify-user', { token, email })

	return redirectWithToast('/login', {
		type: 'success',
		message: 'Email verified! You can now login.',
	})
}
