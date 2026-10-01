import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ProjectState,
  CanvasElement,
  ButtonElement,
  TextElement,
  DrawTool,
  RectangleElement,
  ImageElement,
  Snapshot,
  IdentifierSet,
} from './types'
import {
  createInitialProject,
  createChildPageFromButton,
  createRootPage,
  deletePageAndDescendants,
  getNextRectangleColor,
  getNextAvailableChildToken,
  recalculateAllPagePaths,
  takeProjectSnapshot,
  restoreProjectSnapshot,
  generateUUID,
  getDescendantPageIds,
} from './services/projectService'
import {
  loadCurrentProjectFromStorage,
  saveCurrentProjectToStorage,
  loadSnapshotsFromStorage,
  saveSnapshotsToStorage,
} from './services/storageService'
import { TEXT_DEFAULT_FONT_SIZE } from './constants'
import { Header } from './components/Header'
import { PageListSidebar } from './components/PageListSidebar'
import { PageInfoPanel } from './components/PageInfoPanel'
import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { X } from 'lucide-react'
import { CreateChildPageModal } from './components/modals/CreateChildPageModal'
import { NoTokenModal } from './components/modals/NoTokenModal'
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal'
import { SnapshotsModal } from './components/modals/SnapshotsModal'
import { SettingsModal } from './components/modals/SettingsModal'

