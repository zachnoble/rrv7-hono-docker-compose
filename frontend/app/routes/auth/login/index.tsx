import { data } from 'react-router'
import { parseFormData } from 'remix-hook-form'
import { requireGuest } from '~/features/auth/middleware.server'
import { client } from '~/lib/api/middleware.server'
import { routeAction } from '~/lib/route/action'
import { routeMeta } from '~/lib/route/meta'
import type { Route } from './+types'
import { LoginForm, type LoginSchema } from './form'

export const meta = routeMeta({
	title: 'Login',
	description: 'Login to your account',
})

export const action = routeAction(async ({ request, context }: Route.ActionArgs) => {
	const api = client(context)

	const formData = await parseFormData<LoginSchema>(request)
	const {
		response: { headers },
	} = await api.post('/auth/login', formData)

	return data(null, { headers })
})

export function loader({ context }: Route.LoaderArgs) {
	return requireGuest(context)
}

export default function Login() {
	return <LoginForm />
}
