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
  
  // ブックマーク
  bookmarkedModels: string[]
  addBookmark: (modelId: string) => void
  removeBookmark: (modelId: string) => void
  clearBookmarks: () => void
  
  // いいね
  likedModels: string[]
  addLike: (modelId: string) => void
  removeLike: (modelId: string) => void
  clearLikes: () => void
  
  // フォロー
  followingUsers: string[]
  addFollowing: (userId: string) => void
  removeFollowing: (userId: string) => void
  clearFollowing: () => void
  
  // 購入済み商品
  purchasedModels: string[]
  addPurchase: (modelId: string) => void
  removePurchase: (modelId: string) => void
  clearPurchases: () => void
  
  // 閲覧履歴
  viewHistory: { modelId: string; viewedAt: string }[]
  addToHistory: (modelId: string) => void
  clearHistory: () => void
  
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
      
      // ブックマーク
      bookmarkedModels: [],
      addBookmark: (modelId) => set((state) => ({
        bookmarkedModels: [...state.bookmarkedModels, modelId]
      })),
      removeBookmark: (modelId) => set((state) => ({
        bookmarkedModels: state.bookmarkedModels.filter((id) => id !== modelId)
      })),
      clearBookmarks: () => set({ bookmarkedModels: [] }),
      
      // いいね
      likedModels: [],
      addLike: (modelId) => set((state) => ({
        likedModels: [...state.likedModels, modelId]
      })),
      removeLike: (modelId) => set((state) => ({
        likedModels: state.likedModels.filter((id) => id !== modelId)
      })),
      clearLikes: () => set({ likedModels: [] }),
      
      // フォロー
      followingUsers: [],
      addFollowing: (userId) => set((state) => ({
        followingUsers: [...state.followingUsers, userId]
      })),
      removeFollowing: (userId) => set((state) => ({
        followingUsers: state.followingUsers.filter((id) => id !== userId)
      })),
      clearFollowing: () => set({ followingUsers: [] }),
      
      // 購入済み商品
      purchasedModels: [],
      addPurchase: (modelId) => set((state) => ({
        purchasedModels: [...state.purchasedModels, modelId]
      })),
      removePurchase: (modelId) => set((state) => ({
        purchasedModels: state.purchasedModels.filter((id) => id !== modelId)
      })),
      clearPurchases: () => set({ purchasedModels: [] }),
      
      // 閲覧履歴
      viewHistory: [],
      addToHistory: (modelId) => set((state) => {
        // 既存の履歴から同じモデルを削除（最新を上に持ってくるため）
        const filteredHistory = state.viewHistory.filter(item => item.modelId !== modelId)
        // 新しい履歴を先頭に追加（最大50件まで保持）
        const newHistory = [
          { modelId, viewedAt: new Date().toISOString() },
          ...filteredHistory
        ].slice(0, 50)
        return { viewHistory: newHistory }
      }),
      clearHistory: () => set({ viewHistory: [] }),
      
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
        isSidebarOpen: state.isSidebarOpen,
        models: state.models, // モデルも永続化
        bookmarkedModels: state.bookmarkedModels, // ブックマークも永続化
        likedModels: state.likedModels, // いいねも永続化
        followingUsers: state.followingUsers, // フォローも永続化
        purchasedModels: state.purchasedModels, // 購入済みも永続化
        viewHistory: state.viewHistory // 閲覧履歴も永続化
      })
    }
  )
)