import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          ホームに戻る
        </Link>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-2">プライバシーポリシー</h1>
          <p className="text-sm text-gray-600 mb-8">最終更新日: 2025年1月20日</p>
          
          <div className="space-y-8 text-gray-700">
            {/* はじめに */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">1. はじめに</h2>
              <p className="leading-relaxed">
                ThreeGallery（以下、「本サービス」）は、ユーザーのプライバシーを重視し、
                個人情報の保護に努めています。このプライバシーポリシーは、
                本サービスがどのような情報を収集し、どのように利用するかを説明するものです。
              </p>
            </section>

            {/* 収集する情報 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">2. 収集する情報</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">2.1 アカウント情報</h3>
                  <div className="space-y-1 pl-4">
                    <p>• メールアドレス</p>
                    <p>• ユーザー名</p>
                    <p>• プロフィール情報（任意）</p>
                    <p>• Googleアカウント情報（OAuth認証利用時）</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">2.2 コンテンツ情報</h3>
                  <div className="space-y-1 pl-4">
                    <p>• アップロードした3Dモデル、コード</p>
                    <p>• 作品のタイトル、説明、タグ</p>
                    <p>• いいね、ブックマーク、フォロー情報</p>
                    <p>• コメント</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">2.3 利用情報</h3>
                  <div className="space-y-1 pl-4">
                    <p>• アクセスログ</p>
                    <p>• IPアドレス</p>
                    <p>• ブラウザ情報</p>
                    <p>• 閲覧履歴</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 情報の利用目的 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">3. 情報の利用目的</h2>
              <p className="leading-relaxed mb-3">
                収集した情報は、以下の目的で利用します：
              </p>
              <div className="space-y-1 pl-4">
                <p>• サービスの提供・運営</p>
                <p>• ユーザー認証</p>
                <p>• コンテンツの管理・表示</p>
                <p>• サービスの改善・新機能の開発</p>
                <p>• 利用統計の作成（個人を特定しない形で）</p>
                <p>• 不正利用の防止</p>
                <p>• お問い合わせへの対応</p>
                <p>• 重要なお知らせの通知</p>
              </div>
            </section>

            {/* 情報の共有 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">4. 情報の共有</h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  以下の場合を除き、ユーザーの個人情報を第三者と共有することはありません：
                </p>
                <div className="space-y-1 pl-4">
                  <p>• ユーザーの同意がある場合</p>
                  <p>• 法令に基づく開示請求があった場合</p>
                  <p>• 利用規約違反への対処が必要な場合</p>
                  <p>• 人の生命、身体または財産の保護のために必要な場合</p>
                </div>
                
                <p className="leading-relaxed mt-4">
                  公開設定されたコンテンツ（作品、プロフィール等）は、
                  他のユーザーや検索エンジンからアクセス可能になります。
                </p>
              </div>
            </section>

            {/* データの保管 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">5. データの保管</h2>
              <div className="space-y-2">
                <p className="leading-relaxed">
                  ユーザーデータは、Supabase（クラウドサービス）に保管されます。
                </p>
                <p className="leading-relaxed">
                  適切なセキュリティ対策を実施し、不正アクセスや情報漏洩の防止に努めています。
                </p>
                <p className="leading-relaxed">
                  アカウント削除時は、関連するデータも削除されます（法令で保管が必要な場合を除く）。
                </p>
              </div>
            </section>

            {/* Cookie */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">6. Cookie（クッキー）</h2>
              <div className="space-y-2">
                <p className="leading-relaxed">
                  本サービスでは、以下の目的でCookieを使用します：
                </p>
                <div className="space-y-1 pl-4">
                  <p>• ログイン状態の維持</p>
                  <p>• ユーザー設定の保存</p>
                  <p>• サービスの利用状況の分析</p>
                </div>
                <p className="leading-relaxed mt-3">
                  ブラウザの設定でCookieを無効にすることができますが、
                  一部の機能が利用できなくなる場合があります。
                </p>
              </div>
            </section>

            {/* 外部サービス */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">7. 外部サービス</h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  本サービスでは、以下の外部サービスを利用しています：
                </p>
                <div className="space-y-2 pl-4">
                  <div>
                    <p className="font-medium">Google OAuth</p>
                    <p className="text-sm">認証サービス（Googleアカウントでのログイン）</p>
                  </div>
                  <div>
                    <p className="font-medium">Supabase</p>
                    <p className="text-sm">データベース・認証・ストレージサービス</p>
                  </div>
                </div>
                <p className="leading-relaxed mt-3">
                  各サービスのプライバシーポリシーもご確認ください。
                </p>
              </div>
            </section>

            {/* 子供のプライバシー */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">8. 子供のプライバシー</h2>
              <p className="leading-relaxed">
                本サービスは13歳未満の方の利用を想定していません。
                13歳未満の方は、保護者の同意なく個人情報を提供しないでください。
              </p>
            </section>

            {/* ユーザーの権利 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">9. ユーザーの権利</h2>
              <p className="leading-relaxed mb-3">
                ユーザーは以下の権利を有します：
              </p>
              <div className="space-y-1 pl-4">
                <p>• 自身の個人情報へのアクセス</p>
                <p>• 個人情報の修正・更新</p>
                <p>• アカウントの削除</p>
                <p>• データのエクスポート</p>
              </div>
              <p className="leading-relaxed mt-3">
                これらの権利行使については、お問い合わせください。
              </p>
            </section>

            {/* 国際的な利用 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">10. 国際的な利用</h2>
              <p className="leading-relaxed">
                本サービスはグローバルに提供されています。
                異なる国や地域からアクセスする場合、その地域の法令に従う責任はユーザーにあります。
              </p>
            </section>

            {/* ポリシーの変更 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">11. ポリシーの変更</h2>
              <p className="leading-relaxed">
                このプライバシーポリシーは、必要に応じて変更することがあります。
                重要な変更がある場合は、サービス内でお知らせします。
              </p>
            </section>

            {/* お問い合わせ */}
            <section className="space-y-3 border-t pt-8">
              <h2 className="text-xl font-semibold text-gray-900">お問い合わせ</h2>
              <p className="leading-relaxed">
                プライバシーに関するお問い合わせは、
                <a 
                  href="https://x.com/sakumonbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline mx-1"
                >
                  X（旧Twitter）
                </a>
                からお願いいたします。
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  運営者: sakumonbot<br />
                  サービス名: ThreeGallery
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}