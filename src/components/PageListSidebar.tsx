import React from 'react'
import { Page } from '../types'
import { Plus, FileText, ChevronRight } from 'lucide-react'

interface PageListSidebarProps {
  pages: Page[]
  currentPageId: string
  onSelectPage: (pageId: string) => void
  onAddRootPage: () => void
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
    return (
      <li key={node.page.id}>
        <button
          type="button"
          className={'bh-page-item' + (isSelected ? ' is-current' : '')}
          style={{ paddingLeft: `${10 + (depth - 1) * 16}px` }}
          aria-current={isSelected ? 'page' : undefined}
          onClick={() => onSelectPage(node.page.id)}
        >
          {node.children.length > 0 ? <ChevronRight size={13} /> : <FileText size={13} />}
          {/* 人間向け識別子 (例: B-竹-地) */}
          <span className="bh-page-id">{node.page.identifierPath}</span>
          <span className="bh-page-name" title={node.page.displayName}>{node.page.displayName || '無題'}</span>
        </button>
        {node.children.length > 0 && <ul>{node.children.map((child) => renderNode(child, depth + 1))}</ul>}
      </li>
    )
  }

  const tree = buildTree()

  return (
    <section className="bh-section">
      <div className="bh-section-head">
        <h2 className="bh-section-title"><span className="bh-mark bh-mark-ink" />ページ一覧 ({pages.length})</h2>
        <button type="button" className="bh-btn bh-btn-small" onClick={onAddRootPage} title="第1階層の新しいページを追加"><Plus size={14} /><span>追加</span></button>
      </div>
      <ul className="bh-page-tree">{tree.map((node) => renderNode(node, 1))}</ul>
    </section>
  )
}
