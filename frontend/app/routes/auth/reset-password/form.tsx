import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigation } from 'react-router'
import { useRemixForm } from 'remix-hook-form'
import { z } from 'zod'
import { Button } from '~/components/button'
import { Form } from '~/components/form'
import { AuthLinks } from '~/features/auth/components/auth-links'
import { AuthTitle } from '~/features/auth/components/auth-title'
import { PasswordInput } from '~/features/auth/components/password-input'
import { authSchemas } from '~/features/auth/schemas'

type Props = {
	email: string
	token: string
}

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>

export const resetPasswordSchema = z.object({
	email: authSchemas.email,
	password: authSchemas.password,
	token: authSchemas.token,
})

export function ResetPasswordForm({ email, token }: Props) {
	const {
		handleSubmit,
		formState: { errors },
		register,
	} = useRemixForm({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { email, token },
	})

	const navigation = useNavigation()
	const submitting = navigation.state === 'submitting'

	return (
		<>
			<AuthTitle title='Reset Password' description='Enter your new password below.' />
			<Form method='post' onSubmit={handleSubmit} className='flex flex-col gap-4'>
				<input type='hidden' {...register('email')} />
				<input type='hidden' {...register('token')} />
				<PasswordInput
					{...register('password')}
					placeholder='New Password'
					errorMessage={errors.password?.message}
				/>
				<Button type='submit' isPending={submitting} isDisabled={submitting}>
					Reset Password
				</Button>
			</Form>
			<AuthLinks links={[{ label: 'Back to Login', to: '/login' }]} />
		</>
	)
}
