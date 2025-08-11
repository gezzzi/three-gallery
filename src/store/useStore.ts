import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Model, User } from '@/types'

interface StoreState {
  // ユーザー関連
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  
  // モデル関連
  models: Model[]
  setModels: (models: Model[]) => void
  addModel: (model: Model) => void
  updateModel: (id: string, updates: Partial<Model>) => void
  deleteModel: (id: string) => void
  
  // UI状態
  isSidebarOpen: boolean
  toggleSidebar: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedTags: string[]
  toggleTag: (tag: string) => void
  clearTags: () => void
  
  // フィルタ
  filters: {
    hasAnimation?: boolean
    licenseType?: string
    priceRange?: [number, number]
    sortBy?: 'newest' | 'popular' | 'trending' | 'mostDownloaded'
  }
  setFilter: (key: string, value: unknown) => void
  clearFilters: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // ユーザー関連
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      
      // モデル関連
      models: [],
      setModels: (models) => set({ models }),
      addModel: (model) => set((state) => ({ models: [...state.models, model] })),
      updateModel: (id, updates) => set((state) => ({
        models: state.models.map((m) => (m.id === id ? { ...m, ...updates } : m))
      })),
      deleteModel: (id) => set((state) => ({
        models: state.models.filter((m) => m.id !== id)
      })),
      
      // UI状態
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      selectedTags: [],
      toggleTag: (tag) => set((state) => ({
        selectedTags: state.selectedTags.includes(tag)
          ? state.selectedTags.filter((t) => t !== tag)
          : [...state.selectedTags, tag]
      })),
      clearTags: () => set({ selectedTags: [] }),
      
      // フィルタ
      filters: {},
      setFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
      })),
      clearFilters: () => set({ filters: {} })
    }),
    {
      name: 'three-gallery-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isSidebarOpen: state.isSidebarOpen
      })
    }
  )
)