import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Chip, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Tabs, Tab,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { appealApi } from '@/api/appeal.api'
import { formatDate } from '@/utils/format'
import type { Appeal } from '@/types'
import PageHeader from '@/components/common/PageHeader'
import EmptyState from '@/components/common/EmptyState'

const statusLabel: Record<string, string> = { PENDING: 'Chờ xử lý', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }
const statusColor: Record<string, any> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' }

export default function AdminAppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean; id: string; type: 'APPROVED' | 'REJECTED' }>({
    open: false, id: '', type: 'APPROVED',
  })
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    appealApi.getAll().then(setAppeals).finally(() => setLoading(false))
  }, [])

  const handleResolve = async () => {
    setSubmitting(true)
    try {
      await appealApi.resolve(resolveDialog.id, resolveDialog.type, adminNote)
      setAppeals(appeals.map((a) =>
        a.id === resolveDialog.id ? { ...a, status: resolveDialog.type, adminNote } : a
      ))
      setResolveDialog({ open: false, id: '', type: 'APPROVED' })
      setAdminNote('')
    } finally {
      setSubmitting(false)
    }
  }

  const pending = appeals.filter((a) => a.status === 'PENDING')
  const resolved = appeals.filter((a) => a.status !== 'PENDING')

  const displayList = tab === 0 ? pending : resolved

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>

  return (
    <Box p={3}>
      <PageHeader title="Kháng cáo" subtitle="Xem xét và xử lý kháng cáo tài xế" />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Chờ xử lý (${pending.length})`}
          iconPosition="end"
          icon={pending.length > 0 ? <Chip label={pending.length} size="small" color="warning" sx={{ height: 20 }} /> : undefined}
        />
        <Tab label={`Đã xử lý (${resolved.length})`} />
      </Tabs>

      {displayList.length === 0 ? (
        <EmptyState title={tab === 0 ? 'Không có kháng cáo chờ xử lý' : 'Chưa có kháng cáo nào được xử lý'} />
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {displayList.map((appeal) => (
            <Card key={appeal.id}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography fontWeight={700}>{appeal.driverName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Bởi: {appeal.appealedBy === 'DRIVER' ? 'Tài xế' : 'Công ty vận tải'} • {formatDate(appeal.createdAt)}
                    </Typography>
                  </Box>
                  <Chip label={statusLabel[appeal.status]} color={statusColor[appeal.status]} size="small" />
                </Box>

                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    "{appeal.reason}"
                  </Typography>
                </Box>

                {appeal.adminNote && (
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Ghi chú Admin: {appeal.adminNote}
                  </Typography>
                )}

                {appeal.status === 'PENDING' && (
                  <Box display="flex" gap={1}>
                    <Button
                      variant="contained" color="success" size="small" startIcon={<CheckIcon />}
                      onClick={() => setResolveDialog({ open: true, id: appeal.id, type: 'APPROVED' })}
                    >
                      Chấp thuận
                    </Button>
                    <Button
                      variant="outlined" color="error" size="small" startIcon={<CloseIcon />}
                      onClick={() => setResolveDialog({ open: true, id: appeal.id, type: 'REJECTED' })}
                    >
                      Từ chối
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={resolveDialog.open} onClose={() => setResolveDialog({ open: false, id: '', type: 'APPROVED' })} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>
          {resolveDialog.type === 'APPROVED' ? 'Chấp thuận kháng cáo' : 'Từ chối kháng cáo'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Ghi chú (tùy chọn)"
            multiline rows={3} fullWidth sx={{ mt: 1 }}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResolveDialog({ open: false, id: '', type: 'APPROVED' })} color="inherit">Hủy</Button>
          <Button
            variant="contained"
            color={resolveDialog.type === 'APPROVED' ? 'success' : 'error'}
            onClick={handleResolve}
            disabled={submitting}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
