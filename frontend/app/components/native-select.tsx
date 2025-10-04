import React from 'react'
import { useFocusRing } from 'react-aria'
import { LabelContext } from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { DescriptionContext, DescriptionProvider } from './field'
import { inputField } from './fns'

export function NativeSelectField({ className, ...props }: React.JSX.IntrinsicElements['div']) {
	const labelId = React.useId()

	return (
		<LabelContext.Provider value={{ id: labelId, elementType: 'span' }}>
			<DescriptionProvider>
				<div
					{...props}
					data-ui='native-select-field'
					className={twMerge('has-[select:disabled]:opacity-50', inputField, className)}
				/>
			</DescriptionProvider>
		</LabelContext.Provider>
	)
}

export function NativeSelect({ className, ...props }: React.JSX.IntrinsicElements['select']) {
	const { focusProps, isFocusVisible } = useFocusRing()
	const labelContext = (React.useContext(LabelContext) ?? {}) as {
		id?: string
	}
	const descriptionContext = React.useContext(DescriptionContext)

	return (
		<div
			data-ui='control'
			className={twMerge(
				'group relative isolate flex transition',
				'after:pointer-events-none',
				'after:absolute',
				'after:border-muted/75',
				'hover:after:border-foreground',
				"after:content-['']",
				'after:size-2 sm:after:size-1.5',
				'after:border-r-[1.5px] after:border-b-[1.5px]',
				'after:-translate-x-1/2 after:end-3 after:bottom-[55%] after:translate-y-1/2 after:rotate-45 rtl:after:translate-x-1.5',
			)}
		>
			<select
				{...focusProps}
				data-focus-visible={isFocusVisible ? '' : undefined}
				aria-labelledby={labelContext.id}
				aria-describedby={descriptionContext?.['aria-describedby']}
				className={twMerge(
					'flex-1',
					'appearance-none bg-transparent',
					'ps-2.5 pe-8',
					'py-[calc(--spacing(2.5)-1px)]',
					'sm:py-[calc(--spacing(1.5)-1px)]',
					'rounded-md border border-input shadow-xs outline-hidden',
					'text-base/6 sm:text-sm/6',
					'hover:bg-zinc-100 hover:dark:bg-zinc-800',
					'hover:bg-zinc-100 dark:hover:bg-zinc-800',
					isFocusVisible && 'border-ring ring-1 ring-ring',
					className,
				)}
				{...props}
			/>
		</div>
	)
}
