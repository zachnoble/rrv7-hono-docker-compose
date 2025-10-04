import {
	type DropZoneProps,
	DropZone as RACDropZone,
	composeRenderProps,
} from 'react-aria-components'
import { twMerge } from 'tailwind-merge'

export function DropZone(props: DropZoneProps) {
	return (
		<RACDropZone
			{...props}
			className={composeRenderProps(
				props.className,
				(className, { isDropTarget, isDisabled, isFocusVisible }) =>
					twMerge(
						'sm:min-w-96',
						'flex shrink-0 flex-col items-center justify-center rounded-md',
						'border border-input border-dashed p-2',
						isDisabled && 'opacity-50',
						isDropTarget && 'bg-accent/15 dark:bg-accent/75',
						(isDropTarget || isFocusVisible) &&
							'border-ring border-solid ring-1 ring-ring',
						className,
					),
			)}
		/>
	)
}
