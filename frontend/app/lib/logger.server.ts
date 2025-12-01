import pino, { type LoggerOptions } from 'pino'
import { config, type Environment } from '~/lib/config.server'

const developmentOptions: LoggerOptions = {
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
		},
	},
}

const productionOptions: LoggerOptions = {}

const testOptions: LoggerOptions = {
	level: 'silent',
}

const options: Record<Environment, LoggerOptions> = {
	development: developmentOptions,
	production: productionOptions,
	test: testOptions,
}

const stream = pino.destination({ sync: false })

export const logger = pino(options[config.NODE_ENV], stream)
