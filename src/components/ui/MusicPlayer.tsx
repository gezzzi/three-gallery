'use client'

import { useState, useRef, useEffect } from 'react'
import { Pause, Volume2, VolumeX, Music } from 'lucide-react'
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
  const [isHovered, setIsHovered] = useState(false)
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
    <div 
      className={cn(
        "relative inline-block",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
          "flex items-center justify-center w-12 h-12 rounded-full transition-all shadow-lg",
          isLoading || error
            ? "bg-black/50 text-gray-400 cursor-not-allowed"
            : isPlaying
            ? "bg-black/70 text-white hover:bg-black/80"
            : "bg-black/50 text-white hover:bg-black/70"
        )}
        aria-label={isPlaying ? '一時停止' : '再生'}
        title={musicName}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : error ? (
          <Music className="w-6 h-6" />
        ) : isPlaying ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Music className="w-6 h-6" />
        )}
      </button>

      {/* ホバー時に表示される音量コントロール */}
      <div className={cn(
        "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-sm transition-all duration-300",
        isHovered ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"
      )}>
        <button
          onClick={toggleMute}
          className="p-1 rounded hover:bg-white/20 transition-colors"
          aria-label={isMuted ? 'ミュート解除' : 'ミュート'}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider-dark"
          aria-label="音量"
        />
        <span className="text-xs text-white/80 min-w-[30px] text-right">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>

      <style jsx>{`
        .slider-dark::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #ffffff;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider-dark::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #ffffff;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        .slider-dark::-webkit-slider-thumb:hover {
          background: #e5e5e5;
        }
        .slider-dark::-moz-range-thumb:hover {
          background: #e5e5e5;
        }
      `}</style>
    </div>
  )
}