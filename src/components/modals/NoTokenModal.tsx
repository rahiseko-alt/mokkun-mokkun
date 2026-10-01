import React from 'react'
import { AlertCircle } from 'lucide-react'

interface NoTokenModalProps {
  onOpenSettings: () => void
  onCancel: () => void
}

export const NoTokenModal: React.FC<NoTokenModalProps> = ({
  onOpenSettings,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <AlertCircle size={22} color="#f59e0b" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--bh-ink)' }}>
            識別子が不足しています
          </h3>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--bh-ink)', lineHeight: '1.6', marginBottom: '20px' }}>
          この階層で使用できる識別子がありません。<br />
          設定画面で識別子を追加してください。
        </p>

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
            onClick={onOpenSettings}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: 'var(--bh-blue)',
              borderRadius: '6px',
            }}
          >
            設定を開く
          </button>
        </div>
      </div>
    </div>
  )
}
