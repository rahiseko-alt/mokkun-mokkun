import React, { useRef } from 'react'
import { Square, Image as ImageIcon, MousePointerClick, Type, Save, History, FolderPlus, Settings, MousePointer2, Pencil, Eraser } from 'lucide-react'
import { DrawTool } from '../types'

interface ToolbarProps {
  onAddRectangle: () => void
  onAddImage: (file: File) => void
  onAddButton: () => void
  onAddText: () => void
  onSaveSnapshot: () => void
  onOpenSnapshots: () => void
  onNewProject: () => void
  onOpenSettings: () => void
  tool: DrawTool
  onChangeTool: (tool: DrawTool) => void
}

const TOOLS: { key: DrawTool; label: string; Icon: typeof Pencil }[] = [
  { key: 'select', label: '選択', Icon: MousePointer2 },
  { key: 'pen', label: '鉛筆', Icon: Pencil },
  { key: 'eraser', label: '消しゴム', Icon: Eraser },
]

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddRectangle, onAddImage, onAddButton, onAddText,
  onSaveSnapshot, onOpenSnapshots, onNewProject, onOpenSettings, tool, onChangeTool,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onAddImage(file)
    e.target.value = ''
  }
  return (
    <>
      <section className="bh-section">
        <h2 className="bh-section-title"><span className="bh-mark bh-mark-red" />追加</h2>
        <div className="bh-add-tools" aria-label="キャンバスに追加">
          <button type="button" className="bh-add-button" onClick={onAddRectangle} title="四角を追加"><Square size={22} /><span>四角</span></button>
          <button type="button" className="bh-add-button" onClick={() => fileInputRef.current?.click()} title="画像を追加"><ImageIcon size={22} /><span>画像</span></button>
          <input ref={fileInputRef} type="file" accept="image/*" aria-label="追加する画像" style={{ display: 'none' }} onChange={handleFileChange} />
          <button type="button" className="bh-add-button" onClick={onAddButton} title="ボタンを追加"><MousePointerClick size={22} /><span>ボタン</span></button>
          <button type="button" className="bh-add-button" onClick={onAddText} title="テキストを追加"><Type size={22} /><span>テキスト</span></button>
        </div>
      </section>
      <section className="bh-section">
        <h2 className="bh-section-title"><span className="bh-mark bh-mark-ink" />描画</h2>
        <div className="bh-tools" role="group" aria-label="描画ツール">
          {TOOLS.map(({ key, label, Icon }) => (
            <button key={key} type="button" className="bh-btn" aria-pressed={tool === key} onClick={() => onChangeTool(key)}><Icon size={16} /><span>{label}</span></button>
          ))}
        </div>
      </section>
      <section className="bh-section">
        <h2 className="bh-section-title"><span className="bh-mark bh-mark-blue" />プロジェクト</h2>
        <div className="bh-project-actions">
          <button type="button" className="bh-btn bh-save" onClick={onSaveSnapshot}><Save size={16} /><span>保存</span></button>
          <button type="button" className="bh-btn" onClick={onOpenSnapshots}><History size={16} /><span>保存一覧</span></button>
          <button type="button" className="bh-btn" onClick={onNewProject}><FolderPlus size={16} /><span>新規作成</span></button>
          <button type="button" className="bh-btn" onClick={onOpenSettings}><Settings size={16} /><span>設定</span></button>
        </div>
      </section>
    </>
  )
}
