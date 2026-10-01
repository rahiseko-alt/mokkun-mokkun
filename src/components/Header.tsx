import React, { useState, useEffect } from 'react'
import { FolderPlus, Save, History, Settings, Edit2, Check, SlidersHorizontal, MoreHorizontal } from 'lucide-react'

interface HeaderProps {
  projectName: string
  onUpdateProjectName: (name: string) => void
  onNewProject: () => void
  onSaveSnapshot: () => void
  onOpenSnapshots: () => void
  onOpenSettings: () => void
  saveToastMessage: string | null
  onTogglePanel?: () => void
  isPanelOpen?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  projectName, onUpdateProjectName, onNewProject, onSaveSnapshot,
  onOpenSnapshots, onOpenSettings, saveToastMessage, onTogglePanel, isPanelOpen,
}) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(projectName)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const resize = () => { setIsMobile(window.innerWidth < 768); setIsMenuOpen(false) }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', dismiss)
    return () => window.removeEventListener('keydown', dismiss)
  }, [])
  const handleSaveName = () => {
    const trimmed = nameInput.trim()
    if (trimmed) onUpdateProjectName(trimmed)
    else setNameInput(projectName)
    setIsEditingName(false)
  }
  const runMenuAction = (action: () => void) => {
    setIsMenuOpen(false)
    action()
  }
  const secondaryActions = (
    <>
      <button type="button" className="mc-control" title="新しいプロジェクト" onClick={() => runMenuAction(onNewProject)}><FolderPlus size={18} /><span>新規</span></button>
      <button type="button" className="mc-control" title="保存した構成を見る" onClick={() => runMenuAction(onOpenSnapshots)}><History size={18} /><span>保存一覧</span></button>
      <button type="button" className="mc-control" title="設定" onClick={() => runMenuAction(onOpenSettings)}><Settings size={18} /><span>設定</span></button>
    </>
  )
  return (
    <header className="mc-header">
      <div className="mc-header-main">
        <div className="mc-project">
          {isEditingName ? (
            <div className="mc-name-edit">
              <input aria-label="プロジェクト名" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName()
                if (e.key === 'Escape') { setNameInput(projectName); setIsEditingName(false) }
              }} autoFocus />
              <button type="button" className="mc-control" onClick={handleSaveName} title="確定" aria-label="プロジェクト名を確定"><Check size={18} /></button>
            </div>
          ) : (
            <button type="button" className="mc-project-name" title="クリックしてプロジェクト名を変更" onClick={() => { setNameInput(projectName); setIsEditingName(true) }}>
              <span>{projectName}</span><Edit2 size={14} />
            </button>
          )}
        </div>
        <div className="mc-header-actions">
          <button type="button" className="mc-control mc-save" onClick={onSaveSnapshot} title="構成を保存"><Save size={18} /><span>構成を保存</span></button>
          {!isMobile && <div className="mc-desktop-actions">{secondaryActions}</div>}
          {isMobile && <button type="button" className="mc-control mc-more" aria-label="その他の操作" aria-expanded={isMenuOpen} aria-controls="project-action-menu" onClick={() => setIsMenuOpen(!isMenuOpen)}><MoreHorizontal size={22} /></button>}
          {isMobile && onTogglePanel && <button type="button" className="mc-control mc-panel-toggle" aria-expanded={!!isPanelOpen} aria-controls="control-panel" onClick={onTogglePanel} title="操作パネルを開閉"><SlidersHorizontal size={18} /><span>操作</span></button>}
        </div>
      </div>
      {isMenuOpen && <div className="mc-menu" id="project-action-menu" aria-label="その他の操作">{secondaryActions}</div>}
      {saveToastMessage && <div className="mc-save-status" role="status">{saveToastMessage}</div>}
    </header>
  )
}
