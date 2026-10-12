import axios from 'axios'

// Configure VITE_API_BASE_URL in Vercel and in local .env files.
// The production fallback is intentional; production code never calls localhost.
const baseURL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://recoverai-backend-klo0.onrender.com'
).replace(/\/+$/, '')

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('recoverai_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    sessionStorage.removeItem('recoverai_token')
    sessionStorage.removeItem('recoverai_user')
    window.dispatchEvent(new Event('recoverai:session-expired'))
  }
  return Promise.reject(error)
})

export default api
