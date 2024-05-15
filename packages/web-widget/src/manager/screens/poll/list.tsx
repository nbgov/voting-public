import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import { fillPagination, type Pagination, type Poll, PollStatus } from '@smartapps-poll/common'
import { type FunctionComponent, useEffect, useState } from 'react'
import { useCtx } from '../../../shared'
import { PollListToolbar } from '../../components/poll/list-toolbar'
import { useTranslation } from 'react-i18next'

export const PollListScreen: FunctionComponent<PollListScreenProps> = ({ onEdit, onManage }) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'manager.poll.list' })
  const ctx = useCtx()
  const [polls, setPolls] = useState<Poll[]>([])
  const [pager, setPager] = useState<Pagination>(fillPagination())
  useEffect(() => {
    void (async () => {
      const result = await ctx.web.polls.list(pager)
      if (result != null) {
        setPager(result.pager)
        setPolls(result.list)
      }
    })()
  }, [
    ctx.integration?.params.serviceId, ctx.integration?.params.authorization.orgId,
    ctx.integration?.params.authorization.userId, pager.page, pager.size, pager.total
  ])

  return <Paper sx={{ width: '100%' }}>
    <PollListToolbar />
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>
              {t('table.column.title')}
            </TableCell>
            <TableCell width={1} sx={{ fontWeight: 'bold' }}>
              {t('table.column.status')}
            </TableCell>
            <TableCell width={1} sx={{ fontWeight: 'bold' }}>
              {t('table.column.actions')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            polls.length > 0
              ? polls.map(poll =>
                <TableRow key={poll._id}>
                  <TableCell>{poll.title}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{t(`status.${poll.status}`)}</TableCell>
                  <TableCell>
                    {
                      [PollStatus.UNPUBLISHED, PollStatus.PUBLISHED].includes(poll.status)
                        ? <Button onClick={() => { void onEdit(poll._id) }}>{t('table.actions.edit')}</Button>
                        : <Button onClick={() => { void onManage(poll._id) }}>{t('table.actions.manage')}</Button>
                    }
                  </TableCell>
                </TableRow>
              )
              : <TableRow>
                <TableCell colSpan={3}>{t('table.result.nocontent')}</TableCell>
              </TableRow>
          }
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      rowsPerPageOptions={[10, 15, 20, 25]}
      component="div"
      count={pager.total ?? 0}
      rowsPerPage={pager.size}
      page={pager.page}
      onPageChange={(_, page) => { setPager({ ...pager, page }) }}
      onRowsPerPageChange={e => { setPager({ ...pager, page: 0, size: parseInt(e.target.value) ?? pager.size }) }}
    />
  </Paper>
}

export interface PollListScreenProps {
  onEdit: (id: string) => Promise<void>
  onManage: (id: string) => Promise<void>
}
