import { Link, useFetcher } from 'react-router'
import { Button } from '~/components/button'
import { getUser } from '~/features/auth/middleware.server'
import { ToggleTheme } from '~/features/themes/components/toggle-theme'
import { routeMeta } from '~/lib/route/meta'
import { useLoading } from '~/lib/use-loading'
import type { Route } from './+types/index'

export const meta = routeMeta({
	title: 'App Name',
	description: 'App Description',
})

export function loader({ context }: Route.LoaderArgs) {
	const user = getUser(context)

	return { user }
}

export default function Index({ loaderData }: Route.ComponentProps) {
	const { user } = loaderData

	const fetcher = useFetcher()
	const { isPending } = useLoading({ fetcher })

	return (
		<div className='flex min-h-[100dvh] w-full items-center justify-center'>
			<div className='flex w-full max-w-[500px] flex-col gap-4 px-6'>
				<div>
					<ToggleTheme />
				</div>
				{!user && (
					<>
						<Button asChild variant='outline'>
							<Link to='/login'>Login</Link>
						</Button>
						<Button asChild>
							<Link to='/register'>Register</Link>
						</Button>
					</>
				)}
				{user && (
					<fetcher.Form method='post' action='/logout'>
						<Button
							type='submit'
							className='w-full'
							isDisabled={isPending}
							isPending={isPending}
						>
							Logout
						</Button>
					</fetcher.Form>
				)}
			</div>
		</div>
	)
}
