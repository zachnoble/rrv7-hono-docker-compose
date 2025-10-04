import { ErrorFallback } from '~/lib/errors/error-fallback'
import { routeMeta } from '~/lib/route/meta'

const info = {
	title: '404 Not Found',
	description: 'The page you are looking for no longer exists.',
}

export const meta = routeMeta(info)

export default function NotFound() {
	return <ErrorFallback {...info} />
}
