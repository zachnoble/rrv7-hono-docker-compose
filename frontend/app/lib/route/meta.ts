import type { MetaDescriptor } from 'react-router'

export type RouteMeta = {
	title?: string
	description?: string
}

export function routeMeta({ title, description }: RouteMeta = {}) {
	const meta: MetaDescriptor[] = []

	if (title) {
		meta.push({
			title,
		})
	}

	if (description) {
		meta.push({
			name: 'description',
			content: description,
		})
	}

	return () => meta
}
