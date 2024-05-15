import type { SxProps } from '@mui/material/styles'
import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery'

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
