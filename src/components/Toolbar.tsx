import React, { useRef } from 'react'
import { Square, Image as ImageIcon, MousePointerClick, Trash2, ArrowUpRight } from 'lucide-react'
import { CanvasElement, ButtonElement, RectangleElement, ImageElement } from '../types'

interface ToolbarProps {
  onAddRectangle: () => void
  onAddImage: (file: File) => void
  onAddButton: () => void
  selectedElement: CanvasElement | null
  onDeleteSelected: () => void
  onUpdateButtonLabel?: (label: string) => void
  onTriggerButtonAction?: (button: ButtonElement) => void
  targetPagePath?: string | null
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddRectangle,
  onAddImage,
  onAddButton,
  selectedElement,
  onDeleteSelected,
  onUpdateButtonLabel,
  onTriggerButtonAction,
  targetPagePath,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onAddImage(file)
    }
    e.target.value = ''
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        minHeight: '52px',
        height: 'auto',
        zIndex: 40,
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      {/* 要素追加ツール */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onAddRectangle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1e293b',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
          }}
        >
          <Square size={14} color="#3b82f6" />
          <span>四角</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1e293b',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
          }}
        >
          <ImageIcon size={14} color="#10b981" />
          <span>画像</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <button
          onClick={onAddButton}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1e293b',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
          }}
        >
          <MousePointerClick size={14} color="#8b5cf6" />
          <span>ボタン</span>
        </button>
      </div>

      {/* 選択要素の操作プロパティ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {selectedElement ? (
          <>
            {/* 四角の場合: 色名称の表示 */}
            {selectedElement.type === 'rectangle' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: (selectedElement as RectangleElement).colorHex,
                    color: (selectedElement as RectangleElement).textColor,
                    border: `1px solid ${(selectedElement as RectangleElement).borderColor}`,
                    fontWeight: 700,
                  }}
                >
                  {(selectedElement as RectangleElement).colorKey} の四角
                </span>
              </div>
            )}

            {/* 画像の場合 */}
            {selectedElement.type === 'image' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  画像 ({(selectedElement as ImageElement).fileName || '参考画像'})
                </span>
              </div>
            )}

            {/* ボタンの場合: ボタン名変更 & 遷移テスト/子ページ作成トリガー */}
            {selectedElement.type === 'button' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  value={(selectedElement as ButtonElement).label}
                  onChange={(e) => onUpdateButtonLabel && onUpdateButtonLabel(e.target.value)}
                  placeholder="ボタン名"
                  style={{
                    padding: '4px 6px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    width: '100px',
                  }}
                />

                <button
                  onClick={() =>
                    onTriggerButtonAction &&
                    onTriggerButtonAction(selectedElement as ButtonElement)
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    backgroundColor: (selectedElement as ButtonElement).targetPageId
                      ? '#eff6ff'
                      : '#f0fdf4',
                    color: (selectedElement as ButtonElement).targetPageId ? '#1d4ed8' : '#15803d',
                    border: (selectedElement as ButtonElement).targetPageId
                      ? '1px solid #bfdbfe'
                      : '1px solid #bbf7d0',
                  }}
                >
                  <ArrowUpRight size={13} />
                  <span>
                    {(selectedElement as ButtonElement).targetPageId
                      ? `移動 (${targetPagePath || '開く'})`
                      : '子ページ作成'}
                  </span>
                </button>
              </div>
            )}

            {/* 選択要素の削除ボタン */}
            <button
              onClick={onDeleteSelected}
              title="選択中の要素を削除"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '5px 8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                borderRadius: '6px',
                border: '1px solid #fecaca',
              }}
            >
              <Trash2 size={13} />
              <span>削除</span>
            </button>
          </>
        ) : (
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            要素タップで選択・移動・リサイズ
          </span>
        )}
      </div>
    </div>
  )
}
