import { useState } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import { walletApi } from '@/api/wallet.api'
import { formatCurrency, formatDate } from '@/utils/format'
import type { CompanyWallet } from '@/types'
import PageHeader from '@/components/common/PageHeader'

export default function AdminWalletsPage() {
  const [companyId, setCompanyId] = useState('')
  const [wallet, setWallet] = useState<CompanyWallet | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async () => {
    if (!companyId.trim()) {
      setError('Vui lòng nhập companyId')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await walletApi.getByCompanyAdmin(companyId.trim())
      setWallet(data)
    } catch (err: any) {
      setWallet(null)
      setError(err?.response?.data?.message || 'Không tìm thấy ví công ty')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <PageHeader title="Tra cứu ví công ty" subtitle="Dùng API admin để xem thông tin ví theo companyId" />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
            <TextField
              label="Company ID"
              size="small"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { xs: 0, sm: 360 } }}
            />
            <Button variant="contained" onClick={handleLookup} disabled={loading}>
              {loading ? 'Đang tra cứu...' : 'Tra cứu'}
            </Button>
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>

      {wallet && (
        <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 520 }}>
            <TableHead>
              <TableRow>
                <TableCell>Trường</TableCell>
                <TableCell>Giá trị</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow><TableCell>Wallet ID</TableCell><TableCell>{wallet.id}</TableCell></TableRow>
              <TableRow><TableCell>Company ID</TableCell><TableCell>{wallet.companyId}</TableCell></TableRow>
              <TableRow><TableCell>Số dư</TableCell><TableCell>{formatCurrency(wallet.balance)}</TableCell></TableRow>
              <TableRow><TableCell>Tổng doanh thu</TableCell><TableCell>{formatCurrency(wallet.totalEarned)}</TableCell></TableRow>
              <TableRow><TableCell>Tổng rút</TableCell><TableCell>{formatCurrency(wallet.totalWithdrawn)}</TableCell></TableRow>
              <TableRow><TableCell>Ngân hàng</TableCell><TableCell>{wallet.bankName || '—'}</TableCell></TableRow>
              <TableRow><TableCell>Số tài khoản</TableCell><TableCell>{wallet.bankAccountNumber || '—'}</TableCell></TableRow>
              <TableRow><TableCell>Chủ tài khoản</TableCell><TableCell>{wallet.bankAccountHolder || '—'}</TableCell></TableRow>
              <TableRow><TableCell>Cập nhật</TableCell><TableCell>{formatDate(wallet.updatedAt)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
