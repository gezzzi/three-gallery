// 通知生成のユーティリティ関数

interface NotificationData {
  fromUserId?: string
  fromUserName?: string
  modelId?: string
  modelTitle?: string
  milestone?: number
  currentViews?: number
  [key: string]: unknown
}

// フォロー時の通知を作成
export async function createFollowNotification(
  followingId: string,
  followerId: string,
  followerName: string
) {
  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: followingId,
        type: 'new_follower',
        title: '新しいフォロワー',
        message: `${followerName}さんがあなたをフォローしました`,
        data: {
          fromUserId: followerId,
          fromUserName: followerName
        }
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error creating follow notification:', error)
    return false
  }
}

// いいね時の通知を作成
export async function createLikeNotification(
  modelOwnerId: string,
  likerId: string,
  likerName: string,
  modelId: string,
  modelTitle: string
) {
  // 自分の作品へのいいねは通知しない
  if (modelOwnerId === likerId) return true

  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: modelOwnerId,
        type: 'like',
        title: '作品にいいね',
        message: `${likerName}さんが「${modelTitle}」にいいねしました`,
        data: {
          fromUserId: likerId,
          fromUserName: likerName,
          modelId,
          modelTitle
        }
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error creating like notification:', error)
    return false
  }
}

// ブックマーク時の通知を作成
export async function createBookmarkNotification(
  modelOwnerId: string,
  bookmarkerId: string,
  bookmarkerName: string,
  modelId: string,
  modelTitle: string
) {
  // 自分の作品へのブックマークは通知しない
  if (modelOwnerId === bookmarkerId) return true

  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: modelOwnerId,
        type: 'bookmark',
        title: '作品がブックマークされました',
        message: `${bookmarkerName}さんが「${modelTitle}」をブックマークしました`,
        data: {
          fromUserId: bookmarkerId,
          fromUserName: bookmarkerName,
          modelId,
          modelTitle
        }
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error creating bookmark notification:', error)
    return false
  }
}

// ダウンロード時の通知を作成
export async function createDownloadNotification(
  modelOwnerId: string,
  downloaderId: string,
  downloaderName: string,
  modelId: string,
  modelTitle: string
) {
  // 自分の作品のダウンロードは通知しない
  if (modelOwnerId === downloaderId) return true

  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: modelOwnerId,
        type: 'download',
        title: '作品がダウンロードされました',
        message: `${downloaderName}さんが「${modelTitle}」をダウンロードしました`,
        data: {
          fromUserId: downloaderId,
          fromUserName: downloaderName,
          modelId,
          modelTitle
        }
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error creating download notification:', error)
    return false
  }
}

// 新作アップロード時の通知を作成（フォロワー全員に）
export async function createUploadNotification(
  uploaderId: string,
  uploaderName: string,
  modelId: string,
  modelTitle: string,
  followerIds: string[]
) {
  try {
    const promises = followerIds.map(followerId =>
      fetch('/api/notifications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: followerId,
          type: 'new_upload',
          title: 'フォロー中のユーザーが新作をアップロード',
          message: `${uploaderName}さんが新作「${modelTitle}」をアップロードしました`,
          data: {
            fromUserId: uploaderId,
            fromUserName: uploaderName,
            modelId,
            modelTitle
          }
        })
      })
    )
    
    await Promise.all(promises)
    return true
  } catch (error) {
    console.error('Error creating upload notifications:', error)
    return false
  }
}

// 閲覧数マイルストーン通知を作成
// マイルストーン: 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 5000, 10000
export async function createViewMilestoneNotification(
  modelOwnerId: string,
  modelId: string,
  modelTitle: string,
  milestone: number,
  currentViews: number
) {
  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: modelOwnerId,
        type: 'view_milestone',
        title: '閲覧数達成',
        message: `「${modelTitle}」が${milestone}回閲覧されました！`,
        data: {
          modelId,
          modelTitle,
          milestone,
          currentViews
        }
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error creating view milestone notification:', error)
    return false
  }
}

// システム通知を作成
export async function createSystemNotification(
  userId: string,
  title: string,
  message: string,
  data: NotificationData = {}
) {
  try {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: 'system',
        title,
        message,
        data
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Error creating system notification:', error)
    return false
  }
}