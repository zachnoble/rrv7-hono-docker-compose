import type { RouterContextProvider } from 'react-router'
import { setToast } from 'remix-toast/middleware'
import { logger } from '~/lib/logger.server'
import { parseError } from './parse-error'

export function handleError(error: unknown, context: Readonly<RouterContextProvider>) {
	logger.error(error)

	const errorMessage = parseError(error)

	setToast(context, {
		type: 'error',
		message: errorMessage,
	})

	return { error: errorMessage }
}
