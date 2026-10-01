import React, { useState } from 'react'
import { FolderPlus, Save, History, Settings, Edit2, Check } from 'lucide-react'

interface HeaderProps {
  projectName: string
  onUpdateProjectName: (name: string) => void
  onNewProject: () => void
  onSaveSnapshot: () => void
  onOpenSnapshots: () => void
  onOpenSettings: () => void
  saveToastMessage: string | null
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onUpdateProjectName,
  onNewProject,
  onSaveSnapshot,
  onOpenSnapshots,
  onOpenSettings,
  saveToastMessage,
}) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(projectName)

  const handleSaveName = () => {
    const trimmed = nameInput.trim()
    if (trimmed) {
      onUpdateProjectName(trimmed)
    } else {
      setNameInput(projectName)
    }
    setIsEditingName(false)
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: '56px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 50,
      }}
    >
      {/* プロジェクト名 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: '17px',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
            }}
          />
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') {
                    setNameInput(projectName)
                    setIsEditingName(false)
                  }
                }}
                autoFocus
                style={{
                  padding: '4px 8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '1px solid #3b82f6',
                  borderRadius: '4px',
                }}
              />
              <button
                onClick={handleSaveName}
                title="確定"
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  display: 'flex',
                }}
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setNameInput(projectName)
                setIsEditingName(true)
              }}
              title="クリックしてプロジェクト名を変更"
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 6px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span>{projectName}</span>
              <Edit2 size={14} color="#94a3b8" />
            </div>
          )}
        </div>

        {saveToastMessage && (
          <div
            style={{
              fontSize: '12px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              padding: '3px 10px',
              borderRadius: '12px',
              border: '1px solid #a7f3d0',
              fontWeight: 500,
            }}
          >
            {saveToastMessage}
          </div>
        )}
      </div>

      {/* アクションボタン群 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onNewProject}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#475569',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
        >
          <FolderPlus size={15} />
          <span>新しいプロジェクト</span>
        </button>

        <button
          onClick={onSaveSnapshot}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: '#2563eb',
            borderRadius: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
        >
          <Save size={15} />
          <span>構成を保存</span>
        </button>

        <button
          onClick={onOpenSnapshots}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#475569',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          <History size={15} />
          <span>保存した構成を見る</span>
        </button>

        <button
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#475569',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          <Settings size={15} />
          <span>設定</span>
        </button>
      </div>
    </header>
  )
}
