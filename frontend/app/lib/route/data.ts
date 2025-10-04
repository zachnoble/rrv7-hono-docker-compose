type Data<T> = T | { error: string } | undefined | null

type Result<T> = Partial<T>

export function routeData<T>(data: Data<T>): Result<T> {
	return !data || (typeof data === 'object' && 'error' in data) ? {} : data
}
