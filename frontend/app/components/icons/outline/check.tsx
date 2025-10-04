import { Icon } from '../../icon'

export function CheckIcon({
	'aria-label': arialLabel,
	...props
}: React.JSX.IntrinsicElements['svg']) {
	return (
		<Icon aria-label={arialLabel}>
			<svg
				xmlns='http://www.w3.org/2000/svg'
				width={24}
				height={24}
				viewBox='0 0 24 24'
				{...props}
			>
				<path
					fill='currentColor'
					d='M18.577 6.183a1 1 0 0 1 .24 1.394l-5.666 8.02c-.36.508-.665.94-.94 1.269c-.287.34-.61.658-1.038.86a2.83 2.83 0 0 1-2.03.153c-.456-.137-.82-.406-1.149-.702c-.315-.285-.672-.668-1.09-1.116l-1.635-1.753a1 1 0 1 1 1.462-1.364l1.606 1.722c.455.487.754.806.998 1.027c.24.216.344.259.385.271c.196.06.405.045.598-.046c.046-.022.149-.085.36-.338c.216-.257.473-.62.863-1.171l5.642-7.986a1 1 0 0 1 1.394-.24'
				/>
			</svg>
		</Icon>
	)
}
