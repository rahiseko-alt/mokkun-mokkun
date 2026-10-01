export interface RectangleColorDef {
  key: string
  bg: string
  border: string
  text: string
}

// 9.3 色 仕様
// 1. 薄い赤 2. 薄い青 3. 薄い黄 4. 薄い緑 5. 薄い紫 6. 薄い橙 7. 薄い水色 8. 薄い桃色
export const RECTANGLE_COLORS: RectangleColorDef[] = [
  { key: '赤', bg: '#fee2e2', border: '#f87171', text: '#991b1b' },
  { key: '青', bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  { key: '黄', bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
  { key: '緑', bg: '#dcfce7', border: '#4ade80', text: '#166534' },
  { key: '紫', bg: '#f3e8ff', border: '#c084fc', text: '#6b21a8' },
  { key: '橙', bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
  { key: '水色', bg: '#e0f2fe', border: '#38bdf8', text: '#075985' },
  { key: '桃色', bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
]

// 20. 初期識別子セット 仕様
export const INITIAL_IDENTIFIER_TOKENS: Record<number, string[]> = {
  1: [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ],
  2: [
    '松', '竹', '梅', '桜', '菊', '桐', '鶴', '亀', '虎', '龍', '琴', '笛'
  ],
  3: [
    '天', '地', '人', '山', '海', '空', '星', '月', '風', '雲', '森', '泉'
  ],
  4: [
    '宙', '光', '影', '虹', '露', '霜', '雪', '雷', '電', '霞', '霧', '雫'
  ]
}

export const MIN_ELEMENT_WIDTH = 40
export const MIN_ELEMENT_HEIGHT = 40

export const MAX_SNAPSHOTS = 3

export const STORAGE_KEY_CURRENT_PROJECT = 'ui_mock_project_state_v1'
export const STORAGE_KEY_SNAPSHOTS = 'ui_mock_snapshots_v1'

export const IDENTIFIER_GUIDE_TEXT =
  '識別子は、声に出して区別しやすい文字・単語を推奨します。同じ読み方の文字や、色・位置・サイズ等のUI属性と混同する単語は避けてください。'

// テキスト要素の文字サイズ (3段階のみ)
export const TEXT_FONT_SIZES = [
  { label: '小', size: 13 },
  { label: '中', size: 18 },
  { label: '大', size: 26 },
] as const
