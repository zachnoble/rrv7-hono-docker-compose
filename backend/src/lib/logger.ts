import pino, { type LoggerOptions } from 'pino'
import { type Environment, env } from '~/lib/env'

const testOptions: LoggerOptions = {
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
		},
	},
}

const developmentOptions: LoggerOptions = {
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
		},
	},
}

const productionOptions: LoggerOptions = {}

const options: Record<Environment, LoggerOptions> = {
	development: developmentOptions,
	production: productionOptions,
	test: testOptions,
}

const stream = pino.destination({ sync: false })

export const logger = pino(options[env.NODE_ENV], stream)
