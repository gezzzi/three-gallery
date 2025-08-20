import Link from 'next/link'
import { Twitter, ArrowLeft } from 'lucide-react'

export default function AboutPage() {
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
          <h1 className="text-3xl font-bold mb-8">運営者について</h1>
          
          <div className="space-y-6">
            {/* 運営者情報 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">運営者</h2>
              </div>
              <p className="text-lg">sakumonbot</p>
            </section>

            {/* 連絡先 */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">連絡先</h2>
              <div className="flex items-center gap-3">
                <Twitter className="h-5 w-5 text-gray-600" />
                <a 
                  href="https://x.com/sakumonbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  @sakumonbot
                </a>
              </div>
            </section>

            {/* メッセージ */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">メッセージ</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 leading-relaxed">
                  個人で開発・運営しています。<br />
                  お問い合わせやご連絡は、X（旧Twitter）からお願いいたします。
                </p>
              </div>
            </section>

            {/* サービスについて */}
            <section className="space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold">ThreeGalleryについて</h2>
              <p className="text-gray-700 leading-relaxed">
                ThreeGalleryは、3Dコンテンツを自由に共有できるプラットフォームです。
                Three.jsで作成した作品、3Dモデル、インタラクティブなWebコンテンツを
                世界中のクリエイターと共有し、インスピレーションを得ることができます。
              </p>
            </section>

            {/* 技術スタック */}
            <section className="space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold">使用技術</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded px-3 py-2 text-sm">Next.js</div>
                <div className="bg-gray-50 rounded px-3 py-2 text-sm">React</div>
                <div className="bg-gray-50 rounded px-3 py-2 text-sm">TypeScript</div>
                <div className="bg-gray-50 rounded px-3 py-2 text-sm">Three.js</div>
                <div className="bg-gray-50 rounded px-3 py-2 text-sm">Tailwind CSS</div>
                <div className="bg-gray-50 rounded px-3 py-2 text-sm">Supabase</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}