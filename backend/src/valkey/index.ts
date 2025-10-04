import Valkey from 'iovalkey'
import { env } from '~/lib/env'

export const valkey = new Valkey({ host: env.VALKEY_HOST, port: env.VALKEY_PORT })
