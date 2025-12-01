import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useNavigation } from 'react-router'
import { useRemixForm } from 'remix-hook-form'
import { z } from 'zod'
import { Button } from '~/components/button'
import { Form } from '~/components/form'
import { Input } from '~/components/input'
import { AuthDivider } from '~/features/auth/components/auth-divider'
import { AuthLinks } from '~/features/auth/components/auth-links'
import { AuthTitle } from '~/features/auth/components/auth-title'
import { GoogleAuthButton } from '~/features/auth/components/google-auth-button'
import { PasswordInput } from '~/features/auth/components/password-input'
import { authSchemas } from '~/features/auth/schemas'

export type LoginSchema = z.infer<typeof loginSchema>

export const loginSchema = z.object({
	email: authSchemas.email,
	password: authSchemas.existingPassword,
	recaptchaToken: authSchemas.recaptchaToken,
})

export function LoginForm() {
	const {
		handleSubmit,
		formState: { errors },
		register,
		setValue,
	} = useRemixForm({
		resolver: zodResolver(loginSchema),
	})

	const navigation = useNavigation()
	const submitting = navigation.state === 'submitting'

	return (
		<>
			<AuthTitle title='Login' description='Sign in to your account' />
			<Form method='post' onSubmit={handleSubmit} className='flex flex-col gap-4'>
				<Input
					{...register('email')}
					type='email'
					placeholder='Email'
					errorMessage={errors.email?.message}
				/>
				<PasswordInput
					{...register('password')}
					placeholder='Password'
					errorMessage={errors.password?.message}
				/>
				<GoogleReCaptcha onVerify={(token) => setValue('recaptchaToken', token)} />
				<Button type='submit' isPending={submitting} isDisabled={submitting}>
					Login
				</Button>
			</Form>
			<AuthDivider />
			<GoogleAuthButton flow='login' />
			<AuthLinks
				links={[
					{ label: "Don't have an account? Register", to: '/register' },
					{ label: 'Forgot your password?', to: '/forgot-password' },
				]}
			/>
		</>
	)
}
