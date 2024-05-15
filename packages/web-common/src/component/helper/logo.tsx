import { type FunctionComponent } from 'react'
import Logo from '../../../assets/logo.svg'

export const PollLogo: FunctionComponent<PollLogoProps> = ({ width, height }) => {
  return <img src={Logo as unknown as string} width={width} height={height} />
}

export interface PollLogoProps {
  width?: string | number
  height?: string | number
}
