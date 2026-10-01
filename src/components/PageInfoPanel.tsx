import React from 'react'
import { Page } from '../types'
import { Trash2, Hash, FileEdit } from 'lucide-react'

interface PageInfoPanelProps {
  page: Page
  isOnlyPage: boolean
  onRequestDeletePage: () => void
}

export const PageInfoPanel: React.FC<PageInfoPanelProps> = ({
  page,
  isOnlyPage,
  onRequestDeletePage,
}) => (
  <section className="bh-section">
    <h2 className="bh-section-title"><span className="bh-mark bh-mark-yellow" />ページ情報</h2>
    <div className="bh-field">
      <span><Hash size={13} />ページ識別子</span>
      <div className="bh-identifier">{page.identifierPath}</div>
    </div>
    <div className="bh-field">
      <span><FileEdit size={13} />ページ名</span>
      <div className="bh-readonly">{page.displayName || '無題'}</div>
    </div>
    {/* 最後の1ページは削除できないため、ボタン自体を出さない */}
    {!isOnlyPage && <button type="button" className="bh-btn bh-delete" onClick={onRequestDeletePage}><Trash2 size={15} /><span>このページを削除</span></button>}
  </section>
)
