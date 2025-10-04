import { FieldError, FieldInput, TextField } from './field'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string
	description?: string
	errorMessage?: string
}

export function Input({ label, description, errorMessage, ...props }: InputProps) {
	return (
		<TextField isInvalid={Boolean(errorMessage)} aria-label={label ?? props.placeholder}>
			<FieldInput {...props} />
			<FieldError>{errorMessage}</FieldError>
		</TextField>
	)
}
