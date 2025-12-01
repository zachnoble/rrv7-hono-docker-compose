export type LoginDTO = {
	email: string
	password: string
}

export type ChangePasswordDTO = {
	userId: string
	currentPassword: string
	newPassword: string
}

export type VerifyUserDTO = {
	email: string
	token: string
}

export type VerifyUserResultDTO =
	| { status: 'verified' }
	| { status: 'already_verified' }
	| { status: 'expired'; userId: string; email: string }

export type ResetPasswordDTO = {
	email: string
	password: string
	token: string
}

export type SendVerificationEmailDTO = {
	email: string
	userId: string
}

export type VerifyPasswordDTO = {
	password: string
	passwordHash: string
}

export type AuthEmailProps = {
	actionUrl: string
	title: string
	heading: string
	bodyText: string
	buttonText: string
	footerText: string
}
