import type { ActionFunctionArgs } from 'react-router'
import { handleError } from '~/lib/errors/handle-error.server'

export function routeAction<T extends ActionFunctionArgs, R>(action: (args: T) => Promise<R>) {
	return async (args: T): Promise<R | ReturnType<typeof handleError>> => {
		try {
			return await action(args)
		} catch (error) {
			if (error instanceof Response && error.status === 302) throw error
			return handleError(error, args.context)
		}
	}
}
