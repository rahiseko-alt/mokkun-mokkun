import React, { useState, useEffect, useRef } from 'react'
import { Page } from '../types'
import { Trash2, AlertCircle, Hash, FileEdit, MessageSquare } from 'lucide-react'

interface PageInfoPanelProps {
  page: Page
  isOnlyPage: boolean
  onUpdateComment: (comment: string) => void
  onRequestDeletePage: () => void
}

export const PageInfoPanel: React.FC<PageInfoPanelProps> = ({
  page,
  isOnlyPage,
  onUpdateComment,
  onRequestDeletePage,
}) => {
  const [comment, setComment] = useState(page.comment)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ページ切り替え時にローカルステートを同期
  useEffect(() => {
    setComment(page.comment)
  }, [page.id, page.comment])

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

  return (
    <section className="bh-section">
      <h2 className="bh-section-title"><span className="bh-mark bh-mark-yellow" />ページ情報</h2>
      <div className="bh-field">
        <span><Hash size={13} />ページ識別子</span>
        <div className="bh-identifier">{page.identifierPath}</div>
      </div>
      <div className="bh-field">
        <span><FileEdit size={13} />ページ名<small>ボタン名から自動</small></span>
        <div className="bh-readonly">{page.displayName || '無題'}</div>
      </div>
      <label className="bh-field">
        <span><MessageSquare size={13} />コメント<small>自動保存</small></span>
        <textarea value={comment} onChange={handleCommentChange} placeholder="例: 赤の四角には顧客情報を表示する。青の四角は予約履歴。" rows={4} />
      </label>
      {isOnlyPage ? (
        <p className="bh-note"><AlertCircle size={15} /><span>プロジェクトには最低1ページ必要です。このページは削除できません。</span></p>
      ) : (
        <button type="button" className="bh-btn bh-delete" onClick={onRequestDeletePage}><Trash2 size={15} /><span>このページを削除</span></button>
      )}
    </section>
  )
}
