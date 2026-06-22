import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import Loader from '../common/Loader'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleOAuthCallback } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refreshToken')
    const userData = searchParams.get('user')
    const error = searchParams.get('error')

    window.history.replaceState(null, '', '/auth/callback')

    if (error) {
      if (error === 'google_not_configured' || error === 'github_not_configured') {
        toast.error(`${error.split('_')[0]} OAuth is not configured. Contact the administrator.`)
      } else {
        toast.error('Authentication failed. Please try again.')
      }
      navigate('/login', { replace: true })
      return
    }

    if (token && refreshToken) {
      handleOAuthCallback(token, refreshToken, userData)
      navigate('/', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, handleOAuthCallback])

  return <Loader fullScreen />
}
