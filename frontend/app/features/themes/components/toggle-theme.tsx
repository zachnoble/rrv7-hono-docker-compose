import { Button } from '~/components/button'
import { MoonIcon } from '~/components/icons/outline/moon'
import { SpinnerIcon } from '~/components/icons/outline/spinner'
import { SunIcon } from '~/components/icons/outline/sun'
import { useTheme } from '~/features/themes/hooks/use-theme'
import { ClientOnly } from '~/lib/client-only'

// Only render on the client to avoid hydration errors
function Component() {
	const { theme, toggleTheme } = useTheme()

	return (
		<Button onClick={toggleTheme} variant='outline' isIconOnly>
			{theme === 'dark' ? <SunIcon /> : <MoonIcon />}
		</Button>
	)
}

export function ToggleTheme() {
	return (
		<ClientOnly
			fallback={
				<Button variant='outline' isIconOnly isDisabled={true}>
					<SpinnerIcon />
				</Button>
			}
		>
			{() => <Component />}
		</ClientOnly>
	)
}
