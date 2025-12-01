import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useNavigation } from 'react-router'
import { useRemixForm } from 'remix-hook-form'
import { z } from 'zod'
import { Button } from '~/components/button'
import { Form } from '~/components/form'
import { Input } from '~/components/input'
import { AuthConfirmation } from '~/features/auth/components/auth-confirmation'
import { AuthDivider } from '~/features/auth/components/auth-divider'
import { AuthLinks } from '~/features/auth/components/auth-links'
import { AuthTitle } from '~/features/auth/components/auth-title'
import { GoogleAuthButton } from '~/features/auth/components/google-auth-button'
import { PasswordInput } from '~/features/auth/components/password-input'
import { authSchemas } from '~/features/auth/schemas'

type Props = {
	email: string | undefined
}

export type RegisterSchema = z.infer<typeof registerSchema>

export const registerSchema = z.object({
	name: authSchemas.name,
	email: authSchemas.email,
	password: authSchemas.password,
	recaptchaToken: authSchemas.recaptchaToken,
})

export function RegisterForm({ email }: Props) {
	const {
		handleSubmit,
		formState: { errors },
		register,
		setValue,
	} = useRemixForm({
		resolver: zodResolver(registerSchema),
	})

	const navigation = useNavigation()
	const submitting = navigation.state === 'submitting'

	if (email) {
		return <AuthConfirmation message={`We just sent a verification link to ${email}.`} />
	}

	return (
		<>
			<AuthTitle title='Create an account' description='Sign up to get started' />
			<Form method='post' onSubmit={handleSubmit} className='flex flex-col gap-4'>
				<Input
					{...register('name')}
					placeholder='Name'
					errorMessage={errors.name?.message}
				/>
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
				<Button type='submit' isDisabled={submitting} isPending={submitting}>
					Register
				</Button>
			</Form>
			<AuthDivider />
			<GoogleAuthButton flow='register' />
			<AuthLinks links={[{ label: 'Already have an account? Login', to: '/login' }]} />
		</>
	)
}
