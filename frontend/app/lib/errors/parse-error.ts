import { APIError } from '~/lib/api/errors'

export const genericErrorMessage = 'An unexpected error occured'

export function parseError(error: unknown) {
	if (error === null || error === undefined) {
		return genericErrorMessage
	}

	if (error instanceof APIError) {
		return error.message
	}

	// Usually don't want to show Error error.message to users
	if (error instanceof Error) {
		return genericErrorMessage
	}

	// "An Error"
	if (typeof error === 'string') {
		return error
	}

	// { message: "An Error" }
	if (error instanceof Object && 'message' in error && typeof error.message === 'string') {
		return error.message
	}

	// { error: "An Error" }
	if (error instanceof Object && 'error' in error && typeof error.error === 'string') {
		return error.error
	}

	// { error: { message: "An Error" } }
	if (
		error instanceof Object &&
		'error' in error &&
		typeof error.error === 'object' &&
		error.error !== null &&
		'message' in error.error &&
		typeof error.error.message === 'string'
	) {
		return error.error.message
	}

	return genericErrorMessage
}
