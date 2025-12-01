import { parseFormData } from 'remix-hook-form'
import { requireGuest } from '~/features/auth/middleware.server'
import { client } from '~/lib/api/middleware.server'
import { routeAction } from '~/lib/route/action'
import { routeData } from '~/lib/route/data'
import { routeMeta } from '~/lib/route/meta'
import type { Route } from './+types'
import { RegisterForm, type RegisterSchema } from './form'

export const meta = routeMeta({
	title: 'Register',
	description: 'Create an account',
})

export const action = routeAction(async ({ request, context }: Route.ActionArgs) => {
	const api = client(context)

	const data = await parseFormData<RegisterSchema>(request)
	await api.post('/auth/register', data)

	return data
})

export function loader({ context }: Route.LoaderArgs) {
	return requireGuest(context)
}

export default function Register({ actionData }: Route.ComponentProps) {
	const { email } = routeData(actionData)

	return <RegisterForm email={email} />
}
