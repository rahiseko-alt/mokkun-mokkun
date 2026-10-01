import React, { useRef } from 'react'
import { Square, Image as ImageIcon, MousePointerClick, Trash2, ArrowUpRight } from 'lucide-react'
import { CanvasElement, ButtonElement, RectangleElement, ImageElement } from '../types'
import './MobileControls.css'

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
  onAddRectangle, onAddImage, onAddButton, selectedElement, onDeleteSelected,
  onUpdateButtonLabel, onTriggerButtonAction, targetPagePath,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onAddImage(file)
    e.target.value = ''
  }
  const button = selectedElement?.type === 'button' ? selectedElement as ButtonElement : null
  return (
    <div className="mc-toolbar">
      <div className="mc-add-tools" aria-label="キャンバスに追加">
        <button type="button" className="mc-add-button" onClick={onAddRectangle} title="四角を追加"><Square size={20} color="#3b82f6" /><span>四角<small>領域を作る</small></span></button>
        <button type="button" className="mc-add-button" onClick={() => fileInputRef.current?.click()} title="画像を追加"><ImageIcon size={20} color="#059669" /><span>画像<small>参考を置く</small></span></button>
        <input ref={fileInputRef} type="file" accept="image/*" aria-label="追加する画像" style={{ display: 'none' }} onChange={handleFileChange} />
        <button type="button" className="mc-add-button" onClick={onAddButton} title="ボタンを追加"><MousePointerClick size={20} color="#8b5cf6" /><span>ボタン<small>画面をつなぐ</small></span></button>
      </div>
      <div className="mc-selected-tools">
        {selectedElement ? (
          <>
            <div className="mc-selection-details">
              {selectedElement.type === 'rectangle' && <span className="mc-selection-label" style={{ backgroundColor: (selectedElement as RectangleElement).colorHex, color: (selectedElement as RectangleElement).textColor, borderColor: (selectedElement as RectangleElement).borderColor }}>{(selectedElement as RectangleElement).colorKey} の四角</span>}
              {selectedElement.type === 'image' && <span className="mc-selection-label">画像 ({(selectedElement as ImageElement).fileName || '参考画像'})</span>}
              {button && <div className="mc-button-properties">
                <label className="mc-button-name"><span>ボタン名</span><input type="text" value={button.label} onChange={(e) => onUpdateButtonLabel?.(e.target.value)} placeholder="ボタン名" /></label>
                <button type="button" className={'mc-control mc-link-action' + (button.targetPageId ? ' is-linked' : '')} onClick={() => onTriggerButtonAction?.(button)}><ArrowUpRight size={18} /><span>{button.targetPageId ? `移動 (${targetPagePath || '開く'})` : '子ページ作成'}</span></button>
              </div>}
            </div>
            <button type="button" className="mc-control mc-delete" onClick={onDeleteSelected} title="選択中の要素を削除"><Trash2 size={18} /><span>削除</span></button>
          </>
        ) : <span className="mc-tool-hint">追加した要素をタップして選択。ドラッグで移動できます。</span>}
      </div>
    </div>
  )
}
