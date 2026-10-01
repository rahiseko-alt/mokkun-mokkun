import React from 'react'
import { Page } from '../types'
import { Plus, FileText, ChevronRight, X } from 'lucide-react'

interface PageListSidebarProps {
  pages: Page[]
  currentPageId: string
  onSelectPage: (pageId: string) => void
  onAddRootPage: () => void
  onClose?: () => void
}

interface TreeNode {
  page: Page
  children: TreeNode[]
}

export const PageListSidebar: React.FC<PageListSidebarProps> = ({
  pages,
  currentPageId,
  onSelectPage,
  onAddRootPage,
  onClose,
}) => {
  // 親子関係に基づいたツリー構造の構築
  const buildTree = (): TreeNode[] => {
    const map = new Map<string, TreeNode>()
    pages.forEach((p) => {
      map.set(p.id, { page: p, children: [] })
    })

    const rootNodes: TreeNode[] = []
    pages.forEach((p) => {
      const node = map.get(p.id)!
      if (p.parentPageId && map.has(p.parentPageId)) {
        map.get(p.parentPageId)!.children.push(node)
      } else {
        rootNodes.push(node)
      }
    })

    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.page.order - b.page.order)
      nodes.forEach((n) => sortNodes(n.children))
    }
    sortNodes(rootNodes)

    return rootNodes
  }

  const renderNode = (node: TreeNode, depth: number) => {
    const isSelected = node.page.id === currentPageId
    const indent = (depth - 1) * 16

    return (
      <div key={node.page.id}>
        <div
          onClick={() => {
            onSelectPage(node.page.id)
            if (onClose) onClose()
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 10px',
            paddingLeft: `${12 + indent}px`,
            backgroundColor: isSelected ? '#eff6ff' : 'transparent',
            color: isSelected ? '#1d4ed8' : '#334155',
            fontWeight: isSelected ? 600 : 400,
            cursor: 'pointer',
            borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
            transition: 'background-color 0.1s',
            fontSize: '13px',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'
          }}
          onMouseLeave={(e) => {
            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          {node.children.length > 0 ? (
            <ChevronRight size={13} color="#94a3b8" />
          ) : (
            <FileText size={13} color="#94a3b8" />
          )}

          {/* 人間向け識別子 (例: B-竹-地) */}
          <span
            style={{
              padding: '1px 5px',
              backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9',
              borderRadius: '3px',
              fontSize: '11px',
              fontWeight: 600,
              color: isSelected ? '#1e40af' : '#475569',
              letterSpacing: '0.02em',
            }}
          >
            {node.page.identifierPath}
          </span>

          {/* 表示名 */}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '140px',
            }}
            title={node.page.displayName}
          >
            {node.page.displayName || '無題'}
          </span>
        </div>

        {node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  const tree = buildTree()

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
          ページ一覧 ({pages.length})
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onAddRootPage}
            title="第1階層の新しいページを追加"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#2563eb',
              backgroundColor: '#eff6ff',
              borderRadius: '4px',
              border: '1px solid #bfdbfe',
            }}
          >
            <Plus size={12} />
            <span>追加</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="閉じる"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                color: '#64748b',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {tree.map((node) => renderNode(node, 1))}
      </div>
    </aside>
  )
}
