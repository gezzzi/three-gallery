import { Model, User } from '@/types'

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'yamada_3d',
    displayName: '山田太郎',
    bio: '3Dアーティスト。キャラクターモデリングが得意です。',
    avatarUrl: '',
    isPremium: true,
    followerCount: 1234,
    followingCount: 567,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2', 
    username: 'sato_artist',
    displayName: '佐藤花子',
    bio: '建築系3Dモデルを制作しています。',
    avatarUrl: '',
    isPremium: false,
    followerCount: 890,
    followingCount: 234,
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: '3',
    username: 'tanaka_cg',
    displayName: '田中次郎',
    bio: 'ゲーム用アセット制作。アニメーション付きモデル多数。',
    avatarUrl: '',
    isPremium: true,
    followerCount: 2456,
    followingCount: 123,
    createdAt: '2024-03-01T00:00:00Z'
  }
]

export const mockModels: Model[] = [
  {
    id: '1',
    userId: '1',
    user: mockUsers[0],
    title: 'ファンタジーキャラクター - 騎士',
    description: '中世ファンタジー風の騎士キャラクターです。フルアーマー装備でリグ付き。',
    fileUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    thumbnailUrl: '',
    hasAnimation: true,
    animationDuration: 5.2,
    licenseType: 'CC BY',
    isCommercialOk: true,
    price: 0,
    currency: 'JPY',
    isFree: true,
    viewCount: 15234,
    downloadCount: 3456,
    likeCount: 987,
    status: 'public',
    tags: ['キャラクター', 'ファンタジー', '騎士', 'アニメーション'],
    metadata: {},
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-11-01T10:00:00Z',
    polygonCount: 50000,
    fileSize: 12500000
  },
  {
    id: '2',
    userId: '2',
    user: mockUsers[1],
    title: '近代的なオフィスビル',
    description: '30階建ての近代的なオフィスビル。窓や内装の詳細まで作り込みました。',
    fileUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Sponza/glTF/Sponza.gltf',
    thumbnailUrl: '',
    hasAnimation: false,
    licenseType: 'CC BY-SA',
    isCommercialOk: true,
    price: 2500,
    currency: 'JPY',
    isFree: false,
    viewCount: 8765,
    downloadCount: 432,
    likeCount: 234,
    status: 'public',
    tags: ['建築', 'ビル', '都市', 'リアル'],
    metadata: {},
    createdAt: '2024-10-15T14:30:00Z',
    updatedAt: '2024-10-15T14:30:00Z',
    polygonCount: 120000,
    fileSize: 45000000
  },
  {
    id: '3',
    userId: '3',
    user: mockUsers[2],
    title: 'SFメカ - バトルロボット',
    description: '変形機能付きのバトルロボット。各部パーツが可動します。',
    fileUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb',
    thumbnailUrl: '',
    hasAnimation: true,
    animationDuration: 8.5,
    licenseType: 'CC BY-NC',
    isCommercialOk: false,
    price: 5000,
    currency: 'JPY',
    isFree: false,
    viewCount: 23456,
    downloadCount: 1234,
    likeCount: 2345,
    status: 'public',
    tags: ['メカ', 'ロボット', 'SF', 'アニメーション'],
    metadata: {},
    createdAt: '2024-09-20T09:15:00Z',
    updatedAt: '2024-09-20T09:15:00Z',
    polygonCount: 80000,
    fileSize: 35000000
  },
  {
    id: '4',
    userId: '1',
    user: mockUsers[0],
    title: '魔法の杖コレクション',
    description: '10種類の魔法の杖セット。ゲーム用アイテムとして最適。',
    fileUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    thumbnailUrl: '',
    hasAnimation: false,
    licenseType: 'CC BY',
    isCommercialOk: true,
    price: 0,
    currency: 'JPY',
    isFree: true,
    viewCount: 5678,
    downloadCount: 890,
    likeCount: 456,
    status: 'public',
    tags: ['武器', 'ファンタジー', 'アイテム', 'ローポリ'],
    metadata: {},
    createdAt: '2024-08-10T16:45:00Z',
    updatedAt: '2024-08-10T16:45:00Z',
    polygonCount: 5000,
    fileSize: 2500000
  },
  {
    id: '5',
    userId: '2',
    user: mockUsers[1],
    title: '日本庭園セット',
    description: '石灯籠、橋、池などを含む日本庭園の完全セット。',
    fileUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    thumbnailUrl: '',
    hasAnimation: false,
    licenseType: 'CC BY-SA',
    isCommercialOk: true,
    price: 3500,
    currency: 'JPY',
    isFree: false,
    viewCount: 12345,
    downloadCount: 567,
    likeCount: 789,
    status: 'public',
    tags: ['建築', '日本', '庭園', '自然'],
    metadata: {},
    createdAt: '2024-07-25T11:20:00Z',
    updatedAt: '2024-07-25T11:20:00Z',
    polygonCount: 95000,
    fileSize: 38000000
  },
  {
    id: '6',
    userId: '3',
    user: mockUsers[2],
    title: 'サイバーパンク都市',
    description: 'ネオン輝くサイバーパンク風の都市景観。夜景シーン向け。',
    fileUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
    thumbnailUrl: '',
    hasAnimation: true,
    animationDuration: 12.0,
    licenseType: 'CC BY',
    isCommercialOk: true,
    price: 0,
    currency: 'JPY',
    isFree: true,
    viewCount: 34567,
    downloadCount: 2345,
    likeCount: 3456,
    status: 'public',
    tags: ['都市', 'サイバーパンク', 'SF', '建築'],
    metadata: {},
    createdAt: '2024-06-30T18:00:00Z',
    updatedAt: '2024-06-30T18:00:00Z',
    polygonCount: 250000,
    fileSize: 85000000
  },
  {
    id: '7',
    userId: '1',
    user: mockUsers[0],
    title: '回転するカラフルキューブ',
    description: 'Three.jsで作成したインタラクティブな回転キューブ。マウスで操作可能。',
    fileUrl: '',
    thumbnailUrl: '',
    hasAnimation: true,
    licenseType: 'MIT',
    isCommercialOk: true,
    price: 0,
    currency: 'JPY',
    isFree: true,
    viewCount: 8901,
    downloadCount: 567,
    likeCount: 234,
    status: 'public',
    tags: ['コード', 'Three.js', 'インタラクティブ', 'チュートリアル'],
    metadata: {},
    createdAt: '2024-11-20T10:00:00Z',
    updatedAt: '2024-11-20T10:00:00Z',
    modelType: 'code',
    code: `// 回転するカラフルキューブ
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshPhongMaterial({
  color: 0x00ff00,
  emissive: 0x004400,
  shininess: 100
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 回転アニメーション
let userAnimate = function() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.02;
  
  // 色の変化
  const time = Date.now() * 0.001;
  const r = Math.sin(time) * 0.5 + 0.5;
  const g = Math.sin(time + 2) * 0.5 + 0.5;
  const b = Math.sin(time + 4) * 0.5 + 0.5;
  material.color.setRGB(r, g, b);
};`
  },
  {
    id: '8',
    userId: '2',
    user: mockUsers[1],
    title: 'パーティクルシステム - 星空',
    description: 'Three.jsで実装した美しい星空のパーティクルエフェクト。',
    fileUrl: '',
    thumbnailUrl: '',
    hasAnimation: true,
    licenseType: 'CC BY',
    isCommercialOk: true,
    price: 0,
    currency: 'JPY',
    isFree: true,
    viewCount: 15678,
    downloadCount: 890,
    likeCount: 567,
    status: 'public',
    tags: ['コード', 'Three.js', 'パーティクル', 'エフェクト'],
    metadata: {},
    createdAt: '2024-11-18T14:30:00Z',
    updatedAt: '2024-11-18T14:30:00Z',
    modelType: 'code',
    code: `// パーティクルシステム - 星空
const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 5000;
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
  positions[i] = (Math.random() - 0.5) * 50;
  positions[i + 1] = (Math.random() - 0.5) * 50;
  positions[i + 2] = (Math.random() - 0.5) * 50;
  
  colors[i] = Math.random();
  colors[i + 1] = Math.random();
  colors[i + 2] = Math.random();
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.2,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// アニメーション
let userAnimate = function() {
  particles.rotation.y += 0.001;
  particles.rotation.x += 0.0005;
};`
  },
  {
    id: '9',
    userId: '3',
    user: mockUsers[2],
    title: 'ジェネラティブアート - 波形',
    description: 'Sin波を使った動的な3Dジェネラティブアート。',
    fileUrl: '',
    thumbnailUrl: '',
    hasAnimation: true,
    licenseType: 'MIT',
    isCommercialOk: true,
    price: 1500,
    currency: 'JPY',
    isFree: false,
    viewCount: 9876,
    downloadCount: 234,
    likeCount: 456,
    status: 'public',
    tags: ['コード', 'Three.js', 'ジェネラティブ', 'アート'],
    metadata: {},
    createdAt: '2024-11-15T09:00:00Z',
    updatedAt: '2024-11-15T09:00:00Z',
    modelType: 'code',
    code: `// ジェネラティブアート - 波形
const planeGeometry = new THREE.PlaneGeometry(20, 20, 50, 50);
const planeMaterial = new THREE.MeshPhongMaterial({
  color: 0x00aaff,
  side: THREE.DoubleSide,
  wireframe: false,
  flatShading: true
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

const vertices = planeGeometry.attributes.position.array;
const originalVertices = [...vertices];

// 波のアニメーション
let userAnimate = function() {
  const time = Date.now() * 0.001;
  
  for (let i = 0; i < vertices.length; i += 3) {
    const x = originalVertices[i];
    const y = originalVertices[i + 1];
    
    const wave1 = Math.sin(x * 0.5 + time) * 2;
    const wave2 = Math.sin(y * 0.5 + time * 1.5) * 1;
    
    vertices[i + 2] = wave1 + wave2;
  }
  
  planeGeometry.attributes.position.needsUpdate = true;
  planeGeometry.computeVertexNormals();
};`
  }
]