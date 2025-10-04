import { toast as reactHotToast } from 'react-hot-toast'
import { Toast } from './toast'
import type { Toast as ToastType } from './types'

export function toast(toast: ToastType) {
	reactHotToast.custom((t) => <Toast toast={{ ...toast, id: t.id }} />)
}
