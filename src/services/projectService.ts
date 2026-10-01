import {
  CanvasElement,
  IdentifierSet,
  Page,
  Project,
  ProjectState,
  Snapshot,
} from '../types'
import {
  INITIAL_IDENTIFIER_TOKENS,
  MAX_SNAPSHOTS,
  RECTANGLE_COLORS,
} from '../constants'

/**
 * UUID 生成 (crypto.randomUUID 互換)
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 現在日時フォーマット (YYYY/MM/DD HH:mm)
 */
export function formatCurrentDateTime(date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

/**
 * 初期プロジェクトの生成 (T-001)
 */
export function createInitialProject(name = '新しいプロジェクト'): ProjectState {
  const projectId = generateUUID()
  const now = new Date().toISOString()

  // 初期識別子セットの構築 (第1階層〜第4階層)
  const identifierSets: IdentifierSet[] = Object.entries(
    INITIAL_IDENTIFIER_TOKENS
  ).map(([depthStr, tokens]) => ({
    id: generateUUID(),
    projectId,
    depth: Number(depthStr),
    tokens: [...tokens],
  }))

  const project: Project = {
    id: projectId,
    name,
    identifierSets,
    createdAt: now,
    updatedAt: now,
  }

  // 初期ページ (第1階層の最初のトークン: A)
  const rootToken = identifierSets[0]?.tokens[0] || 'A'
  const rootPageId = generateUUID()

  const rootPage: Page = {
    id: rootPageId,
    projectId,
    parentPageId: null,
    identifierToken: rootToken,
    identifierPath: rootToken,
    displayName: 'メイン',
    depth: 1,
    order: 0,
    comment: '',
    elements: [],
    createdAt: now,
    updatedAt: now,
  }

  return {
    project,
    pages: [rootPage],
    currentPageId: rootPageId,
  }
}

/**
 * 指定階層の識別子セットを取得（なければ必要に応じて自動拡張）
 */
export function getIdentifierSetForDepth(
  identifierSets: IdentifierSet[],
  depth: number,
  projectId: string
): { identifierSets: IdentifierSet[]; currentSet: IdentifierSet } {
  let existing = identifierSets.find((s) => s.depth === depth)
  if (existing) {
    return { identifierSets, currentSet: existing }
  }

  // なければ新設
  const newSet: IdentifierSet = {
    id: generateUUID(),
    projectId,
    depth,
    tokens: [`D${depth}-1`, `D${depth}-2`, `D${depth}-3`],
  }
  const updatedSets = [...identifierSets, newSet].sort(
    (a, b) => a.depth - b.depth
  )
  return { identifierSets: updatedSets, currentSet: newSet }
}

/**
 * 親ページ下で次に使用可能な識別子トークンを取得 (12.2, T-008, T-011)
 */
export function getNextAvailableChildToken(
  pages: Page[],
  parentPage: Page,
  identifierSets: IdentifierSet[]
): { token: string; path: string; order: number } | null {
  const targetDepth = parentPage.depth + 1
  const idSet = identifierSets.find((s) => s.depth === targetDepth)
  if (!idSet || idSet.tokens.length === 0) {
    return null
  }

  // 現在の親直下の子ページたち
  const siblingPages = pages.filter((p) => p.parentPageId === parentPage.id)
  const usedTokens = new Set(siblingPages.map((p) => p.identifierToken))

  // 未使用の最初のトークンを探索
  const availableToken = idSet.tokens.find((token) => !usedTokens.has(token))
  if (!availableToken) {
    return null
  }

  const order = siblingPages.length
  const path = `${parentPage.identifierPath}-${availableToken}`

  return {
    token: availableToken,
    path,
    order,
  }
}

/**
 * ルート階層（depth 1）で次に使用可能な識別子トークンを取得
 */
export function getNextAvailableRootToken(
  pages: Page[],
  identifierSets: IdentifierSet[]
): { token: string; path: string; order: number } | null {
  const idSet = identifierSets.find((s) => s.depth === 1)
  if (!idSet || idSet.tokens.length === 0) {
    return null
  }

  const rootPages = pages.filter((p) => p.parentPageId === null)
  const usedTokens = new Set(rootPages.map((p) => p.identifierToken))

  const availableToken = idSet.tokens.find((token) => !usedTokens.has(token))
  if (!availableToken) {
    return null
  }

  const order = rootPages.length
  return {
    token: availableToken,
    path: availableToken,
    order,
  }
}

/**
 * 識別子パスおよびトークンの再計算 (7.6, T-012)
 * 親の変更や識別子セットの変更があった場合に再帰的に全ページの identifierPath と identifierToken を同期
 */
export function recalculateAllPagePaths(
  pages: Page[],
  identifierSets: IdentifierSet[]
): Page[] {
  const depthMap = new Map<number, IdentifierSet>()
  for (const s of identifierSets) {
    depthMap.set(s.depth, s)
  }

  const pageMap = new Map<string, Page>()
  for (const p of pages) {
    pageMap.set(p.id, { ...p })
  }

  // 親子ツリーの構築
  const rootPages = pages
    .filter((p) => p.parentPageId === null)
    .sort((a, b) => a.order - b.order)

  function updateSubtree(parent: Page | null, children: Page[], depth: number) {
    const idSet = depthMap.get(depth)
    const tokens = idSet ? idSet.tokens : []

    children.sort((a, b) => a.order - b.order)

    children.forEach((child, index) => {
      // 識別子トークンを識別子セットの位置または既存トークンから決定
      let token = child.identifierToken
      if (tokens.length > index) {
        token = tokens[index]
      } else if (tokens.length > 0) {
        token = tokens[tokens.length - 1] + `_${index}`
      }

      const path = parent ? `${parent.identifierPath}-${token}` : token

      const updatedChild: Page = {
        ...child,
        depth,
        order: index,
        identifierToken: token,
        identifierPath: path,
        updatedAt: new Date().toISOString(),
      }
      pageMap.set(child.id, updatedChild)

      // 子ページ群の再帰更新
      const subChildren = pages.filter((p) => p.parentPageId === child.id)
      updateSubtree(updatedChild, subChildren, depth + 1)
    })
  }

  updateSubtree(null, rootPages, 1)

  return pages.map((p) => pageMap.get(p.id) || p)
}

/**
 * ボタンから子ページを作成 (12.1-12.3, T-008)
 */
export function createChildPageFromButton(
  state: ProjectState,
  parentPageId: string,
  buttonId: string,
  displayName = '新規ページ'
): { state: ProjectState; newPageId: string } | { error: 'NO_AVAILABLE_TOKEN' } {
  const parentPage = state.pages.find((p) => p.id === parentPageId)
  if (!parentPage) {
    throw new Error(`Parent page not found: ${parentPageId}`)
  }

  const next = getNextAvailableChildToken(
    state.pages,
    parentPage,
    state.project.identifierSets
  )
  if (!next) {
    return { error: 'NO_AVAILABLE_TOKEN' }
  }

  const newPageId = generateUUID()
  const now = new Date().toISOString()

  const newPage: Page = {
    id: newPageId,
    projectId: state.project.id,
    parentPageId: parentPage.id,
    identifierToken: next.token,
    identifierPath: next.path,
    displayName,
    depth: parentPage.depth + 1,
    order: next.order,
    comment: '',
    elements: [],
    createdAt: now,
    updatedAt: now,
  }

  // ボタンの targetPageId を更新
  const updatedPages = state.pages.map((p) => {
    if (p.id === parentPageId) {
      const updatedElements = p.elements.map((el) => {
        if (el.id === buttonId && el.type === 'button') {
          return {
            ...el,
            targetPageId: newPageId,
            updatedAt: now,
          }
        }
        return el
      })
      return {
        ...p,
        elements: updatedElements,
        updatedAt: now,
      }
    }
    return p
  })

  return {
    state: {
      ...state,
      pages: [...updatedPages, newPage],
      currentPageId: newPageId, // 作成後新規ページへ自動移動 (12.3)
    },
    newPageId,
  }
}

/**
 * 新規ルートページを作成
 */
export function createRootPage(
  state: ProjectState,
  displayName = '新しいページ'
): { state: ProjectState; newPageId: string } | { error: 'NO_AVAILABLE_TOKEN' } {
  const next = getNextAvailableRootToken(
    state.pages,
    state.project.identifierSets
  )
  if (!next) {
    return { error: 'NO_AVAILABLE_TOKEN' }
  }

  const newPageId = generateUUID()
  const now = new Date().toISOString()

  const newPage: Page = {
    id: newPageId,
    projectId: state.project.id,
    parentPageId: null,
    identifierToken: next.token,
    identifierPath: next.path,
    displayName,
    depth: 1,
    order: next.order,
    comment: '',
    elements: [],
    createdAt: now,
    updatedAt: now,
  }

  return {
    state: {
      ...state,
      pages: [...state.pages, newPage],
      currentPageId: newPageId,
    },
    newPageId,
  }
}

/**
 * 指定ページの子孫ページIDをすべて再帰取得 (14.3, T-015)
 */
export function getDescendantPageIds(pages: Page[], targetPageId: string): string[] {
  const result: string[] = [targetPageId]
  const queue: string[] = [targetPageId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const children = pages.filter((p) => p.parentPageId === currentId)
    for (const child of children) {
      result.push(child.id)
      queue.push(child.id)
    }
  }

  return result
}

/**
 * ページおよびその子孫ページをすべて削除 (14.1-14.6, T-014, T-015, T-017, T-018)
 */
export function deletePageAndDescendants(
  state: ProjectState,
  targetPageId: string
): { state: ProjectState } | { error: 'CANNOT_DELETE_LAST_PAGE' } {
  // 14.6 ルートページ: プロジェクトにページが1枚しかない場合、最後の1ページは削除不可
  if (state.pages.length <= 1) {
    return { error: 'CANNOT_DELETE_LAST_PAGE' }
  }

  const idsToDelete = new Set(getDescendantPageIds(state.pages, targetPageId))
  const now = new Date().toISOString()

  // 14.4 外部ページから削除ページへのリンクが存在する場合、そのボタンの targetPageId を null に戻す。ボタン自体は残す。
  const remainingPages = state.pages
    .filter((p) => !idsToDelete.has(p.id))
    .map((p) => {
      let hasModifiedLink = false
      const updatedElements = p.elements.map((el) => {
        if (
          el.type === 'button' &&
          el.targetPageId &&
          idsToDelete.has(el.targetPageId)
        ) {
          hasModifiedLink = true
          return {
            ...el,
            targetPageId: null,
            updatedAt: now,
          }
        }
        return el
      })

      if (hasModifiedLink) {
        return {
          ...p,
          elements: updatedElements,
          updatedAt: now,
        }
      }
      return p
    })

  // 現在表示中ページが削除された場合のフォールバック移動先
  let nextCurrentPageId = state.currentPageId
  if (idsToDelete.has(state.currentPageId)) {
    const parentOfDeleted = state.pages.find((p) => p.id === targetPageId)?.parentPageId
    if (parentOfDeleted && remainingPages.some((p) => p.id === parentOfDeleted)) {
      nextCurrentPageId = parentOfDeleted
    } else {
      nextCurrentPageId = remainingPages[0].id
    }
  }

  return {
    state: {
      ...state,
      pages: remainingPages,
      currentPageId: nextCurrentPageId,
    },
  }
}

/**
 * 四角要素を追加する際の色決定 (9.3, T-002, T-003, T-004)
 * 同一ページ内で追加順に薄い色を自動割り当て
 */
export function getNextRectangleColor(elements: CanvasElement[]) {
  const existingRectangles = elements.filter((el) => el.type === 'rectangle')
  const colorIndex = existingRectangles.length % RECTANGLE_COLORS.length
  return RECTANGLE_COLORS[colorIndex]
}

/**
 * 構成を保存 (15.1-15.4, T-019, T-020, T-021)
 * 最大3件保持、4件目で最古を自動削除
 */
export function takeProjectSnapshot(
  state: ProjectState,
  existingSnapshots: Snapshot[]
): { snapshots: Snapshot[]; newSnapshot: Snapshot } {
  const snapshot: Snapshot = {
    id: generateUUID(),
    projectId: state.project.id,
    createdAt: formatCurrentDateTime(),
    serializedProjectState: JSON.parse(JSON.stringify(state)),
  }

  // 最新を先頭に追加
  const updatedSnapshots = [snapshot, ...existingSnapshots].slice(0, MAX_SNAPSHOTS)

  return {
    snapshots: updatedSnapshots,
    newSnapshot: snapshot,
  }
}

/**
 * 構成の復元 (15.5, T-022)
 */
export function restoreProjectSnapshot(snapshot: Snapshot): ProjectState {
  return JSON.parse(JSON.stringify(snapshot.serializedProjectState))
}
