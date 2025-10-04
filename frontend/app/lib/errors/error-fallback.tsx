import { Link } from 'react-router'
import { Button } from '~/components/button'

type Props = {
	title: string
	description: string
}

export function ErrorFallback({ title, description }: Props) {
	return (
		<main className='flex min-h-[100dvh] w-screen flex-col items-center justify-center gap-6 py-12'>
			<div className='flex flex-col items-center gap-4 text-center'>
				<h1 className='font-bold text-3xl md:text-6xl'>{title}</h1>
				<p className='max-w-md text-muted text-sm'>{description}</p>
			</div>
			<Button asChild>
				<Link to='/'>Return Home</Link>
			</Button>
		</main>
	)
}
