import React from 'react'
import {
	PopoverContext,
	Popover as RACPopover,
	type PopoverProps as RACPopoverProps,
	useSlottedContext,
} from 'react-aria-components'
import { composeTailwindRenderProps } from './fns'

export interface PopoverProps extends Omit<RACPopoverProps, 'children'> {
	children: React.ReactNode
}

export const Popover = React.forwardRef((props: PopoverProps, ref: React.Ref<HTMLDivElement>) => {
	const popoverContext = useSlottedContext(PopoverContext)
	const isSubmenu = popoverContext?.trigger === 'SubmenuTrigger'

	let offset = 8
	offset = props.offset !== undefined ? props.offset : isSubmenu ? offset - 14 : offset

	return (
		<RACPopover
			{...props}
			ref={ref}
			offset={offset}
			className={composeTailwindRenderProps(props.className, [
				'bg-background',
				'shadow-lg',
				'rounded-md',
				'ring-1',
				'ring-zinc-950/10',
				'dark:ring-zinc-800',
			])}
		/>
	)
})
