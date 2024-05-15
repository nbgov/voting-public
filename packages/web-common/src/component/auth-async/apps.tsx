import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
// import PsLogo from '../../../assets/pslogo.png'
import AppleLogo from '../../../assets/appstore.svg'
import GPLogo from '../../../assets/gplay.svg'
import { type FunctionComponent } from 'react'

export const ProofspaceApps: FunctionComponent = () =>
  <Stack direction="row" spacing={2} sx={{ width: '100%' }} justifyContent="space-around" alignItems="center">
    {/* <Button variant="outlined" size="medium" target="_blank" href="https://proofspace.page.link/mobileapp"
      startIcon={<Box sx={{
        width: 100, height: 32,
        backgroundImage: `url(${PsLogo})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'contain',
      }} />} /> */}
    <Button size="medium" target="_blank" href="https://apps.apple.com/us/app/proofspace/id1512258409"
      startIcon={<Box sx={{
        width: { xs: 100, sm: 150 },
        height: 50,
        backgroundImage: `url(${AppleLogo})`, // eslint-disable-line
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: '100% 100%'
      }} />} />
    <Button size="medium" target="_blank" href="https://play.google.com/store/apps/details?id=io.zaka.app"
      startIcon={<Box sx={{
        width: { xs: 100, sm: 150 },
        height: 50,
        backgroundImage: `url(${GPLogo})`, // eslint-disable-line
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: '100% 100%'
      }} />} />
  </Stack>
