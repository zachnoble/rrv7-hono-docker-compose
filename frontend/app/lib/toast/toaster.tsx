import { useEffect } from 'react'
import { toast as rhToast, Toaster as ToasterPrimitive, useToasterStore } from 'react-hot-toast'
import { ClientOnly } from '~/lib/client-only'
import { toast } from '~/lib/toast'
import type { Toast } from './types'

const maxActiveToasts = 4
const toastDuration = 5000

type Props = {
	toastData: Toast | null
}

export function Toaster({ toastData }: Props) {
	const { toasts } = useToasterStore()

	// render toasts which are received from the server in the root layout
	useEffect(() => {
		if (toastData) {
			toast(toastData)
		}
	}, [toastData])

	// auto dismiss toasts when maxToasts is reached
	useEffect(() => {
		const visibleToasts = toasts.filter((t) => t.visible)
		for (const toast of visibleToasts) {
			const index = visibleToasts.indexOf(toast)
			if (index + 1 >= maxActiveToasts) {
				rhToast.dismiss(toast.id)
			}
		}
	}, [toasts])

	return (
		<ClientOnly>
			{() => (
				<ToasterPrimitive
					position='top-center'
					toastOptions={{ duration: toastDuration }}
				/>
			)}
		</ClientOnly>
	)
}
