import { useState, useEffect } from 'react'
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Chip, IconButton, Tooltip, TextField, InputAdornment, CircularProgress,
} from '@mui/material'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SearchIcon from '@mui/icons-material/Search'
import { userService } from '@/services'
import { formatDate } from '@/utils/format'
import type { User } from '@/types'
import PageHeader from '@/components/common/PageHeader'

const roleLabel: Record<string, string> = { CUSTOMER: 'Khách hàng', DRIVER: 'Tài xế', TRANSPORT_COMPANY: 'Công ty', ADMIN: 'Admin' }
const roleColor: Record<string, any> = { CUSTOMER: 'default', DRIVER: 'primary', TRANSPORT_COMPANY: 'info', ADMIN: 'error' }
const statusColor: Record<string, any> = { ACTIVE: 'success', INACTIVE: 'warning', BANNED: 'error', SUSPENDED: 'default' }
const statusLabel: Record<string, string> = { ACTIVE: 'Hoạt động', INACTIVE: 'Chưa xác nhận', BANNED: 'Đã ban', SUSPENDED: 'Tạm hoãn' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userService.getAll().then((data) => {
      setUsers(data)
      setFiltered(data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(users.filter((u) =>
      u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    ))
  }, [search, users])

  const handleBan = async (id: string) => {
    await userService.ban(id)
    setUsers(users.map((u) => u.id === id ? { ...u, status: 'BANNED' } : u))
  }

  const handleUnban = async (id: string) => {
    await userService.unban(id)
    setUsers(users.map((u) => u.id === id ? { ...u, status: 'ACTIVE' } : u))
  }

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <PageHeader title="Người dùng" subtitle={`${users.length} tài khoản`} />

      <TextField
        placeholder="Tìm theo tên, email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2, width: { xs: '100%', sm: 320 } }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />

      <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>Người dùng</TableCell>
              <TableCell>Vai trò</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Typography fontWeight={500} fontSize={14}>{u.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                </TableCell>
                <TableCell><Chip label={roleLabel[u.role]} color={roleColor[u.role]} size="small" /></TableCell>
                <TableCell>{formatDate(u.createdAt)}</TableCell>
                <TableCell><Chip label={statusLabel[u.status]} color={statusColor[u.status]} size="small" /></TableCell>
                <TableCell align="center">
                  {u.role !== 'ADMIN' && (
                    u.status === 'BANNED' ? (
                      <Tooltip title="Gỡ ban">
                        <IconButton size="small" color="success" onClick={() => handleUnban(u.id)}>
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Ban">
                        <IconButton size="small" color="error" onClick={() => handleBan(u.id)}>
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
