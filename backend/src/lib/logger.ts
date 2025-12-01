import pino, { type LoggerOptions } from 'pino'
import { config, type Environment } from '~/lib/config'

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

export const logger = pino(options[config.NODE_ENV], stream)