export function App() {
  // プロジェクト状態
  const [projectState, setProjectState] = useState<ProjectState>(() =>
    loadCurrentProjectFromStorage()
  )

  // スナップショット状態
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() =>
    loadSnapshotsFromStorage()
  )

  // 選択中要素ID
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  // トーストメッセージ
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // レスポンシブ用画面幅
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [drawTool, setDrawTool] = useState<DrawTool>('select')

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

  // モバイルでは操作後にパネルを閉じ、描画画面で結果を確認できるようにする
  const withPanelClose = <T extends unknown[]>(action: (...args: T) => void) => (...args: T) => {
    action(...args)
    if (isMobile) setIsPanelOpen(false)
  }

  // モーダル管理
  const [activeModal, setActiveModal] = useState<
    'createPage' | 'noToken' | 'deleteConfirm' | 'snapshots' | 'settings' | null
  >(null)

  // 子ページ作成対象ボタン
  const [pendingButton, setPendingButton] = useState<ButtonElement | null>(null)

  // 削除対象ページ（子孫一覧含む）
  const [pageToDeleteId, setPageToDeleteId] = useState<string | null>(null)

  // 自動保存の監視 (16章)
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    saveCurrentProjectToStorage(projectState)
  }, [projectState])

  // スナップショットの自動保存
  useEffect(() => {
    saveSnapshotsToStorage(snapshots)
  }, [snapshots])

  // 現在のページ
  const currentPage =
    projectState.pages.find((p) => p.id === projectState.currentPageId) ||
    projectState.pages[0]

  // 現在ページの要素リスト
  const currentElements = currentPage?.elements || []

  // トースト表示ヘルパー
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2800)
  }

  // --- ヘッダー操作 ---

  // プロジェクト名更新
  const handleUpdateProjectName = (name: string) => {
    setProjectState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        name,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  // 新規プロジェクト作成
  const handleNewProject = () => {
    if (
      window.confirm(
        '新しいプロジェクトを作成しますか？ 現在の編集内容は破棄されます。（必要に応じて「構成を保存」してください）'
      )
    ) {
      const fresh = createInitialProject()
      setProjectState(fresh)
      setSelectedElementId(null)
      showToast('新しいプロジェクトを作成しました')
    }
  }

  // 構成を保存 (15.1-15.4)
  const handleSaveSnapshot = () => {
    const { snapshots: updatedSnapshots, newSnapshot } = takeProjectSnapshot(
      projectState,
      snapshots
    )
    setSnapshots(updatedSnapshots)
    showToast(`構成を保存しました (${newSnapshot.createdAt})`)
  }

  // 構成の復元 (15.5)
  const handleRestoreSnapshot = (snap: Snapshot) => {
    const restored = restoreProjectSnapshot(snap)
    setProjectState(restored)
    setSelectedElementId(null)
    showToast(`${snap.createdAt} の構成に戻しました`)
  }

  // --- ページ管理操作 ---

  // ページ切り替え
  const handleSelectPage = (pageId: string) => {
    setProjectState((prev) => ({
      ...prev,
      currentPageId: pageId,
    }))
    setSelectedElementId(null)
    if (isMobile) {
      setIsPanelOpen(false)
    }
  }

  // ルートページ追加
  const handleAddRootPage = () => {
    const res = createRootPage(projectState)
    if ('error' in res) {
      setActiveModal('noToken')
    } else {
      setProjectState(res.state)
      setSelectedElementId(null)
      showToast('ルートページを作成しました')
      if (isMobile) {
        setIsPanelOpen(false)
      }
    }
  }

  // ページ削除要求
  const handleRequestDeletePage = () => {
    setPageToDeleteId(currentPage.id)
    setActiveModal('deleteConfirm')
    if (isMobile) {
      setIsPanelOpen(false)
    }
  }

  // ページ削除確定 (14.4)
  const handleConfirmDeletePage = () => {
    if (!pageToDeleteId) return
    const res = deletePageAndDescendants(projectState, pageToDeleteId)
    if ('error' in res) {
      alert('プロジェクトには最低1ページ必要です。このページは削除できません。')
    } else {
      setProjectState(res.state)
      setSelectedElementId(null)
      showToast('ページを削除しました')
    }
    setActiveModal(null)
    setPageToDeleteId(null)
  }

  // --- キャンバス要素操作 ---

  // 四角の追加 (9章, T-002, T-003, T-004)
  const handleAddRectangle = () => {
    const color = getNextRectangleColor(currentElements)
    const newRect: RectangleElement = {
      id: generateUUID(),
      pageId: currentPage.id,
      type: 'rectangle',
      x: 60 + (currentElements.length % 8) * 20,
      y: 60 + (currentElements.length % 8) * 20,
      width: 220,
      height: 140,
      zIndex: currentElements.length + 1,
      colorKey: color.key,
      colorHex: color.bg,
      borderColor: color.border,
      textColor: color.text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === currentPage.id
          ? { ...p, elements: [...p.elements, newRect] }
          : p
      ),
    }))
    setSelectedElementId(newRect.id)
  }

  // 画像の追加 (10章, T-005)
  const handleAddImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      if (!src) return

      const img = new Image()
      img.onload = () => {
        const maxWidth = 360
        const scale = img.width > maxWidth ? maxWidth / img.width : 1
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)

        const newImage: ImageElement = {
          id: generateUUID(),
          pageId: currentPage.id,
          type: 'image',
          src,
          fileName: file.name,
          x: 80,
          y: 80,
          width,
          height,
          keepAspectRatio: true,
          zIndex: currentElements.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        setProjectState((prev) => ({
          ...prev,
          pages: prev.pages.map((p) =>
            p.id === currentPage.id
              ? { ...p, elements: [...p.elements, newImage] }
              : p
          ),
        }))
        setSelectedElementId(newImage.id)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  // ボタンの追加 (11章, T-006)
  const handleAddButton = () => {
    const newBtn: ButtonElement = {
      id: generateUUID(),
      pageId: currentPage.id,
      type: 'button',
      label: 'ボタン',
      x: 100,
      y: 100,
      width: 140,
      height: 44,
      targetPageId: null,
      zIndex: currentElements.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === currentPage.id
          ? { ...p, elements: [...p.elements, newBtn] }
          : p
      ),
    }))
    setSelectedElementId(newBtn.id)
  }

  // テキストの追加 (背景透明・枠のリサイズで折り返し幅を調整)
  const handleAddText = () => {
    const newText: TextElement = {
      id: generateUUID(),
      pageId: currentPage.id,
      type: 'text',
      text: 'テキスト',
      fontSize: TEXT_DEFAULT_FONT_SIZE,
      x: 80 + (currentElements.length % 8) * 20,
      y: 80 + (currentElements.length % 8) * 20,
      width: 200,
      height: 48,
      zIndex: currentElements.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === currentPage.id
          ? { ...p, elements: [...p.elements, newText] }
          : p
      ),
    }))
    setSelectedElementId(newText.id)
  }

  // 鉛筆の線を追加 / 消しゴムで消す
  const handleAddStroke = (points: number[]) => {
    const stroke = { id: generateUUID(), points, width: 3 }
    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === currentPage.id ? { ...p, strokes: [...(p.strokes ?? []), stroke] } : p
      ),
    }))
  }
  const handleRemoveStrokes = (ids: string[]) => {
    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === currentPage.id ? { ...p, strokes: (p.strokes ?? []).filter((st) => !ids.includes(st.id)) } : p
      ),
    }))
  }

  // 選択中要素の更新 (移動・リサイズ)
  const handleUpdateElement = useCallback((updated: CanvasElement) => {
    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => {
        if (p.id === updated.pageId) {
          return {
            ...p,
            elements: p.elements.map((el) =>
              el.id === updated.id ? updated : el
            ),
          }
        }
        return p
      }),
    }))
  }, [])

  // 選択要素の削除 (19.2)
  const handleDeleteSelectedElement = () => {
    if (!selectedElementId) return
    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === currentPage.id
          ? {
              ...p,
              elements: p.elements.filter((el) => el.id !== selectedElementId),
            }
          : p
      ),
    }))
    setSelectedElementId(null)
  }

  // 選択中ボタンのラベル変更 (11.1, T-007)
  // 遷移先ページがあれば、そのページ名もボタン名に揃える
  const handleUpdateButtonLabel = (label: string) => {
    if (!selectedElementId) return
    const targetPageId = currentElements.find(
      (el): el is ButtonElement => el.id === selectedElementId && el.type === 'button'
    )?.targetPageId
    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => {
        if (targetPageId && p.id === targetPageId) {
          return { ...p, displayName: label.trim() || '新規ページ', updatedAt: new Date().toISOString() }
        }
        if (p.id === currentPage.id) {
          return {
            ...p,
            elements: p.elements.map((el) =>
              el.id === selectedElementId && el.type === 'button'
                ? { ...el, label, updatedAt: new Date().toISOString() }
                : el
            ),
          }
        }
        return p
      }),
    }))
  }

  // --- ボタンクリック・遷移・子ページ作成 (12章, T-008, T-009) ---

  const handleButtonClick = (button: ButtonElement) => {
    setSelectedElementId(button.id)

    // 12.4 遷移先がすでに存在する場合: ボタンを押したら、そのページを開く
    if (button.targetPageId) {
      const targetPage = projectState.pages.find((p) => p.id === button.targetPageId)
      if (targetPage) {
        handleSelectPage(button.targetPageId)
        showToast(`${targetPage.identifierPath} へ移動しました`)
        return
      }
    }

    // 12.1 遷移先未設定のボタンを押した場合: 作成確認ダイアログ
    setPendingButton(button)

    // 次階層のトークン利用可否を事前確認 (12.5)
    const next = getNextAvailableChildToken(
      projectState.pages,
      currentPage,
      projectState.project.identifierSets
    )
    if (!next) {
      setActiveModal('noToken')
    } else {
      setActiveModal('createPage')
    }
  }

  // 子ページ作成の確定 (12.1-12.3)
  // ページ名はユーザーに決めさせず、ボタン名をそのまま使う
  const handleConfirmCreateChildPage = () => {
    if (!pendingButton) return
    const currentButton = currentElements.find((el) => el.id === pendingButton.id) as ButtonElement | undefined
    const res = createChildPageFromButton(
      projectState,
      currentPage.id,
      pendingButton.id,
      (currentButton?.label ?? pendingButton.label).trim() || '新規ページ'
    )
    if ('error' in res) {
      setActiveModal('noToken')
    } else {
      setProjectState(res.state)
      setSelectedElementId(null)
      setActiveModal(null)
      setPendingButton(null)
      showToast('子ページを作成しました')
    }
  }

  // --- 識別子セット設定の保存 (7.6, T-012) ---

  const handleSaveIdentifierSets = (updatedSets: IdentifierSet[]) => {
    const updatedPages = recalculateAllPagePaths(projectState.pages, updatedSets)
    setProjectState((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        identifierSets: updatedSets,
        updatedAt: new Date().toISOString(),
      },
      pages: updatedPages,
    }))
    showToast('識別子設定を保存し、ページパスを更新しました')
  }

  // Delete / Backspace キーで選択中の要素を削除 (入力中は除く)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (!selectedElementId || activeModal) return
      e.preventDefault()
      handleDeleteSelectedElement()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // 削除対象ページおよびその子孫一覧の取得 (14.3)
  const descendantPagesToDelete = pageToDeleteId
    ? getDescendantPageIds(projectState.pages, pageToDeleteId)
        .map((id) => projectState.pages.find((p) => p.id === id)!)
        .filter(Boolean)
    : []

  // 作成予定の子ページのパス情報
  const nextChildTokenInfo = getNextAvailableChildToken(
    projectState.pages,
    currentPage,
    projectState.project.identifierSets
  )

  return (
    <div className="bh-app">
      {/* 5.1 上部ヘッダー (モバイル時は操作パネルの開閉ボタン付き) */}
      <Header
        projectName={projectState.project.name}
        onUpdateProjectName={handleUpdateProjectName}
        saveToastMessage={toastMessage}
        isMobile={isMobile}
        onTogglePanel={() => setIsPanelOpen((prev) => !prev)}
        isPanelOpen={isPanelOpen}
      />

      {isMobile && <div className="mobile-page-location">
        {currentPage.parentPageId && <button onClick={() => handleSelectPage(currentPage.parentPageId!)}>← 親へ戻る</button>}
        <div><span>{currentPage.identifierPath}</span><strong>{currentPage.displayName}</strong></div>
      </div>}
      {/* メインワークスペース: 左に描画画面、右に操作パネル (モバイル時はスライドイン) */}
      <div className="bh-workspace">
        <main className="bh-stage">
          <Canvas
            key={currentPage.id}
            isMobile={isMobile}
            elements={currentElements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            onButtonClick={handleButtonClick}
            onUpdateButtonLabel={handleUpdateButtonLabel}
            onDeleteElement={handleDeleteSelectedElement}
            strokes={currentPage.strokes ?? []}
            onAddStroke={handleAddStroke}
            onRemoveStrokes={handleRemoveStrokes}
            tool={drawTool}
            onChangeTool={(next) => { setDrawTool(next); if (next !== 'select') setSelectedElementId(null) }}
          />
        </main>

        {isMobile && <div className={'bh-backdrop' + (isPanelOpen ? ' is-open' : '')} onClick={() => setIsPanelOpen(false)} aria-hidden="true" />}
        <aside
          id="control-panel"
          className={'bh-panel' + (isMobile ? ' is-drawer' : '') + (isMobile && isPanelOpen ? ' is-open' : '')}
          aria-label="操作パネル"
          inert={isMobile && !isPanelOpen}
        >
          {isMobile && <div className="bh-panel-head">
            <strong>操作パネル</strong>
            <button type="button" className="bh-btn bh-btn-small" onClick={() => setIsPanelOpen(false)} aria-label="操作パネルを閉じる"><X size={18} /></button>
          </div>}
          <Toolbar
            onAddRectangle={withPanelClose(handleAddRectangle)}
            onAddImage={withPanelClose(handleAddImage)}
            onAddButton={withPanelClose(handleAddButton)}
            onAddText={withPanelClose(handleAddText)}
            onSaveSnapshot={withPanelClose(handleSaveSnapshot)}
            onOpenSnapshots={withPanelClose(() => setActiveModal('snapshots'))}
            onNewProject={withPanelClose(handleNewProject)}
            onOpenSettings={withPanelClose(() => setActiveModal('settings'))}
          />
          <PageInfoPanel
            page={currentPage}
            isOnlyPage={projectState.pages.length <= 1}
            onRequestDeletePage={handleRequestDeletePage}
          />
          <PageListSidebar
            pages={projectState.pages}
            currentPageId={currentPage.id}
            onSelectPage={handleSelectPage}
            onAddRootPage={handleAddRootPage}
          />
        </aside>
      </div>

      {/* --- モーダル群 --- */}

      {/* ボタンからページを作る確認モーダル */}
      {activeModal === 'createPage' && pendingButton && (
        <CreateChildPageModal
          buttonLabel={pendingButton.label}
          parentPath={currentPage.identifierPath}
          nextPath={nextChildTokenInfo?.path || null}
          onConfirm={handleConfirmCreateChildPage}
          onCancel={() => {
            setActiveModal(null)
            setPendingButton(null)
          }}
        />
      )}

      {/* 識別子不足モーダル */}
      {activeModal === 'noToken' && (
        <NoTokenModal
          onOpenSettings={() => {
            setActiveModal('settings')
          }}
          onCancel={() => {
            setActiveModal(null)
            setPendingButton(null)
          }}
        />
      )}

      {/* ページ削除確認モーダル */}
      {activeModal === 'deleteConfirm' && pageToDeleteId && (
        <DeleteConfirmModal
          pageToDelete={projectState.pages.find((p) => p.id === pageToDeleteId)!}
          descendantPages={descendantPagesToDelete}
          onConfirm={handleConfirmDeletePage}
          onCancel={() => {
            setActiveModal(null)
            setPageToDeleteId(null)
          }}
        />
      )}

      {/* 保存した構成一覧・復元モーダル */}
      {activeModal === 'snapshots' && (
        <SnapshotsModal
          snapshots={snapshots}
          onRestore={handleRestoreSnapshot}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* 識別子セット設定モーダル */}
      {activeModal === 'settings' && (
        <SettingsModal
          identifierSets={projectState.project.identifierSets}
          projectId={projectState.project.id}
          onSave={handleSaveIdentifierSets}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  )
}
export default App
