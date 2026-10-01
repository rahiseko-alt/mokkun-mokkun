import React, { useState } from 'react'
import { Snapshot } from '../../types'
import { History, RotateCcw, AlertTriangle } from 'lucide-react'

interface SnapshotsModalProps {
  snapshots: Snapshot[]
  onRestore: (snapshot: Snapshot) => void
  onClose: () => void
}

export const SnapshotsModal: React.FC<SnapshotsModalProps> = ({
  snapshots,
  onRestore,
  onClose,
}) => {
  const [selectedSnapshotForConfirm, setSelectedSnapshotForConfirm] = useState<Snapshot | null>(null)

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
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedSnapshotForConfirm ? (
          // 復元確認ダイアログ (15.5)
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <AlertTriangle size={24} color="#f59e0b" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--bh-ink)' }}>
                構成の復元確認
              </h3>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--bh-ink)', marginBottom: '10px', lineHeight: '1.5' }}>
              <span style={{ fontWeight: 700 }}>{selectedSnapshotForConfirm.createdAt}</span> の構成に戻します。
            </p>
            <p style={{ fontSize: '13px', color: 'var(--bh-red)', marginBottom: '24px' }}>
              現在の未保存の変更は失われます。
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedSnapshotForConfirm(null)}
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
                onClick={() => {
                  onRestore(selectedSnapshotForConfirm)
                  setSelectedSnapshotForConfirm(null)
                  onClose()
                }}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: 'var(--bh-blue)',
                  borderRadius: '6px',
                }}
              >
                この状態に戻す
              </button>
            </div>
          </div>
        ) : (
          // スナップショット一覧
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <History size={20} color="var(--bh-blue)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--bh-ink)' }}>
                保存した構成を見る
              </h3>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--bh-muted)', marginBottom: '16px' }}>
              最新の3件まで保持されます。過去の構成に戻すことができます。
            </p>

            {snapshots.length === 0 ? (
              <div
                style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bh-paper-2)',
                  borderRadius: '8px',
                  border: '1px dashed #cbd5e1',
                  color: 'var(--bh-muted)',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                保存された構成はまだありません。「構成を保存」ボタンで保存できます。
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {snapshots.map((snap, idx) => (
                  <div
                    key={snap.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bh-paper-2)',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--bh-ink)' }}>
                        {snap.createdAt}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--bh-muted)', marginTop: '2px' }}>
                        {idx === 0 ? '最新' : idx === 1 ? '1つ前' : '2つ前'} • ページ数: {snap.serializedProjectState.pages.length}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedSnapshotForConfirm(snap)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--bh-blue)',
                        backgroundColor: 'var(--bh-paper-2)',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bh-paper-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bh-paper-2)')}
                    >
                      <RotateCcw size={13} />
                      <span>この状態に戻す</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--bh-ink)',
                  backgroundColor: 'var(--bh-paper-2)',
                  borderRadius: '6px',
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
