import { Hono } from 'hono'
import { authRoutes } from './auth-routes'
import { healthRoutes } from './health-routes'

export const routes = new Hono().route('/', healthRoutes).route('/auth', authRoutes)
