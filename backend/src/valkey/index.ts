import ValkeyClient from 'iovalkey'
import { config } from '~/lib/config'
import { valKeys } from './keys'

export const valkey = new ValkeyClient({ host: config.VALKEY_HOST, port: config.VALKEY_PORT })

export type Valkey = typeof valkey

export { valKeys }
