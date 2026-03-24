import axios from 'axios'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api'
const apiBaseUrlNoTrailingSlash = apiBaseUrl.replace(/\/$/, '')
const normalizedApiBaseUrl = /\/api$/i.test(apiBaseUrlNoTrailingSlash)
  ? apiBaseUrlNoTrailingSlash
  : `${apiBaseUrlNoTrailingSlash}/api`

const axiosInstance = axios.create({
  baseURL: normalizedApiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { data } = await axios.post(`${normalizedApiBaseUrl}/auth/refresh-token`, { refreshToken })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return axiosInstance(original)
      } catch {
        localStorage.clear()
        window.location.href = `${import.meta.env.BASE_URL}login`
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
