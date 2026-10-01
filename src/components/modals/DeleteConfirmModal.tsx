import React from 'react'
import { Page } from '../../types'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmModalProps {
  pageToDelete: Page
  descendantPages: Page[] // 自身を含む削除対象全ページ
  onConfirm: () => void
  onCancel: () => void
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  pageToDelete,
  descendantPages,
  onConfirm,
  onCancel,
}) => {
  const hasChildren = descendantPages.length > 1

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
          width: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <AlertTriangle size={24} color="#dc2626" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            ページの削除確認
          </h3>
        </div>

        {hasChildren ? (
          <div>
            <p style={{ fontSize: '14px', color: '#334155', marginBottom: '12px', fontWeight: 500 }}>
              このページを削除すると、以下のページもすべて削除されます。
            </p>
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '10px 14px',
                marginBottom: '20px',
              }}
            >
              {descendantPages.map((p) => (
                <div
                  key={p.id}
                  style={{
                    fontSize: '13px',
                    padding: '3px 0',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#dc2626' }}>{p.identifierPath}</span>
                  {p.displayName && (
                    <span style={{ color: '#64748b' }}>（{p.displayName}）</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '15px', color: '#1e293b', marginBottom: '24px', lineHeight: '1.5' }}>
            <span style={{ fontWeight: 700, color: '#dc2626' }}>
              {pageToDelete.identifierPath}
            </span>
            {pageToDelete.displayName && `（${pageToDelete.displayName}）`} を削除しますか？
          </p>
        )}

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
            onClick={onConfirm}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#dc2626',
              borderRadius: '6px',
            }}
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  )
}
