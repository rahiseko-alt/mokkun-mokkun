import React, { useState, useEffect, useRef } from 'react'
import { Page } from '../types'
import { Trash2, AlertCircle, Hash, FileEdit, MessageSquare } from 'lucide-react'

interface PageInfoPanelProps {
  page: Page
  isOnlyPage: boolean
  onUpdateDisplayName: (displayName: string) => void
  onUpdateComment: (comment: string) => void
  onRequestDeletePage: () => void
}

export const PageInfoPanel: React.FC<PageInfoPanelProps> = ({
  page,
  isOnlyPage,
  onUpdateDisplayName,
  onUpdateComment,
  onRequestDeletePage,
}) => {
  const [displayName, setDisplayName] = useState(page.displayName)
  const [comment, setComment] = useState(page.comment)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ページ切り替え時にローカルステートを同期
  useEffect(() => {
    setDisplayName(page.displayName)
    setComment(page.comment)
  }, [page.id, page.displayName, page.comment])

  // コメント入力の 600ms debounce 自動保存 (13.2)
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value
    setComment(newVal)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      onUpdateComment(newVal)
    }, 600)
  }

  // 表示名変更の即時反映
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDisplayName(val)
    onUpdateDisplayName(val)
  }

  return (
    <aside
      style={{
        width: '280px',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        overflowY: 'auto',
        padding: '16px',
        gap: '20px',
      }}
    >
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '14px' }}>
          ページ情報
        </h2>

        {/* ページ識別子 */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '6px',
            }}
          >
            <Hash size={13} />
            ページ識別子
          </label>
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#1e293b',
              letterSpacing: '0.04em',
              border: '1px solid #e2e8f0',
            }}
          >
            {page.identifierPath}
          </div>
        </div>

        {/* ページ名 (表示名) */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '6px',
            }}
          >
            <FileEdit size={13} />
            ページ名
          </label>
          <input
            type="text"
            value={displayName}
            onChange={handleDisplayNameChange}
            placeholder="例: 顧客詳細"
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
            }}
          />
        </div>

        {/* コメント */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
              }}
            >
              <MessageSquare size={13} />
              コメント
            </label>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>自動保存</span>
          </div>
          <textarea
            value={comment}
            onChange={handleCommentChange}
            placeholder="例: 赤の四角には顧客情報を表示する。青の四角は予約履歴。"
            rows={6}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '13px',
              lineHeight: '1.5',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              resize: 'vertical',
              color: '#0f172a',
            }}
          />
        </div>
      </div>

      {/* 削除セクション */}
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        {isOnlyPage ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '10px',
              backgroundColor: '#fef2f2',
              borderRadius: '6px',
              border: '1px solid #fee2e2',
              fontSize: '11px',
              color: '#991b1b',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>プロジェクトには最低1ページ必要です。このページは削除できません。</span>
          </div>
        ) : (
          <button
            onClick={onRequestDeletePage}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2'
            }}
          >
            <Trash2 size={15} />
            <span>このページを削除</span>
          </button>
        )}
      </div>
    </aside>
  )
}
