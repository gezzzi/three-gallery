import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          ホームに戻る
        </Link>

        {/* メインコンテンツ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">利用規約</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">最終更新日: 2025年1月20日</p>
          
          <div className="space-y-8 text-gray-700 dark:text-gray-300">
            {/* はじめに */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. はじめに</h2>
              <p className="leading-relaxed">
                この利用規約（以下、「本規約」）は、ThreeGallery（以下、「本サービス」）の利用条件を定めるものです。
                本サービスをご利用いただく際は、本規約に同意したものとみなされます。
              </p>
            </section>

            {/* サービスの利用 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. サービスの利用</h2>
              <div className="space-y-2 pl-4">
                <p>• 本サービスは、3Dコンテンツの共有プラットフォームです</p>
                <p>• ユーザーは自由にコンテンツを閲覧、アップロード、ダウンロードできます</p>
                <p>• 営利・非営利を問わず利用可能です</p>
                <p>• 13歳未満の方はご利用いただけません</p>
              </div>
            </section>

            {/* アカウント */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. アカウント</h2>
              <div className="space-y-2">
                <p className="leading-relaxed">
                  アカウント登録時は、正確な情報を提供してください。
                  アカウントの管理責任はユーザー自身にあります。
                </p>
                <p className="leading-relaxed">
                  不正アクセスや不正利用を発見した場合は、速やかに運営者へご連絡ください。
                </p>
              </div>
            </section>

            {/* コンテンツの投稿 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. コンテンツの投稿</h2>
              <div className="space-y-3">
                <p className="font-medium">投稿可能なコンテンツ：</p>
                <div className="space-y-2 pl-4">
                  <p>• Three.jsコード</p>
                  <p>• 3Dモデルファイル（GLB/GLTF形式）</p>
                  <p>• HTMLファイル（Three.jsを含むもの）</p>
                  <p>• 関連する画像、音楽ファイル</p>
                </div>
                
                <p className="font-medium mt-4">投稿時の注意事項：</p>
                <div className="space-y-2 pl-4">
                  <p>• 他者の著作権を侵害しないこと</p>
                  <p>• 適切なライセンスを設定すること</p>
                  <p>• 正確な情報を記載すること</p>
                </div>
              </div>
            </section>

            {/* 禁止事項 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. 禁止事項</h2>
              <div className="space-y-2 pl-4">
                <p>• 法令に違反する行為</p>
                <p>• 他者の権利を侵害する行為</p>
                <p>• 虚偽の情報を投稿する行為</p>
                <p>• マルウェアや有害なコードを含むコンテンツの投稿</p>
                <p>• スパム行為</p>
                <p>• サービスの運営を妨害する行為</p>
                <p>• 他のユーザーへの嫌がらせや誹謗中傷</p>
                <p>• 成人向けコンテンツの投稿</p>
                <p>• 暴力的または差別的なコンテンツの投稿</p>
              </div>
            </section>

            {/* 知的財産権 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. 知的財産権</h2>
              <div className="space-y-2">
                <p className="leading-relaxed">
                  ユーザーが投稿したコンテンツの著作権は、投稿者に帰属します。
                </p>
                <p className="leading-relaxed">
                  投稿時に設定されたライセンスに従い、他のユーザーはコンテンツを利用できます。
                </p>
                <p className="leading-relaxed">
                  本サービスのロゴ、デザイン、システムの著作権は運営者に帰属します。
                </p>
              </div>
            </section>

            {/* 免責事項 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">7. 免責事項</h2>
              <div className="space-y-2">
                <p className="leading-relaxed">
                  本サービスは「現状のまま」提供され、いかなる保証も行いません。
                </p>
                <p className="leading-relaxed">
                  ユーザー間のトラブルについて、運営者は責任を負いません。
                </p>
                <p className="leading-relaxed">
                  コンテンツのダウンロード・利用による損害について、運営者は責任を負いません。
                </p>
                <p className="leading-relaxed">
                  サービスの中断、停止、仕様変更について、事前の通知なく行う場合があります。
                </p>
              </div>
            </section>

            {/* プライバシー */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">8. プライバシー</h2>
              <p className="leading-relaxed">
                個人情報の取り扱いについては、
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline mx-1">
                  プライバシーポリシー
                </Link>
                をご確認ください。
              </p>
            </section>

            {/* 規約の変更 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">9. 規約の変更</h2>
              <p className="leading-relaxed">
                本規約は、必要に応じて変更することがあります。
                重要な変更がある場合は、サービス内でお知らせします。
              </p>
            </section>

            {/* 準拠法 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">10. 準拠法</h2>
              <p className="leading-relaxed">
                本規約は、日本法に準拠し、解釈されるものとします。
              </p>
            </section>

            {/* お問い合わせ */}
            <section className="space-y-3 border-t pt-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">お問い合わせ</h2>
              <p className="leading-relaxed">
                本規約に関するお問い合わせは、
                <a 
                  href="https://x.com/sakumonbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline mx-1"
                >
                  X（旧Twitter）
                </a>
                からお願いいたします。
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}