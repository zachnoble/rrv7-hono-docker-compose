import { data, redirect } from 'react-router'
import { client } from '~/lib/api/middleware.server'
import { routeAction } from '~/lib/route/action'
import type { Route } from './+types'

export const action = routeAction(async ({ context }: Route.ActionArgs) => {
	const api = client(context)

	const {
		response: { headers },
	} = await api.post('/auth/logout')

	return data(null, {
		headers,
	})
})

export function loader() {
	return redirect('/')
}
