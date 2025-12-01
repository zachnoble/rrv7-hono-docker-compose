import './styles/tailwind.css'
import { Outlet } from 'react-router'
import { getToast, toastMiddleware } from 'remix-toast/middleware'
import { twMerge } from 'tailwind-merge'
import type { Route } from './+types/root'
import { authMiddleware } from './features/auth/middleware.server'
import { PreventFlashOnWrongTheme } from './features/themes/components/prevent-flash'
import { ThemeProvider } from './features/themes/context'
import { useTheme } from './features/themes/hooks/use-theme'
import { themeSessionResolver } from './features/themes/session.server'
import { apiClientMiddleware } from './lib/api/middleware.server'
import { Document } from './lib/document'
import { ErrorFallback } from './lib/errors/error-fallback'
import { NavProgress } from './lib/nav-progress'
import { Toaster } from './lib/toast/toaster'

export const middleware = [apiClientMiddleware(), authMiddleware(), toastMiddleware()]

export async function loader({ request, context }: Route.LoaderArgs) {
	const { getTheme } = await themeSessionResolver(request)

	return {
		theme: getTheme(),
		toast: getToast(context),
	}
}

export function ErrorBoundary() {
	return (
		<Document
			className='dark'
			headSlot={<title>Unexpected Error</title>}
			bodySlot={
				<ErrorFallback
					title='Something went wrong...'
					description='An unexpected error occured. Please try refreshing the page.'
				/>
			}
		/>
	)
}

function App({ loaderData: { toast } }: Route.ComponentProps) {
	const { theme } = useTheme()

	return (
		<Document
			className={twMerge(theme)}
			headSlot={<PreventFlashOnWrongTheme ssrTheme={Boolean(theme)} />}
			bodySlot={
				<>
					<NavProgress />
					<Toaster toastData={toast} />
					<Outlet />
				</>
			}
		/>
	)
}

export default function Root(props: Route.ComponentProps) {
	const {
		loaderData: { theme },
	} = props

	return (
		<ThemeProvider specifiedTheme={theme}>
			<App {...props} />
		</ThemeProvider>
	)
}
