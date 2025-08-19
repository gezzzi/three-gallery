'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MusicPlayerProps {
  musicUrl?: string
  musicName?: string
  autoPlay?: boolean
  className?: string
  onPlay?: () => void
  onPause?: () => void
}

export default function MusicPlayer({
  musicUrl,
  musicName = '無題の曲',
  autoPlay = false,
  className,
  onPlay,
  onPause
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const prevVolumeRef = useRef(0.5)

  // 音楽URLが変更されたら停止して新しい音楽を読み込む
  useEffect(() => {
    console.log('[MusicPlayer] musicUrlが変更されました:', musicUrl)
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      setIsLoading(true)
      setError(null)
      
      if (musicUrl) {
        console.log('[MusicPlayer] 音楽を読み込み中...')
        audioRef.current.load()
      }
    }
  }, [musicUrl])

  // ボリューム設定
  useEffect(() => {
    if (audioRef.current) {
      const newVolume = isMuted ? 0 : volume
      audioRef.current.volume = newVolume
      console.log('[MusicPlayer] ボリュームを設定:', { newVolume, isMuted, volume })
    }
  }, [volume, isMuted])

  // 自動再生
  useEffect(() => {
    if (autoPlay && audioRef.current && musicUrl && !isLoading) {
      audioRef.current.play().catch(err => {
        console.error('自動再生に失敗しました:', err)
      })
    }
  }, [autoPlay, musicUrl, isLoading])

  const handlePlayPause = () => {
    if (!audioRef.current || !musicUrl) {
      console.log('[MusicPlayer] audioRefまたはmusicUrlが存在しません', { audioRef: !!audioRef.current, musicUrl })
      return
    }

    console.log('[MusicPlayer] 再生/一時停止を実行', { 
      isPlaying, 
      volume: audioRef.current.volume,
      muted: audioRef.current.muted,
      src: audioRef.current.src,
      readyState: audioRef.current.readyState,
      paused: audioRef.current.paused
    })

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      onPause?.()
    } else {
      // 再生前に現在のaudioの状態を確認
      console.log('[MusicPlayer] 再生前のaudio要素の状態:', {
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration,
        ended: audioRef.current.ended,
        error: audioRef.current.error,
        networkState: audioRef.current.networkState,
        paused: audioRef.current.paused,
        playbackRate: audioRef.current.playbackRate,
        played: audioRef.current.played,
        readyState: audioRef.current.readyState,
        seekable: audioRef.current.seekable,
        seeking: audioRef.current.seeking,
        src: audioRef.current.src,
        volume: audioRef.current.volume,
        muted: audioRef.current.muted
      })
      
      audioRef.current.play().then(() => {
        console.log('[MusicPlayer] 再生が開始されました')
        console.log('[MusicPlayer] 再生中のaudio要素の状態:', {
          currentTime: audioRef.current?.currentTime,
          paused: audioRef.current?.paused,
          volume: audioRef.current?.volume,
          muted: audioRef.current?.muted
        })
        setIsPlaying(true)
        onPlay?.()
      }).catch(err => {
        console.error('[MusicPlayer] 再生エラー:', err)
        console.error('[MusicPlayer] エラー詳細:', {
          name: err.name,
          message: err.message,
          code: err.code
        })
        setError('音楽の再生に失敗しました')
        setIsPlaying(false)
      })
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(false)
    console.log('[MusicPlayer] ボリューム変更:', {
      newVolume,
      audioVolume: audioRef.current?.volume,
      isPlaying: audioRef.current ? !audioRef.current.paused : false
    })
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolumeRef.current)
      setIsMuted(false)
    } else {
      prevVolumeRef.current = volume
      setIsMuted(true)
    }
  }

  const handleLoadedData = () => {
    console.log('[MusicPlayer] 音楽データの読み込みが完了しました', {
      duration: audioRef.current?.duration,
      volume: audioRef.current?.volume,
      src: audioRef.current?.src
    })
    setIsLoading(false)
    setError(null)
  }

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    console.error('[MusicPlayer] 音楽ファイルの読み込みエラー:', {
      src: audioRef.current?.src,
      error: audioRef.current?.error,
      networkState: audioRef.current?.networkState,
      readyState: audioRef.current?.readyState,
      event: e
    })
    setIsLoading(false)
    setError('音楽ファイルの読み込みに失敗しました')
    setIsPlaying(false)
  }

  if (!musicUrl) {
    return null
  }

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg bg-white/90 backdrop-blur-sm border p-3 shadow-sm",
      className
    )}>
      {/* オーディオ要素 */}
      <audio
        ref={audioRef}
        src={musicUrl}
        loop
        className="music-player-audio"
        onLoadedData={handleLoadedData}
        onError={handleError}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => {
          console.log('[MusicPlayer] onPlayイベント発生 - 実際に再生が開始されました')
          setIsPlaying(true)
        }}
        onPause={() => {
          console.log('[MusicPlayer] onPauseイベント発生 - 実際に一時停止されました')
          setIsPlaying(false)
        }}
      />

      {/* 再生/停止ボタン */}
      <button
        onClick={handlePlayPause}
        disabled={isLoading || !!error}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-all",
          isLoading || error
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : isPlaying
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
        aria-label={isPlaying ? '一時停止' : '再生'}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : error ? (
          <Music className="w-5 h-5" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>

      {/* 曲名 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {musicName}
        </p>
        {error && (
          <p className="text-xs text-red-500 truncate">{error}</p>
        )}
        {isPlaying && !error && (
          <p className="text-xs text-gray-500">再生中...</p>
        )}
      </div>

      {/* ボリュームコントロール */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          aria-label={isMuted ? 'ミュート解除' : 'ミュート'}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-gray-600" />
          ) : (
            <Volume2 className="w-4 h-4 text-gray-600" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          aria-label="音量"
        />
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        .slider::-webkit-slider-thumb:hover {
          background: #2563eb;
        }
        .slider::-moz-range-thumb:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  )
}