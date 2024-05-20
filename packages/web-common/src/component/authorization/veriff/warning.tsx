import { FC } from 'react'
import { ModalBodyProps } from '../../utils'
import { useTranslation } from 'react-i18next'
import DialogContent from '@mui/material/DialogContent'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery'

export const VeriffWarning: FC<ModalBodyProps> = ({ callback }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'common.authorization.veriff' })
  const theme = useTheme()
  const small = useMediaQuery(theme.breakpoints.down('md'))
  return <>
    <DialogContent>
      <Card>
        <CardHeader title={t('header')} />
        <CardContent>
          <Typography variant="body2">{t('intro')}</Typography>
          <ul>
            <li><Typography variant="body2">{t('vpn')}</Typography></li>
            {(small ? [] : ['vpn-desktop', 'vpn-mobile']).map(
              point => <li key={point}><Typography variant="body2">{t(point)}</Typography></li>
            )}
          </ul>
        </CardContent>
      </Card>
    </DialogContent>
    <DialogActions>
      <Button variant="contained" onClick={() => callback('skip')}>{t('back')}</Button>
    </DialogActions>
  </>
}
