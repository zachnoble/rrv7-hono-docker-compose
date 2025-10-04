import { useGoogleLogin } from '@react-oauth/google'
import { useFetcher } from 'react-router'
import { Button } from '~/components/button'
import { GoogleIcon } from '~/components/icons/solid/google'
import { toast } from '~/lib/toast'

type Flow = 'login' | 'register'

type Props = {
	flow: Flow
}

const messageMap: Record<Flow, { message: string; errorMessage: string }> = {
	login: {
		message: 'Sign in with Google',
		errorMessage: 'Please try again, or sign in using your email.',
	},
	register: {
		message: 'Sign up with Google',
		errorMessage: 'Please try again, or sign up using your email.',
	},
}

export function GoogleAuthButton({ flow = 'login' }: Props) {
	const fetcher = useFetcher()

	const { message, errorMessage } = messageMap[flow]

	const login = useGoogleLogin({
		onSuccess: (tokenResponse) => {
			fetcher.submit(
				{ googleToken: tokenResponse.access_token },
				{ method: 'post', action: '/google-auth' },
			)
		},
		onError: () => {
			toast({
				title: 'Google Auth Failed',
				message: errorMessage,
				type: 'error',
			})
		},
	})

	return (
		<Button type='button' onClick={() => login()} variant='outline' className='w-full'>
			<GoogleIcon className='mr-1 size-5' />
			{message}
		</Button>
	)
}
