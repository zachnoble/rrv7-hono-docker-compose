import { data, redirect } from 'react-router'
import { parseFormData } from 'remix-hook-form'
import { client } from '~/lib/api/middleware.server'
import { routeAction } from '~/lib/route/action'
import type { Route } from './+types'

export const action = routeAction(async ({ request, context }: Route.ActionArgs) => {
	const api = client(context)

	const {
		response: { headers },
	} = await api.post('/auth/google', await parseFormData(request))

	return data(null, { headers })
})

export function loader() {
	return redirect('/login')
}
