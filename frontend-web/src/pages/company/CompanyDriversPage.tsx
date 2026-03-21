import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Chip, Button, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tabs, Tab, CircularProgress,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import GavelIcon from '@mui/icons-material/Gavel'
import { driverApi } from '@/api/driver.api'
import { companyApi } from '@/api/company.api'
import { appealApi } from '@/api/appeal.api'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/utils/format'
import type { Driver, DriverCompanyRegistration, TransportCompany } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'

export default function CompanyDriversPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState(0)
  const [company, setCompany] = useState<TransportCompany | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [pending, setPending] = useState<DriverCompanyRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; regId: string }>({ open: false, regId: '' })
  const [appealDialog, setAppealDialog] = useState<{ open: boolean; driverId: string }>({ open: false, driverId: '' })
  const [rejectNote, setRejectNote] = useState('')
  const [appealReason, setAppealReason] = useState('')

  useEffect(() => {
    companyApi.getAll().then(async (companies) => {
      const c = companies.find((company) => company.userId === user?.id) || companies[0]
      if (!c) return
      setCompany(c)
      const [d, p] = await Promise.all([
        driverApi.getByCompany(c.id),
        driverApi.getPendingByCompany(c.id),
      ])
      setDrivers(d)
      setPending(p)
    }).finally(() => setLoading(false))
  }, [user?.id])

  const handleApprove = async (regId: string) => {
    await driverApi.approveRegistration(regId)
    setPending(pending.filter((r) => r.id !== regId))
  }

  const handleReject = async () => {
    await driverApi.rejectRegistration(rejectDialog.regId, rejectNote)
    setPending(pending.filter((r) => r.id !== rejectDialog.regId))
    setRejectDialog({ open: false, regId: '' })
    setRejectNote('')
  }

  const handleCreateAppeal = async () => {
    if (!appealDialog.driverId || !appealReason.trim()) return
    await appealApi.create(appealDialog.driverId, appealReason.trim())
    setAppealDialog({ open: false, driverId: '' })
    setAppealReason('')
  }

  const statusColor: Record<string, any> = { OFFLINE: 'default', ONLINE: 'success', BUSY: 'warning' }
  const statusLabel: Record<string, string> = { OFFLINE: 'Ngoại tuyến', ONLINE: 'Trực tuyến', BUSY: 'Đang chạy' }

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>

  return (
    <Box p={3}>
      <PageHeader
        title="Quản lý tài xế"
        subtitle={`${drivers.length} tài xế • ${pending.length} chờ duyệt`}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Đang hoạt động (${drivers.length})`} />
        <Tab label={`Chờ duyệt (${pending.length})`}
          iconPosition="end"
          icon={pending.length > 0 ? <Chip label={pending.length} size="small" color="warning" sx={{ height: 20 }} /> : undefined}
        />
      </Tabs>

      {tab === 0 && (
        drivers.length === 0 ? <EmptyState title="Chưa có tài xế nào" /> : (
          <TableContainer component={Card}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tài xế</TableCell>
                  <TableCell>Biển số xe</TableCell>
                  <TableCell>Loại xe</TableCell>
                  <TableCell>Điểm uy tín</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drivers.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 13 }}>
                          {d.fullName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={500} fontSize={14}>{d.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">{d.phoneNumber}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{d.vehiclePlate}</TableCell>
                    <TableCell>{d.vehicleType}</TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {d.reputationScore !== null && d.reputationScore !== undefined ? d.reputationScore.toFixed(1) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={statusLabel[d.onlineStatus]} color={statusColor[d.onlineStatus]} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<GavelIcon />}
                        onClick={() => setAppealDialog({ open: true, driverId: d.id })}
                      >
                        Kháng cáo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {tab === 1 && (
        pending.length === 0 ? <EmptyState title="Không có hồ sơ chờ duyệt" /> : (
          <Box display="flex" flexDirection="column" gap={2}>
            {pending.map((reg) => (
              <Card key={reg.id}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography fontWeight={600}>{reg.driverId}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nộp hồ sơ: {formatDate(reg.appliedAt)}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => handleApprove(reg.id)}
                      >
                        Duyệt
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => setRejectDialog({ open: true, regId: reg.id })}
                      >
                        Từ chối
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )
      )}

      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, regId: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Từ chối hồ sơ</DialogTitle>
        <DialogContent>
          <TextField
            label="Lý do từ chối"
            multiline rows={3} fullWidth sx={{ mt: 1 }}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialog({ open: false, regId: '' })} color="inherit">Hủy</Button>
          <Button variant="contained" color="error" onClick={handleReject}>Xác nhận từ chối</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={appealDialog.open} onClose={() => setAppealDialog({ open: false, driverId: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Tạo kháng cáo cho tài xế</DialogTitle>
        <DialogContent>
          <TextField
            label="Lý do kháng cáo"
            multiline rows={3} fullWidth sx={{ mt: 1 }}
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAppealDialog({ open: false, driverId: '' })} color="inherit">Hủy</Button>
          <Button variant="contained" onClick={handleCreateAppeal}>Gửi kháng cáo</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
