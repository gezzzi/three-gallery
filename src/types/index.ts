export interface User {
  id: string
  username: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  website?: string
  twitter?: string
  isPremium: boolean
  followerCount: number
  followingCount: number
  createdAt: string
}

export interface Model {
  id: string
  userId: string
  user?: User
  title: string
  description?: string
  fileUrl: string
  previewUrl?: string
  thumbnailUrl?: string
  originalFileUrl?: string
  fileSize?: number
  polygonCount?: number
  hasAnimation: boolean
  animationDuration?: number
  licenseType: string
  isCommercialOk: boolean
  price: number
  currency: string
  isFree: boolean
  viewCount: number
  downloadCount: number
  likeCount: number
  status: 'draft' | 'public' | 'private'
  tags: string[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  modelType?: 'file' | 'code'
  code?: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  usageCount: number
}

export interface Like {
  userId: string
  modelId: string
  createdAt: string
}

export interface Follow {
  followerId: string
  followingId: string
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  modelId: string
  recipientId?: string
  amount: number
  type: 'purchase' | 'tip'
  stripePaymentId?: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}