import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react'
import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { getPreferredTheme, mediaQuery, themeAction, themes } from './fns'
import { Theme, type ThemeMetadata } from './types'

function useBroadcastChannel<T = string>(
	channelName: string,
	handleMessage?: (event: MessageEvent) => void,
	handleMessageError?: (event: MessageEvent) => void,
): (data: T) => void {
	const channelRef = useRef(
		typeof window !== 'undefined' && 'BroadcastChannel' in window
			? new BroadcastChannel(`${channelName}-channel`)
			: null,
	)

	useChannelEventListener(channelRef, 'message', handleMessage)
	useChannelEventListener(channelRef, 'messageerror', handleMessageError)

	return useCallback((data: T) => {
		channelRef?.current?.postMessage(data)
	}, [])
}

function useChannelEventListener<K extends keyof BroadcastChannelEventMap>(
	channelRef: RefObject<BroadcastChannel | null>,
	event: K,
	handler: (e: BroadcastChannelEventMap[K]) => void = () => {},
) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: exclude channelRef
	useEffect(() => {
		const channel = channelRef.current
		if (channel) {
			channel.addEventListener(event, handler)
			return () => channel.removeEventListener(event, handler)
		}
	}, [event, handler])
}

type ThemeContextType = {
	theme: Theme | null
	setTheme: Dispatch<SetStateAction<Theme | null>>
	toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

type Props = {
	children: ReactNode
	specifiedTheme: Theme | null
}

export function ThemeProvider({ children, specifiedTheme }: Props) {
	const [theme, setTheme] = useState<Theme | null>(() => {
		if (specifiedTheme) {
			return themes.includes(specifiedTheme) ? specifiedTheme : null
		}

		if (typeof window !== 'object') return null

		return getPreferredTheme()
	})

	const [themeDefinedBy, setThemeDefinedBy] = useState<ThemeMetadata['definedBy']>(
		specifiedTheme ? 'USER' : 'SYSTEM',
	)

	const broadcastThemeChange = useBroadcastChannel<{
		theme: Theme
		definedBy: ThemeMetadata['definedBy']
	}>('themes', (e) => {
		setTheme(e.data.theme)
		setThemeDefinedBy(e.data.definedBy)
	})

	useEffect(() => {
		if (themeDefinedBy === 'USER') {
			return () => {}
		}

		const handleChange = (ev: MediaQueryListEvent) => {
			setTheme(ev.matches ? Theme.LIGHT : Theme.DARK)
		}
		mediaQuery?.addEventListener('change', handleChange)
		return () => mediaQuery?.removeEventListener('change', handleChange)
	}, [themeDefinedBy])

	const handleThemeChange = useCallback<Dispatch<SetStateAction<Theme | null>>>(
		(value) => {
			const nextTheme = typeof value === 'function' ? value(theme) : value

			if (nextTheme === null) {
				const preferredTheme = getPreferredTheme()

				setTheme(preferredTheme)
				setThemeDefinedBy('SYSTEM')
				broadcastThemeChange({ theme: preferredTheme, definedBy: 'SYSTEM' })

				fetch(`${themeAction}`, {
					method: 'POST',
					body: JSON.stringify({ theme: null }),
				})
			} else {
				setTheme(nextTheme)
				setThemeDefinedBy('USER')

				broadcastThemeChange({ theme: nextTheme, definedBy: 'USER' })

				fetch(`${themeAction}`, {
					method: 'POST',
					body: JSON.stringify({ theme: nextTheme }),
				})
			}
		},
		[broadcastThemeChange, theme],
	)

	const toggleTheme = useCallback(() => {
		handleThemeChange(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK)
	}, [handleThemeChange, theme])

	return (
		<ThemeContext.Provider value={{ theme, setTheme: handleThemeChange, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}
