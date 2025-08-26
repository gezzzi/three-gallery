// ローカルストレージから手動でアップロードしたモデルを削除するスクリプト
// デモ作品は残す

const clearLocalModels = () => {
  // ローカルストレージのキーを取得
  const storeKey = 'three-gallery-store'
  const storedData = localStorage.getItem(storeKey)
  
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData)
      
      // modelsを空配列にリセット
      if (parsedData.state && parsedData.state.models) {
        parsedData.state.models = []
        
        // 更新したデータを保存
        localStorage.setItem(storeKey, JSON.stringify(parsedData))
        console.log('ローカルに保存されていたモデルを削除しました')
      }
    } catch (error) {
      console.error('ローカルストレージのパースに失敗しました:', error)
    }
  } else {
    console.log('ローカルストレージにデータがありません')
  }
}

// ブラウザのコンソールで実行するための関数をグローバルに追加
if (typeof window !== 'undefined') {
  (window as unknown as { clearLocalModels: typeof clearLocalModels }).clearLocalModels = clearLocalModels
}

export default clearLocalModels