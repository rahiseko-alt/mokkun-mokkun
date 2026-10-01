import React, { useState } from 'react'
import { Edit2, Check } from 'lucide-react'

interface HeaderProps {
  projectName: string
  onUpdateProjectName: (name: string) => void
  saveToastMessage: string | null
  isMobile: boolean
  onTogglePanel?: () => void
  isPanelOpen?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  projectName, onUpdateProjectName, saveToastMessage, isMobile, onTogglePanel, isPanelOpen,
}) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(projectName)
  const handleSaveName = () => {
    const trimmed = nameInput.trim()
    if (trimmed) onUpdateProjectName(trimmed)
    else setNameInput(projectName)
    setIsEditingName(false)
  }
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
        {isMobile && onTogglePanel && <div className="mc-header-actions">
          <button type="button" className="mc-control mc-panel-toggle" aria-expanded={!!isPanelOpen} aria-controls="control-panel" onClick={onTogglePanel} title="パネルを開閉">パネル</button>
        </div>}
      </div>
      {saveToastMessage && <div className="mc-save-status" role="status">{saveToastMessage}</div>}
    </header>
  )
}
