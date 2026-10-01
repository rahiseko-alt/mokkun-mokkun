import React, { useState } from 'react'

interface CreateChildPageModalProps {
  buttonLabel: string
  parentPath: string
  nextPath: string | null
  onConfirm: (displayName: string) => void
  onCancel: () => void
}

export const CreateChildPageModal: React.FC<CreateChildPageModalProps> = ({
  buttonLabel,
  parentPath,
  nextPath,
  onConfirm,
  onCancel,
}) => {
  const [displayName, setDisplayName] = useState(buttonLabel || '新規ページ')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(2px)',
      }}
      onClick={onCancel}
    >
      <div
        className="modal-content"
        style={{
          width: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
          このボタンのページを作成しますか？
        </h3>

        <div style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: '1.6' }}>
          <div>親ページ: <span style={{ fontWeight: 600, color: '#1e293b' }}>{parentPath}</span></div>
          {nextPath && (
            <div>作成予定の識別子: <span style={{ fontWeight: 700, color: '#2563eb' }}>{nextPath}</span></div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
            新しいページの表示名
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onConfirm(displayName.trim() || '新規ページ')
              if (e.key === 'Escape') onCancel()
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#475569',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={() => onConfirm(displayName.trim() || '新規ページ')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#2563eb',
              borderRadius: '6px',
            }}
          >
            ページを作る
          </button>
        </div>
      </div>
    </div>
  )
}
