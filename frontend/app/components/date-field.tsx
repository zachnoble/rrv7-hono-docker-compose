import {
	DateSegment,
	type DateValue,
	DateField as RACDateField,
	type DateFieldProps as RACDateFieldProps,
	DateInput as RACDateInput,
	type DateInputProps as RACDateInputProps,
	composeRenderProps,
} from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { inputField } from './fns'

export interface DateFieldProps<T extends DateValue> extends RACDateFieldProps<T> {}

export function DateField<T extends DateValue>(props: DateFieldProps<T>) {
	return (
		<RACDateField
			{...props}
			className={composeRenderProps(props.className, (className, { isDisabled }) => {
				return twMerge(inputField, isDisabled && '[&>:not(input)]:opacity-50', className)
			})}
		/>
	)
}

export type DateInputProps = Omit<RACDateInputProps, 'children'>

export function DateInput(props: DateInputProps) {
	return (
		<RACDateInput
			{...props}
			data-ui='control'
			className={composeRenderProps(props.className, (className, renderProps) =>
				twMerge(
					'group flex w-full items-center rounded-md border border-input bg-transparent shadow-xs',

					'[&:has([data-disabled=true])]:opacity-50',
					'[&:has([data-ui=date-segment][aria-readonly])]:bg-zinc-800/5',
					'dark:[&:has([data-ui=date-segment][aria-readonly])]:bg-white/10',
					'block min-w-[150px]',
					'text-base/6 sm:text-sm/6',
					'px-3',
					'py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]',
					renderProps.isInvalid && 'border-red-600',
					renderProps.isFocusWithin
						? 'border-ring ring-1 ring-ring'
						: '[&:has([data-ui=date-segment][aria-readonly])]:border-transparent',
					className,
				),
			)}
		>
			{(segment) => (
				<DateSegment
					data-ui='date-segment'
					segment={segment}
					className={twMerge(
						'inline rounded-sm px-0.5 caret-transparent outline-0 data-[type=literal]:px-0',
						'data-placeholder:text-muted data-placeholder:italic',
						'focus:bg-accent focus:text-[lch(from_var(--color-accent)_calc((49.44_-_l)_*_infinity)_0_0)] focus:data-placeholder:text-[lch(from_var(--color-accent)_calc((49.44_-_l)_*_infinity)_0_0)]',
					)}
				/>
			)}
		</RACDateInput>
	)
}
