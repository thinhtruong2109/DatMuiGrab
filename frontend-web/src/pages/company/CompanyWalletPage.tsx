import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Divider, Grid,
} from '@mui/material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import { walletApi } from '@/api/wallet.api'
import { formatCurrency, formatDate } from '@/utils/format'
import type { CompanyWallet, WalletTransaction } from '@/types'
import PageHeader from '@/components/common/PageHeader'

export default function CompanyWalletPage() {
  const [wallet, setWallet] = useState<CompanyWallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [bankForm, setBankForm] = useState({ bankName: '', bankAccountNumber: '', bankAccountHolder: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([walletApi.getMyWallet(), walletApi.getTransactions()])
      .then(([w, t]) => { setWallet(w); setTransactions(t) })
      .finally(() => setLoading(false))
  }, [])

  const handleWithdraw = async () => {
    setSubmitting(true)
    setError('')
    try {
      await walletApi.withdraw(Number(amount))
      const w = await walletApi.getMyWallet()
      setWallet(w)
      setWithdrawOpen(false)
      setAmount('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Rút tiền thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateBank = async () => {
    setSubmitting(true)
    try {
      const w = await walletApi.updateBankInfo(bankForm)
      setWallet(w)
      setBankOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <PageHeader title="Ví & Doanh thu" />

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} gap={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">
                    Số dư hiện tại
                  </Typography>
                  <Typography variant="h3" fontWeight={800} color="primary.main" mt={0.5}>
                    {formatCurrency(wallet?.balance || 0)}
                  </Typography>
                  <Box display="flex" gap={3} mt={2} flexWrap="wrap">
                    <Box>
                      <Typography variant="caption" color="text.secondary">Tổng đã nhận</Typography>
                      <Typography fontWeight={600}>{formatCurrency(wallet?.totalEarned || 0)}</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Đã rút</Typography>
                      <Typography fontWeight={600}>{formatCurrency(wallet?.totalWithdrawn || 0)}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button variant="outlined" size="small" startIcon={<AccountBalanceIcon />}
                    onClick={() => setBankOpen(true)}>
                    Ngân hàng
                  </Button>
                  <Button variant="contained" size="small" startIcon={<AccountBalanceWalletIcon />}
                    onClick={() => setWithdrawOpen(true)}>
                    Rút tiền
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">
                Thông tin ngân hàng
              </Typography>
              {wallet?.bankName ? (
                <Box mt={1.5}>
                  <Typography fontWeight={600}>{wallet.bankName}</Typography>
                  <Typography fontSize={14}>{wallet.bankAccountNumber}</Typography>
                  <Typography variant="body2" color="text.secondary">{wallet.bankAccountHolder}</Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" mt={1}>Chưa cập nhật</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transaction history */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box px={{ xs: 2, md: 3 }} py={2} borderBottom="1px solid" borderColor="divider">
            <Typography fontWeight={600}>Lịch sử giao dịch</Typography>
          </Box>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Mô tả</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell align="right">Số tiền</TableCell>
                  <TableCell align="right">Số dư sau</TableCell>
                  <TableCell>Ngày</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.type === 'REVENUE' ? 'Doanh thu' : 'Rút tiền'}
                        color={tx.type === 'REVENUE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        fontWeight={600}
                        color={tx.type === 'REVENUE' ? 'success.main' : 'text.primary'}
                      >
                        {tx.type === 'REVENUE' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(tx.balanceAfter)}</TableCell>
                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Withdraw dialog */}
      <Dialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Rút tiền</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <Typography variant="body2" color="text.secondary" mb={2}>
            Số dư khả dụng: <strong>{formatCurrency(wallet?.balance || 0)}</strong>
          </Typography>
          <TextField label="Số tiền (VND)" fullWidth type="number" value={amount}
            onChange={(e) => setAmount(e.target.value)} helperText="Tối thiểu 10.000đ" />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWithdrawOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" onClick={handleWithdraw} disabled={submitting}>Xác nhận rút</Button>
        </DialogActions>
      </Dialog>

      {/* Bank info dialog */}
      <Dialog open={bankOpen} onClose={() => setBankOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Thông tin ngân hàng</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Tên ngân hàng" fullWidth value={bankForm.bankName}
              onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} />
            <TextField label="Số tài khoản" fullWidth value={bankForm.bankAccountNumber}
              onChange={(e) => setBankForm({ ...bankForm, bankAccountNumber: e.target.value })} />
            <TextField label="Tên chủ tài khoản" fullWidth value={bankForm.bankAccountHolder}
              onChange={(e) => setBankForm({ ...bankForm, bankAccountHolder: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBankOpen(false)} color="inherit">Hủy</Button>
          <Button variant="contained" onClick={handleUpdateBank} disabled={submitting}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
