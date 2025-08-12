# Three Gallery - 3Dモデル共有プラットフォーム

3Dモデルを投稿・共有・販売できるウェブアプリケーションです。

## 機能

- 🎨 3Dモデルのアップロード・閲覧
- 🔍 検索・フィルタリング機能
- 💰 Stripeを使った決済機能
- 👤 ユーザープロフィール
- 💬 コメント機能
- ❤️ いいね・フォロー機能

## 技術スタック

- **Frontend**: Next.js 15, React 18, TypeScript
- **3D**: Three.js, React Three Fiber
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Payment**: Stripe
- **Deployment**: Vercel

## セットアップ

### 1. 環境変数の設定

`.env.local.example`を`.env.local`にコピーして、必要な環境変数を設定してください：

```bash
cp .env.local.example .env.local
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
