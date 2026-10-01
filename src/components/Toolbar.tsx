import React, { useRef } from 'react'
import { Square, Image as ImageIcon, MousePointerClick, Type, Trash2, ArrowUpRight } from 'lucide-react'
import { CanvasElement, ButtonElement, RectangleElement, ImageElement, TextElement } from '../types'
import { TEXT_FONT_SIZES } from '../constants'

interface ToolbarProps {
  onAddRectangle: () => void
  onAddImage: (file: File) => void
  onAddButton: () => void
  onAddText: () => void
  selectedElement: CanvasElement | null
  onDeleteSelected: () => void
  onUpdateElement: (element: CanvasElement) => void
  onUpdateButtonLabel?: (label: string) => void
  onTriggerButtonAction?: (button: ButtonElement) => void
  targetPagePath?: string | null
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddRectangle, onAddImage, onAddButton, onAddText, selectedElement, onDeleteSelected,
  onUpdateElement, onUpdateButtonLabel, onTriggerButtonAction, targetPagePath,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onAddImage(file)
    e.target.value = ''
  }
  const updateText = (patch: Partial<TextElement>) => {
    if (selectedElement?.type !== 'text') return
    onUpdateElement({ ...selectedElement, ...patch, updatedAt: new Date().toISOString() })
  }
  const button = selectedElement?.type === 'button' ? selectedElement as ButtonElement : null
  const textEl = selectedElement?.type === 'text' ? selectedElement as TextElement : null
  return (
    <>
      <section className="bh-section">
        <h2 className="bh-section-title"><span className="bh-mark bh-mark-red" />追加</h2>
        <div className="bh-add-tools" aria-label="キャンバスに追加">
          <button type="button" className="bh-add-button" onClick={onAddRectangle} title="四角を追加"><Square size={22} /><span>四角<small>領域を作る</small></span></button>
          <button type="button" className="bh-add-button" onClick={() => fileInputRef.current?.click()} title="画像を追加"><ImageIcon size={22} /><span>画像<small>参考を置く</small></span></button>
          <input ref={fileInputRef} type="file" accept="image/*" aria-label="追加する画像" style={{ display: 'none' }} onChange={handleFileChange} />
          <button type="button" className="bh-add-button" onClick={onAddButton} title="ボタンを追加"><MousePointerClick size={22} /><span>ボタン<small>画面をつなぐ</small></span></button>
          <button type="button" className="bh-add-button" onClick={onAddText} title="テキストを追加"><Type size={22} /><span>テキスト<small>文字を置く</small></span></button>
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
            {textEl && <>
              <label className="bh-field"><span>テキスト</span><textarea value={textEl.text} rows={3} onChange={(e) => updateText({ text: e.target.value })} placeholder="表示する文字" /></label>
              <div className="bh-field">
                <span>文字サイズ</span>
                <div className="bh-segment" role="group" aria-label="文字サイズ">{TEXT_FONT_SIZES.map((f) => (
                  <button key={f.label} type="button" aria-pressed={textEl.fontSize === f.size} onClick={() => updateText({ fontSize: f.size })}>{f.label}</button>
                ))}</div>
              </div>
              <p className="bh-hint">枠の角をドラッグすると、文字を置く範囲を変えられます。</p>
            </>}
            <button type="button" className="bh-btn bh-delete" onClick={onDeleteSelected} title="選択中の要素を削除"><Trash2 size={18} /><span>削除</span></button>
          </div>
        ) : <p className="bh-hint">描画画面の要素をタップして選択。ドラッグで移動できます。</p>}
      </section>
    </>
  )
}
