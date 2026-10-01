import React, { useRef } from 'react'
import { Square, Image as ImageIcon, MousePointerClick, Trash2, ArrowUpRight } from 'lucide-react'
import { CanvasElement, ButtonElement, RectangleElement, ImageElement } from '../types'

interface ToolbarProps {
  onAddRectangle: () => void
  onAddImage: (file: File) => void
  onAddButton: () => void
  selectedElement: CanvasElement | null
  onDeleteSelected: () => void
  onUpdateElement: (element: CanvasElement) => void
  onUpdateButtonLabel?: (label: string) => void
  onTriggerButtonAction?: (button: ButtonElement) => void
  targetPagePath?: string | null
}

const SIZE_FIELDS = [
  { key: 'x', label: '左から', min: 0 },
  { key: 'y', label: '上から', min: 0 },
  { key: 'width', label: '幅', min: 40 },
  { key: 'height', label: '高さ', min: 40 },
] as const

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddRectangle, onAddImage, onAddButton, selectedElement, onDeleteSelected,
  onUpdateElement, onUpdateButtonLabel, onTriggerButtonAction, targetPagePath,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onAddImage(file)
    e.target.value = ''
  }
  const handleSizeChange = (field: typeof SIZE_FIELDS[number], raw: string) => {
    if (!selectedElement || raw === '') return
    const value = Number(raw)
    if (!Number.isFinite(value)) return
    const next = Math.max(field.min, Math.round(value))
    const updated = { ...selectedElement, [field.key]: next, updatedAt: new Date().toISOString() }
    if (selectedElement.type === 'image' && selectedElement.keepAspectRatio) {
      if (field.key === 'width') updated.height = Math.max(40, Math.round(next * selectedElement.height / selectedElement.width))
      if (field.key === 'height') updated.width = Math.max(40, Math.round(next * selectedElement.width / selectedElement.height))
    }
    onUpdateElement(updated)
  }
  const button = selectedElement?.type === 'button' ? selectedElement as ButtonElement : null
  return (
    <>
      <section className="bh-section">
        <h2 className="bh-section-title"><span className="bh-mark bh-mark-red" />追加</h2>
        <div className="bh-add-tools" aria-label="キャンバスに追加">
          <button type="button" className="bh-add-button" onClick={onAddRectangle} title="四角を追加"><Square size={22} /><span>四角<small>領域を作る</small></span></button>
          <button type="button" className="bh-add-button" onClick={() => fileInputRef.current?.click()} title="画像を追加"><ImageIcon size={22} /><span>画像<small>参考を置く</small></span></button>
          <input ref={fileInputRef} type="file" accept="image/*" aria-label="追加する画像" style={{ display: 'none' }} onChange={handleFileChange} />
          <button type="button" className="bh-add-button" onClick={onAddButton} title="ボタンを追加"><MousePointerClick size={22} /><span>ボタン<small>画面をつなぐ</small></span></button>
        </div>
      </section>
      <section className="bh-section">
        <h2 className="bh-section-title"><span className="bh-mark bh-mark-blue" />選択中の要素</h2>
        {selectedElement ? (
          <div className="bh-selection" key={selectedElement.id}>
            {selectedElement.type === 'rectangle' && <span className="bh-selection-label" style={{ backgroundColor: (selectedElement as RectangleElement).colorHex, color: (selectedElement as RectangleElement).textColor }}>{(selectedElement as RectangleElement).colorKey} の四角</span>}
            {selectedElement.type === 'image' && <span className="bh-selection-label">画像 ({(selectedElement as ImageElement).fileName || '参考画像'})</span>}
            {button && <>
              <label className="bh-field"><span>ボタン名</span><input type="text" value={button.label} onChange={(e) => onUpdateButtonLabel?.(e.target.value)} placeholder="ボタン名" /></label>
              <button type="button" className={'bh-btn bh-link-action' + (button.targetPageId ? ' is-linked' : '')} onClick={() => onTriggerButtonAction?.(button)}><ArrowUpRight size={18} /><span>{button.targetPageId ? `移動 (${targetPagePath || '開く'})` : '子ページ作成'}</span></button>
            </>}
            <details className="bh-size">
              <summary>位置・サイズを数値で調整</summary>
              <div className="bh-size-grid">{SIZE_FIELDS.map((field) => <label key={field.key} className="bh-field">
                <span>{field.label}</span>
                <input type="number" inputMode="numeric" min={field.min} value={selectedElement[field.key]} onChange={(e) => handleSizeChange(field, e.target.value)} />
              </label>)}</div>
            </details>
            <button type="button" className="bh-btn bh-delete" onClick={onDeleteSelected} title="選択中の要素を削除"><Trash2 size={18} /><span>削除</span></button>
          </div>
        ) : <p className="bh-hint">描画画面の要素をタップして選択。ドラッグで移動できます。</p>}
      </section>
    </>
  )
}
