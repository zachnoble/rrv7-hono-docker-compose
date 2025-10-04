import { type FetcherWithComponents, useNavigation } from 'react-router'

type Options = {
	fetcher?: FetcherWithComponents<unknown>
}

export function useLoading({ fetcher }: Options = {}) {
	const navigation = useNavigation()

	const isSubmitting = navigation.state === 'submitting' || fetcher?.state === 'submitting'
	const isLoading = navigation.state === 'loading' || fetcher?.state === 'loading'
	const isIdle = navigation.state === 'idle' || fetcher?.state === 'idle'
	const isPending = isLoading || isSubmitting

	return {
		isSubmitting,
		isLoading,
		isIdle,
		isPending,
	}
}
