'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, User, Heart, Upload, Eye, Info, X, Check, Trash2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Notification } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const notificationIcons = {
  new_follower: User,
  like: Heart,
  new_upload: Upload,
  view_milestone: Eye,
  system: Info,
}

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
  } = useStore()
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 外側クリックで閉じる（通知ボタン自体は除外）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // ドロップダウン内のクリックは無視
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return
      }
      
      // 通知ボタンのクリックは無視（ボタン自体のトグル処理に任せる）
      const notificationButton = document.querySelector('[aria-label="通知"]')
      if (notificationButton && notificationButton.contains(target)) {
        return
      }
      
      // それ以外の外側クリックで閉じる
      onClose()
    }

    if (isOpen) {
      // クリックイベントを少し遅延させて、ボタンのクリックイベントが先に処理されるようにする
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action: 'markAsRead' })
      })

      if (response.ok) {
        markNotificationAsRead(notificationId)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' })
      })

      if (response.ok) {
        markAllNotificationsAsRead()
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        deleteNotification(notificationId)
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // 未読の場合は既読にする
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }

    // リンク先に遷移
    if (notification.data.modelId) {
      window.location.href = `/view/${notification.data.modelId}`
    } else if (notification.data.fromUserId) {
      window.location.href = `/user/${notification.data.fromUserId}`
    }
    
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 rounded-lg bg-gray-800 shadow-xl border border-gray-700 z-50 max-h-[600px] overflow-hidden flex flex-col"
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h3 className="font-semibold text-lg text-gray-100">通知</h3>
        <div className="flex items-center gap-2">
          {unreadNotificationCount > 0 && (
            <>
              <span className="text-sm text-gray-400">
                {unreadNotificationCount}件の未読
              </span>
              <button
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
                className="text-sm text-blue-400 hover:text-blue-500 font-medium disabled:opacity-50"
              >
                すべて既読にする
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 通知リスト */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-600" />
            <p>通知はありません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type]
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-gray-700 cursor-pointer transition-colors relative group",
                    !notification.isRead && "bg-blue-900/20 hover:bg-blue-900/30"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* アイコン */}
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                      notification.type === 'new_follower' && "bg-purple-900/20 text-purple-400",
                      notification.type === 'like' && "bg-red-900/20 text-red-400",
                      notification.type === 'new_upload' && "bg-blue-900/20 text-blue-400",
                      notification.type === 'view_milestone' && "bg-indigo-900/20 text-indigo-400",
                      notification.type === 'system' && "bg-gray-700 text-gray-400"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-100">{notification.title}</p>
                      <p className="text-sm text-gray-400 mt-1 break-words">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ja
                        })}
                      </p>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead(notification.id)
                          }}
                          className="p-1.5 rounded hover:bg-gray-600"
                          title="既読にする"
                        >
                          <Check className="h-4 w-4 text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification.id)
                        }}
                        className="p-1.5 rounded hover:bg-gray-200"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* 未読インジケーター */}
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}