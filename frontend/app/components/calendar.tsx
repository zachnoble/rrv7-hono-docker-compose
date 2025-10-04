import { type CalendarDate, getLocalTimeZone, isToday } from '@internationalized/date'
import { useDateFormatter } from '@react-aria/i18n'
import type { CalendarState } from '@react-stately/calendar'
import React from 'react'
import {
	CalendarCell,
	CalendarGrid,
	CalendarGridBody,
	CalendarHeaderCell,
	CalendarStateContext,
	type DateValue,
	Heading,
	Calendar as RACCalendar,
	CalendarGridHeader as RACCalendarGridHeader,
	type CalendarProps as RACCalendarProps,
	Text,
	composeRenderProps,
	useLocale,
} from 'react-aria-components'
import { twMerge } from 'tailwind-merge'
import { Button, ButtonGroup } from './button'
import { Label } from './field'
import { ChevronLeftIcon } from './icons/outline/chevron-left'
import { ChevronRightIcon } from './icons/outline/chevron-right'
import { NativeSelect, NativeSelectField } from './native-select'

export type YearRange = number | [yearsBefore: number, yearsAfter: number]

export interface CalendarProps<T extends DateValue>
	extends Omit<RACCalendarProps<T>, 'visibleDuration'> {
	yearRange?: YearRange
	errorMessage?: string
}

export function Calendar<T extends DateValue>({
	errorMessage,
	yearRange,
	...props
}: CalendarProps<T>) {
	return (
		<RACCalendar
			{...props}
			className={composeRenderProps(props.className, (className) => {
				return twMerge('px-1 pt-3 pb-1', className)
			})}
		>
			<CalendarHeader yearRange={yearRange} />
			<CalendarGrid className='w-full border-separate border-spacing-y-2 px-2'>
				<CalendarGridHeader />
				<CalendarGridBody>
					{(date) => {
						return (
							<CalendarCell
								date={date}
								className={composeRenderProps(
									'',
									(
										className,
										{
											isHovered,
											isPressed,
											isDisabled,
											isSelected,
											isInvalid,
											isUnavailable,
											isFocusVisible,
										},
									) => {
										return twMerge(
											'relative flex size-10 cursor-default items-center justify-center rounded-lg text-sm outline-hidden',
											isToday(date, getLocalTimeZone()) && [
												"before:content-['•']",
												'before:absolute',
												'before:-bottom-1',
												'before:text-xl',
											],
											isHovered && 'bg-zinc-100 dark:bg-zinc-800',
											isPressed && 'bg-accent/90 text-white',
											isDisabled && 'opacity-50',
											isSelected && [
												'bg-accent text-[lch(from_var(--color-accent)_calc((49.44_-_l)_*_infinity)_0_0)] text-sm',
												isHovered && 'bg-accent dark:bg-accent',
												isInvalid && 'border-red-600 bg-red-600 text-white',
											],
											isUnavailable &&
												'text-red-600 line-through decoration-red-600',
											isFocusVisible && [
												'outline-2 outline-ring',
												isSelected && 'outline-offset-1',
											],
											className,
										)
									},
								)}
							/>
						)
					}}
				</CalendarGridBody>
			</CalendarGrid>
			{errorMessage && (
				<Text slot='errorMessage' className='text-red-600 text-sm'>
					{errorMessage}
				</Text>
			)}
		</RACCalendar>
	)
}

export function CalendarHeader({ yearRange }: { yearRange?: YearRange }) {
	const { direction } = useLocale()
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const state = React.use(CalendarStateContext)!

	return (
		<header className={twMerge('flex w-full items-center pe-2', yearRange ? 'ps-2' : 'ps-3')}>
			{yearRange ? (
				<div className='flex flex-1 gap-x-2 text-left text-base/6 sm:text-sm/6 rtl:text-right'>
					<MonthDropdown state={state} />
					<YearDropdown state={state} yearRange={yearRange} />
				</div>
			) : (
				<Heading
					level={2}
					className='flex flex-1 text-left font-medium text-base/6 sm:text-sm/6 rtl:text-right'
					aria-hidden
				/>
			)}

			<ButtonGroup>
				<Button
					slot='previous'
					variant='plain'
					size='sm'
					isIconOnly
					aria-label='Previous'
					className='focus-visible:-outline-offset-2 [&:not(:hover)]:text-muted/75'
				>
					{direction === 'rtl' ? (
						<ChevronRightIcon className='size-5' />
					) : (
						<ChevronLeftIcon className='size-5' />
					)}
				</Button>

				<Button
					size='sm'
					slot='next'
					variant='plain'
					isIconOnly
					aria-label='Next'
					className='focus-visible:-outline-offset-2 [&:not(:hover)]:text-muted/75'
				>
					{direction === 'rtl' ? (
						<ChevronLeftIcon className='size-5' />
					) : (
						<ChevronRightIcon className='size-5' />
					)}
				</Button>
			</ButtonGroup>
		</header>
	)
}

export function CalendarGridHeader() {
	return (
		<RACCalendarGridHeader>
			{(day) => (
				<CalendarHeaderCell className='size-10 font-normal text-muted text-sm/6'>
					{day}
				</CalendarHeaderCell>
			)}
		</RACCalendarGridHeader>
	)
}

function YearDropdown({
	state,
	yearRange,
}: {
	state: CalendarState
	yearRange: YearRange
}) {
	const years: Array<{
		value: CalendarDate
		formatted: string
	}> = []
	const formatter = useDateFormatter({
		year: 'numeric',
		timeZone: state.timeZone,
	})

	const [yearsBefore, yearsAfter] = Array.isArray(yearRange) ? yearRange : [yearRange, yearRange]

	if (yearsBefore <= 0 || yearsAfter <= 0) {
		throw new Error(
			'The yearRange prop must be a positive number or an array of two positive numbers.',
		)
	}

	for (let i = yearsBefore * -1; i <= yearsAfter; i++) {
		const date = state.focusedDate.add({ years: i })
		years.push({
			value: date,
			formatted: formatter.format(date.toDate(state.timeZone)),
		})
	}

	const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const index = Number(e.target.value)
		const date = years[index].value
		state.setFocusedDate(date)
	}

	return (
		<NativeSelectField>
			<Label className='sr-only'>Year</Label>
			<NativeSelect onChange={onChange} value={yearsBefore}>
				{years.map((year, i) => (
					<option key={i} value={i}>
						{year.formatted}
					</option>
				))}
			</NativeSelect>
		</NativeSelectField>
	)
}

function MonthDropdown({ state }: { state: CalendarState }) {
	const months: Array<string> = []
	const formatter = useDateFormatter({
		month: 'long',
		timeZone: state.timeZone,
	})

	const numMonths = state.focusedDate.calendar.getMonthsInYear(state.focusedDate)
	for (let i = 1; i <= numMonths; i++) {
		const date = state.focusedDate.set({ month: i })
		months.push(formatter.format(date.toDate(state.timeZone)))
	}

	const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = Number(e.target.value)
		const date = state.focusedDate.set({ month: value })
		state.setFocusedDate(date)
	}

	return (
		<NativeSelectField>
			<Label className='sr-only'>Month</Label>
			<NativeSelect onChange={onChange} value={state.focusedDate.month}>
				{months.map((month, i) => (
					<option key={i} value={i + 1}>
						{month}
					</option>
				))}
			</NativeSelect>
		</NativeSelectField>
	)
}
