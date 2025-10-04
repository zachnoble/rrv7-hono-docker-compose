import { toast as reactHotToast } from 'react-hot-toast'
import { twMerge } from 'tailwind-merge'
import { XIcon } from '~/components/icons/outline/x'
import { CheckCircleIcon } from '~/components/icons/solid/check-circle'
import { ExclamationTriangleIcon } from '~/components/icons/solid/exclamation-triangle'
import { InformationCircleIcon } from '~/components/icons/solid/information-circle'
import { XCircleIcon } from '~/components/icons/solid/x-circle'
import type { Toast as ToastType } from './types'

const baseIconClassName = 'size-6'

const toastConfig = {
	success: {
		icon: <CheckCircleIcon className={twMerge(baseIconClassName, 'text-green-400')} />,
		title: 'Success',
	},
	error: {
		icon: <XCircleIcon className={twMerge(baseIconClassName, 'text-red-400')} />,
		title: 'Error',
	},
	info: {
		icon: <InformationCircleIcon className={twMerge(baseIconClassName, 'text-rose-400')} />,
		title: 'Info',
	},
	warning: {
		icon: <ExclamationTriangleIcon className={twMerge(baseIconClassName, 'text-yellow-500')} />,
		title: 'Warning',
	},
}

type Props = {
	toast: ToastType & { id: string }
}

export function Toast({ toast }: Props) {
	const { type = 'info', title, message, id } = toast

	return (
		<div className='fade-in pointer-events-auto animate-in rounded-md border border-border/80 bg-background duration-300'>
			<div className='flex h-full items-center'>
				<div className='flex items-center px-3 py-2.5'>
					<div>{toastConfig[type].icon}</div>
					<div className='mx-3 min-w-[210px] max-w-[275px]'>
						<p className='pb-0.5 font-medium text-sm'>
							{title ?? toastConfig[type].title}
						</p>
						<p className='text-muted text-xs'>{message}</p>
					</div>
				</div>

				<button
					type='button'
					onClick={() => reactHotToast.remove(id)}
					className='mr-2 rounded-[50%] p-2.5 font-medium text-muted text-xs hover:bg-muted/3'
				>
					<XIcon className='size-3.5' />
				</button>
			</div>
		</div>
	)
}
