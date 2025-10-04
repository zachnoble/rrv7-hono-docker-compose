import { zodResolver } from '@hookform/resolvers/zod'
import { useRemixForm } from 'remix-hook-form'
import { Button } from '~/components/button'
import { Form } from '~/components/form'
import { AuthLinks } from '~/features/auth/components/auth-links'
import { AuthTitle } from '~/features/auth/components/auth-title'
import { PasswordInput } from '~/features/auth/components/password-input'
import { useLoading } from '~/lib/use-loading'
import { resetPasswordSchema } from './schema'

type Props = {
	email: string
	token: string
}

export function ResetPasswordForm({ email, token }: Props) {
	const { isSubmitting } = useLoading()

	const {
		handleSubmit,
		formState: { errors },
		register,
	} = useRemixForm({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { email, token },
	})

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
				<Button type='submit' isPending={isSubmitting} isDisabled={isSubmitting}>
					Reset Password
				</Button>
			</Form>
			<AuthLinks links={[{ label: 'Back to Login', to: '/login' }]} />
		</>
	)
}
