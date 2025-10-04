import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useRemixForm } from 'remix-hook-form'
import { Button } from '~/components/button'
import { Form } from '~/components/form'
import { Input } from '~/components/input'
import { AuthDivider } from '~/features/auth/components/auth-divider'
import { AuthLinks } from '~/features/auth/components/auth-links'
import { AuthTitle } from '~/features/auth/components/auth-title'
import { GoogleAuthButton } from '~/features/auth/components/google-auth-button'
import { PasswordInput } from '~/features/auth/components/password-input'
import { useLoading } from '~/lib/use-loading'
import { loginSchema } from './schema'

export function LoginForm() {
	const { isSubmitting } = useLoading()

	const {
		handleSubmit,
		formState: { errors },
		register,
		setValue,
	} = useRemixForm({
		resolver: zodResolver(loginSchema),
	})

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
				<Button type='submit' isPending={isSubmitting} isDisabled={isSubmitting}>
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
