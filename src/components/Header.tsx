import React, { useState, useEffect } from 'react'
import {
  FolderPlus,
  Save,
  History,
  Settings,
  Edit2,
  Check,
  Menu,
  Info,
} from 'lucide-react'

interface HeaderProps {
  projectName: string
  onUpdateProjectName: (name: string) => void
  onNewProject: () => void
  onSaveSnapshot: () => void
  onOpenSnapshots: () => void
  onOpenSettings: () => void
  saveToastMessage: string | null
  onToggleSidebar?: () => void
  onToggleInfoPanel?: () => void
  isSidebarOpen?: boolean
  isInfoPanelOpen?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onUpdateProjectName,
  onNewProject,
  onSaveSnapshot,
  onOpenSnapshots,
  onOpenSettings,
  saveToastMessage,
  onToggleSidebar,
  onToggleInfoPanel,
  isSidebarOpen,
  isInfoPanelOpen,
}) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(projectName)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const isSmallScreen = windowWidth < 640

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
        padding: '0 12px',
        height: '56px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 50,
        gap: '8px',
      }}
    >
      {/* 左セクション: サイドバートグル & プロジェクト名 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {/* モバイル・タブレット用サイドバートグルボタン */}
        {isMobile && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="ページ一覧を開閉"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: isSidebarOpen ? '#eff6ff' : '#f8fafc',
              border: '1px solid #cbd5e1',
              color: isSidebarOpen ? '#2563eb' : '#475569',
            }}
          >
            <Menu size={18} />
          </button>
        )}

        <div
          style={{
            fontWeight: 700,
            fontSize: isSmallScreen ? '14px' : '16px',
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minWidth: 0,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              flexShrink: 0,
            }}
          />
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                  padding: '4px 6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid #3b82f6',
                  borderRadius: '4px',
                  maxWidth: '120px',
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
                <Check size={14} />
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
                gap: '4px',
                padding: '4px 6px',
                borderRadius: '4px',
                maxWidth: isSmallScreen ? '110px' : '200px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {projectName}
              </span>
              <Edit2 size={12} color="#94a3b8" style={{ flexShrink: 0 }} />
            </div>
          )}
        </div>

        {saveToastMessage && (
          <div
            style={{
              fontSize: '11px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #a7f3d0',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {saveToastMessage}
          </div>
        )}
      </div>

      {/* 右セクション: アクションボタン群 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onNewProject}
          title="新しいプロジェクト"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#475569',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
          }}
        >
          <FolderPlus size={14} />
          {!isSmallScreen && <span>新規</span>}
        </button>

        <button
          onClick={onSaveSnapshot}
          title="構成を保存"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: '#2563eb',
            borderRadius: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <Save size={14} />
          <span>構成を保存</span>
        </button>

        <button
          onClick={onOpenSnapshots}
          title="保存した構成を見る"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#475569',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
          }}
        >
          <History size={14} />
          {!isSmallScreen && <span>保存一覧</span>}
        </button>

        <button
          onClick={onOpenSettings}
          title="設定"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#475569',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
          }}
        >
          <Settings size={14} />
          {!isSmallScreen && <span>設定</span>}
        </button>

        {/* モバイル・タブレット用ページ情報トグルボタン */}
        {isMobile && onToggleInfoPanel && (
          <button
            onClick={onToggleInfoPanel}
            title="ページ情報を開閉"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: isInfoPanelOpen ? '#eff6ff' : '#f8fafc',
              border: '1px solid #cbd5e1',
              color: isInfoPanelOpen ? '#2563eb' : '#475569',
            }}
          >
            <Info size={18} />
          </button>
        )}
      </div>
    </header>
  )
}
