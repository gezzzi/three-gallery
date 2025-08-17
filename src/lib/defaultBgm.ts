// デフォルトBGMのリスト
export interface DefaultBGM {
  id: string
  name: string
  url: string
  genre: string
  description?: string
}

export const defaultBGMs: DefaultBGM[] = [
  {
    id: 'ambient-1',
    name: 'Ambient Space',
    url: '/bgm/ambient-space.mp3',
    genre: 'アンビエント',
    description: '宇宙的で静かな雰囲気のBGM'
  },
  {
    id: 'electronic-1',
    name: 'Digital Dreams',
    url: '/bgm/digital-dreams.mp3',
    genre: 'エレクトロニック',
    description: 'デジタルアートに最適なBGM'
  },
  {
    id: 'chill-1',
    name: 'Chill Vibes',
    url: '/bgm/chill-vibes.mp3',
    genre: 'チル',
    description: 'リラックスした雰囲気のBGM'
  },
  {
    id: 'upbeat-1',
    name: 'Creative Energy',
    url: '/bgm/creative-energy.mp3',
    genre: 'アップビート',
    description: '創造的でエネルギッシュなBGM'
  },
  {
    id: 'cinematic-1',
    name: 'Epic Journey',
    url: '/bgm/epic-journey.mp3',
    genre: 'シネマティック',
    description: '壮大で映画的なBGM'
  },
  {
    id: 'lofi-1',
    name: 'Lo-Fi Study',
    url: '/bgm/lofi-study.mp3',
    genre: 'Lo-Fi',
    description: '落ち着いた雰囲気のLo-Fi BGM'
  }
]

export const getDefaultBGM = (id: string): DefaultBGM | undefined => {
  return defaultBGMs.find(bgm => bgm.id === id)
}

export const getDefaultBGMByGenre = (genre: string): DefaultBGM[] => {
  return defaultBGMs.filter(bgm => bgm.genre === genre)
}