import { index, layout, type RouteConfig, route } from '@react-router/dev/routes'

export default [
	// home
	index('./routes/index.tsx'),

	// auth
	layout('./routes/auth/layout/index.tsx', [
		route('login', './routes/auth/login/index.tsx'),
		route('register', './routes/auth/register/index.tsx'),
		route('logout', './routes/auth/logout/index.tsx'),
		route('verify-user', './routes/auth/verify-user/index.tsx'),
		route('forgot-password', './routes/auth/forgot-password/index.tsx'),
		route('reset-password', './routes/auth/reset-password/index.tsx'),
		route('google-auth', './routes/auth/google-auth/index.tsx'),
	]),

	// miscellaneous
	route('set-theme', './routes/set-theme.tsx'),

	// not found / catch all
	route('*', 'routes/$.tsx'),
] satisfies RouteConfig
