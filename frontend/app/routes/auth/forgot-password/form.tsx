import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useNavigation } from 'react-router'
import { useRemixForm } from 'remix-hook-form'
import { z } from 'zod'
import { Button } from '~/components/button'
import { Form } from '~/components/form'
import { Input } from '~/components/input'
import { AuthConfirmation } from '~/features/auth/components/auth-confirmation'
import { AuthLinks } from '~/features/auth/components/auth-links'
import { AuthTitle } from '~/features/auth/components/auth-title'
import { authSchemas } from '~/features/auth/schemas'

type Props = {
	email: string | undefined
}

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>

export const forgotPasswordSchema = z.object({
	email: authSchemas.email,
	recaptchaToken: authSchemas.recaptchaToken,
})

export function ForgotPasswordForm({ email }: Props) {
	const {
		handleSubmit,
		formState: { errors },
		register,
		setValue,
	} = useRemixForm({
		resolver: zodResolver(forgotPasswordSchema),
	})

	const navigation = useNavigation()
	const submitting = navigation.state === 'submitting'

	if (email) {
		return (
			<AuthConfirmation message={`We just sent a link to reset your password to ${email}.`} />
		)
	}

	return (
		<>
			<AuthTitle
				title='Forgot your password?'
				description="Enter your email and we'll send you a link to reset your password."
			/>
			<Form method='post' onSubmit={handleSubmit} className='flex flex-col gap-4'>
				<Input
					{...register('email')}
					type='email'
					placeholder='Email'
					errorMessage={errors.email?.message}
				/>
				<GoogleReCaptcha onVerify={(token) => setValue('recaptchaToken', token)} />
				<Button type='submit' isPending={submitting} isDisabled={submitting}>
					Reset Password
				</Button>
			</Form>
			<AuthLinks links={[{ label: 'Back to Login', to: '/login' }]} />
		</>
	)
}
