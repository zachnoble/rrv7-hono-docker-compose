type SearchParams = Record<string, string | undefined>

type RequestOrUrl = Request | Request['url']

export function getSearchParams(requestOrUrl: RequestOrUrl): SearchParams {
	const url = requestOrUrl instanceof Request ? requestOrUrl.url : requestOrUrl
	return Object.fromEntries(new URL(url).searchParams)
}
