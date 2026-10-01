import React from 'react'

interface CreateChildPageModalProps {
  buttonLabel: string
  parentPath: string
  nextPath: string | null
  onConfirm: () => void
  onCancel: () => void
}

export const CreateChildPageModal: React.FC<CreateChildPageModalProps> = ({
  buttonLabel,
  parentPath,
  nextPath,
  onConfirm,
  onCancel,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(17, 17, 17, 0.45)',
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
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--bh-ink)', marginBottom: '12px' }}>
          このボタンのページを作成しますか？
        </h3>

        <div style={{ fontSize: '13px', color: 'var(--bh-ink)', marginBottom: '20px', lineHeight: '1.6' }}>
          <div>ページ名: <span style={{ fontWeight: 600 }}>{buttonLabel || '新規ページ'}</span>（ボタン名と同じ）</div>
          <div>親ページ: <span style={{ fontWeight: 600, color: 'var(--bh-ink)' }}>{parentPath}</span></div>
          {nextPath && (
            <div>作成予定の識別子: <span style={{ fontWeight: 700, color: 'var(--bh-blue)' }}>{nextPath}</span></div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--bh-ink)',
              backgroundColor: 'var(--bh-paper-2)',
              borderRadius: '6px',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: 'var(--bh-blue)',
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
