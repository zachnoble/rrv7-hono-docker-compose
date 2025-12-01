import { type FormProps, Form as ReactRouterForm } from 'react-router'

export function Form(props: FormProps) {
	return (
		<ReactRouterForm
			// skip browser validation, as we use react-hook-form & zod
			noValidate
			{...props}
		/>
	)
}
