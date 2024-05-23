import type { SxProps } from '@mui/material/styles'
import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery'
import { RENDERER_PARTY, type PollInfo } from '@smartapps-poll/common'
import { Context } from '../app'
import { isViewWrapped } from '@smartapps-poll/web-common'

export const useSmallStyles = (baseStyle: SxProps, smallStyle: SxProps): SxProps => {
  const isSmallUI = useSmalllUI()
  if (isSmallUI) {
    return { ...baseStyle, ...smallStyle } as SxProps
  }

  return baseStyle
}

export const useSmallPaddings = (): SxProps => useSmallStyles({ px: 3 }, { px: 2 })

export const useSmalllUI = (): boolean => {
  const theme = useTheme()
  return useMediaQuery(theme.breakpoints.down('md'))
}

export const shouldHideExtras = (poll: PollInfo, context: Context): boolean => {
  return poll.uiType === RENDERER_PARTY || isViewWrapped(context)
}

export const isDesktop = (ctx: Context): boolean => !isViewWrapped(ctx)
  && navigator.userAgent.match(/(iPhone)|(android)|(webOS)/i) == null
