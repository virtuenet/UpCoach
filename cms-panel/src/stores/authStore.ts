import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth'
import toast from 'react-hot-toast'

export interface User {
  id: string
  email: string
  fullName: string
  role: 'coach' | 'content_creator' | 'admin'
  avatarUrl?: string
  bio?: string
  expertise?: string[]
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateProfile: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true })
          const response = await authApi.login(email, password)
          
          if (response.user.role !== 'coach' && response.user.role !== 'content_creator' && response.user.role !== 'admin') {
            throw new Error('Access denied. Coach or content creator privileges required.')
          }

          set({
            user: response.user,
            token: response.token,
            isLoading: false,
          })
          toast.success('Welcome back!')
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Login failed')
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null })
        localStorage.removeItem('cms-auth-storage')
        toast.success('Logged out successfully')
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isLoading: false })
          return
        }

        try {
          set({ isLoading: true })
          const user = await authApi.getProfile(token)
          
          if (user.role !== 'coach' && user.role !== 'content_creator' && user.role !== 'admin') {
            set({ user: null, token: null, isLoading: false })
            return
          }

          set({ user, isLoading: false })
        } catch (error) {
          set({ user: null, token: null, isLoading: false })
        }
      },

      updateProfile: (data: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...data } })
        }
      },
    }),
    {
      name: 'cms-auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
) 