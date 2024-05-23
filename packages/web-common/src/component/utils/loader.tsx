import { FC, useState } from 'react'
import { LoaderScreenProps } from './types'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery'

export const ScreenLoader: FC<LoaderScreenProps> = ({ hanlder, children }) => {
  const [loaded, setLoaded] = useState(false)
  hanlder.ready = () => {
    !loaded && setLoaded(true)
  }
  const theme = useTheme()
  const small = useMediaQuery(theme.breakpoints.down('md'))

  return <>
    {loaded ? undefined : <Grid container direction="row" justifyContent="center" alignItems="center">
      <Grid item sx={small ? { pt: '70%' } : {}}><CircularProgress /></Grid>
    </Grid>}
    <Box sx={{ display: loaded ? "block" : "none", width: '100%' }}>{children}</Box>
  </>
}
