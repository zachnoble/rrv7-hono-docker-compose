import { GoogleOAuthProvider } from '@react-oauth/google'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { Link, Outlet } from 'react-router'
import { Button } from '~/components/button'
import { ChevronLeftIcon } from '~/components/icons/outline/chevron-left'
import { config } from '~/lib/config.server'
import type { Route } from './+types'

export function loader() {
	return {
		gcpRecaptchaSiteKey: config.GCP_RECAPTCHA_SITE_KEY,
		gcpOAuthClientId: config.GCP_OAUTH_CLIENT_ID,
	}
}

export default function AuthLayout({ loaderData }: Route.ComponentProps) {
	const { gcpRecaptchaSiteKey, gcpOAuthClientId } = loaderData

	return (
		<GoogleReCaptchaProvider reCaptchaKey={gcpRecaptchaSiteKey} language='en'>
			<GoogleOAuthProvider clientId={gcpOAuthClientId}>
				<div className='flex min-h-[100dvh] w-full items-center justify-center py-0 sm:py-16'>
					<div className='mx-auto w-screen sm:max-w-[475px]'>
						<div className='absolute top-3 left-3 sm:top-5 sm:left-5'>
							<Button asChild variant='plain'>
								<Link to='/'>
									<div className='flex items-center gap-2 pr-1.5'>
										<ChevronLeftIcon /> Home
									</div>
								</Link>
							</Button>
						</div>
						<div className='rounded-none border-0 bg-background p-8 sm:rounded-sm sm:border sm:p-12 sm:dark:bg-muted/2'>
							<Outlet />
						</div>
					</div>
				</div>
			</GoogleOAuthProvider>
		</GoogleReCaptchaProvider>
	)
}
