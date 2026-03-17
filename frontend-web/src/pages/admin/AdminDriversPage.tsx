import { useState, useEffect } from 'react'
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Button, Avatar, Tooltip, CircularProgress,
} from '@mui/material'
import BlockIcon from '@mui/icons-material/Block'
import { driverApi } from '@/api/driver.api'
import { companyApi } from '@/api/company.api'
import type { Driver } from '@/types'
import PageHeader from '@/components/common/PageHeader'

const statusColor: Record<string, any> = { OFFLINE: 'default', ONLINE: 'success', BUSY: 'warning' }
const statusLabel: Record<string, string> = { OFFLINE: 'Ngoại tuyến', ONLINE: 'Trực tuyến', BUSY: 'Đang chạy' }

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [banDialog, setBanDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [reason, setReason] = useState('')

  useEffect(() => {
    companyApi.getAllAdmin().then(async (companies) => {
      const all: Driver[] = []
      for (const c of companies.filter((co) => co.status === 'ACTIVE')) {
        const d = await driverApi.getByCompany(c.id)
        all.push(...d)
      }
      setDrivers(all)
    }).finally(() => setLoading(false))
  }, [])

  const handleBan = async () => {
    await driverApi.ban(banDialog.id, reason)
    setBanDialog({ open: false, id: '', name: '' })
    setReason('')
  }

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>

  return (
    <Box p={3}>
      <PageHeader title="Tài xế" subtitle={`${drivers.length} tài xế`} />

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tài xế</TableCell>
              <TableCell>Biển số</TableCell>
              <TableCell>Điểm uy tín</TableCell>
              <TableCell>Đánh giá</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 13 }}>{d.fullName?.[0]}</Avatar>
                    <Box>
                      <Typography fontWeight={500} fontSize={14}>{d.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{d.phoneNumber}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{d.vehiclePlate}</TableCell>
                <TableCell>
                  <Typography fontWeight={600} color={
                    d.reputationScore !== null && d.reputationScore !== undefined && d.reputationScore < 3 ? 'error.main' :
                    d.reputationScore !== null && d.reputationScore !== undefined && d.reputationScore >= 4.5 ? 'success.main' : 'text.primary'
                  }>
                    {d.reputationScore !== null && d.reputationScore !== undefined ? d.reputationScore.toFixed(1) : '—'}
                  </Typography>
                </TableCell>
                <TableCell>{d.totalRatings}</TableCell>
                <TableCell><Chip label={statusLabel[d.onlineStatus]} color={statusColor[d.onlineStatus]} size="small" /></TableCell>
                <TableCell align="center">
                  <Tooltip title="Ban tài xế">
                    <IconButton size="small" color="error"
                      onClick={() => setBanDialog({ open: true, id: d.id, name: d.fullName || '' })}>
                      <BlockIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={banDialog.open} onClose={() => setBanDialog({ open: false, id: '', name: '' })} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Ban tài xế</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>Ban <strong>{banDialog.name}</strong>?</Typography>
          <TextField label="Lý do" multiline rows={3} fullWidth value={reason}
            onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBanDialog({ open: false, id: '', name: '' })} color="inherit">Hủy</Button>
          <Button variant="contained" color="error" onClick={handleBan}>Xác nhận ban</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
