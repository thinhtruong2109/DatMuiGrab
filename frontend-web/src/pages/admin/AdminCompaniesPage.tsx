import { useState, useEffect } from 'react'
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Tooltip,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BlockIcon from '@mui/icons-material/Block'
import { companyApi } from '@/api/company.api'
import { formatCurrency, formatDate } from '@/utils/format'
import type { TransportCompany } from '@/types'
import PageHeader from '@/components/common/PageHeader'

const statusLabel: Record<string, string> = { PENDING: 'Chờ duyệt', ACTIVE: 'Hoạt động', SUSPENDED: 'Tạm hoãn' }
const statusColor: Record<string, any> = { PENDING: 'warning', ACTIVE: 'success', SUSPENDED: 'error' }

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<TransportCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [reason, setReason] = useState('')

  useEffect(() => {
    companyApi.getAllAdmin().then(setCompanies).finally(() => setLoading(false))
  }, [])

  const handleApprove = async (id: string) => {
    await companyApi.approve(id)
    setCompanies(companies.map((c) => c.id === id ? { ...c, status: 'ACTIVE' } : c))
  }

  const handleSuspend = async () => {
    await companyApi.suspend(suspendDialog.id, reason)
    setCompanies(companies.map((c) => c.id === suspendDialog.id ? { ...c, status: 'SUSPENDED' } : c))
    setSuspendDialog({ open: false, id: '', name: '' })
    setReason('')
  }

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>

  return (
    <Box p={3}>
      <PageHeader title="Công ty vận tải" subtitle={`${companies.length} công ty`} />

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên công ty</TableCell>
              <TableCell>Giấy phép</TableCell>
              <TableCell>Giá/km</TableCell>
              <TableCell>Tài xế %</TableCell>
              <TableCell>Ngày đăng ký</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Typography fontWeight={600} fontSize={14}>{c.companyName}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.address}</Typography>
                </TableCell>
                <TableCell>{c.licenseNumber}</TableCell>
                <TableCell>{formatCurrency(c.pricePerKm)}</TableCell>
                <TableCell>{c.driverRevenuePercent}%</TableCell>
                <TableCell>{formatDate(c.createdAt)}</TableCell>
                <TableCell>
                  <Chip label={statusLabel[c.status]} color={statusColor[c.status]} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" gap={0.5} justifyContent="center">
                    {c.status === 'PENDING' && (
                      <Tooltip title="Phê duyệt">
                        <IconButton size="small" color="success" onClick={() => handleApprove(c.id)}>
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {c.status === 'ACTIVE' && (
                      <Tooltip title="Tạm hoãn">
                        <IconButton size="small" color="error"
                          onClick={() => setSuspendDialog({ open: true, id: c.id, name: c.companyName })}>
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {c.status === 'SUSPENDED' && (
                      <Tooltip title="Kích hoạt lại">
                        <IconButton size="small" color="success" onClick={() => handleApprove(c.id)}>
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={suspendDialog.open} onClose={() => setSuspendDialog({ open: false, id: '', name: '' })} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Tạm hoãn công ty</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>Tạm hoãn <strong>{suspendDialog.name}</strong>?</Typography>
          <TextField label="Lý do" multiline rows={3} fullWidth value={reason}
            onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSuspendDialog({ open: false, id: '', name: '' })} color="inherit">Hủy</Button>
          <Button variant="contained" color="error" onClick={handleSuspend}>Xác nhận</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
