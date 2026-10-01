import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ProjectState,
  CanvasElement,
  ButtonElement,
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
import { Header } from './components/Header'
import { PageListSidebar } from './components/PageListSidebar'
import { PageInfoPanel } from './components/PageInfoPanel'
import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

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
      setIsSidebarOpen(false)
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
        setIsSidebarOpen(false)
      }
    }
  }

  // ページ表示名の更新
  const handleUpdateDisplayName = (displayName: string) => {
    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === prev.currentPageId
          ? { ...p, displayName, updatedAt: new Date().toISOString() }
          : p
      ),
    }))
  }

  // ページコメントの更新 (13.2)
  const handleUpdateComment = (comment: string) => {
    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === prev.currentPageId
          ? { ...p, comment, updatedAt: new Date().toISOString() }
          : p
      ),
    }))
  }

  // ページ削除要求
  const handleRequestDeletePage = () => {
    setPageToDeleteId(currentPage.id)
    setActiveModal('deleteConfirm')
    if (isMobile) {
      setIsInfoPanelOpen(false)
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
  const handleUpdateButtonLabel = (label: string) => {
    if (!selectedElementId) return
    setProjectState((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => {
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
  const handleConfirmCreateChildPage = (displayName: string) => {
    if (!pendingButton) return
    const res = createChildPageFromButton(
      projectState,
      currentPage.id,
      pendingButton.id,
      displayName
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

  // 選択中要素のオブジェクト
  const selectedElement =
    currentElements.find((el) => el.id === selectedElementId) || null

  // 選択中のボタンが指しているページのパス
  const targetPagePath =
    selectedElement && selectedElement.type === 'button' && (selectedElement as ButtonElement).targetPageId
      ? projectState.pages.find(
          (p) => p.id === (selectedElement as ButtonElement).targetPageId
        )?.identifierPath || null
      : null

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
      }}
    >
      {/* 5.1 上部ヘッダー (レスポンシブトグル付き) */}
      <Header
        projectName={projectState.project.name}
        onUpdateProjectName={handleUpdateProjectName}
        onNewProject={handleNewProject}
        onSaveSnapshot={handleSaveSnapshot}
        onOpenSnapshots={() => setActiveModal('snapshots')}
        onOpenSettings={() => setActiveModal('settings')}
        saveToastMessage={toastMessage}
        onToggleSidebar={() => { setIsSidebarOpen((prev) => !prev); setIsInfoPanelOpen(false) }}
        onToggleInfoPanel={() => { setIsInfoPanelOpen((prev) => !prev); setIsSidebarOpen(false) }}
        isSidebarOpen={isSidebarOpen}
        isInfoPanelOpen={isInfoPanelOpen}
      />

      {isMobile && <div className="mobile-page-location">
        {currentPage.parentPageId && <button onClick={() => handleSelectPage(currentPage.parentPageId!)}>← 親へ戻る</button>}
        <div><span>{currentPage.identifierPath}</span><strong>{currentPage.displayName}</strong></div>
        <small>編集は自動保存</small>
      </div>}
      {/* メインワークスペース */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* 左: ページ階層一覧 (デスクトップ時は常時、モバイル時はドロワー) */}
        {!isMobile ? (
          <PageListSidebar
            pages={projectState.pages}
            currentPageId={currentPage.id}
            onSelectPage={handleSelectPage}
            onAddRootPage={handleAddRootPage}
          />
        ) : (
          isSidebarOpen && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.35)',
                zIndex: 45,
                display: 'flex',
              }}
              onClick={() => setIsSidebarOpen(false)}
            >
              <div
                className="drawer-left"
                style={{
                  height: '100%',
                  boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
                  backgroundColor: '#ffffff',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <PageListSidebar
                  pages={projectState.pages}
                  currentPageId={currentPage.id}
                  onSelectPage={handleSelectPage}
                  onAddRootPage={handleAddRootPage}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </div>
            </div>
          )
        )}

        {/* 中央: 白いモックキャンバス + ツールバー */}
        <main
          style={{
            minWidth: 0,
            minHeight: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            position: 'relative',
          }}
        >
          <Canvas
            key={currentPage.id}
            isMobile={isMobile}
            elements={currentElements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            onButtonClick={handleButtonClick}
          />

          {isMobile && selectedElement && <details className="mobile-element-size" key={selectedElement.id}>
            <summary>位置・サイズを数値で調整</summary>
            <div>{(['x', 'y', 'width', 'height'] as const).map((field) => <label key={field}>
              {{ x: '左から', y: '上から', width: '幅', height: '高さ' }[field]}
              <input type="number" inputMode="numeric" min={field === 'x' || field === 'y' ? 0 : 40} value={selectedElement[field]} onChange={e => {
                if (e.target.value === '') return
                const value = Number(e.target.value)
                if (!Number.isFinite(value)) return
                const next = Math.max(field === 'x' || field === 'y' ? 0 : 40, Math.round(value))
                const updated = { ...selectedElement, [field]: next, updatedAt: new Date().toISOString() }
                if (selectedElement.type === 'image' && selectedElement.keepAspectRatio) {
                  if (field === 'width') updated.height = Math.max(40, Math.round(next * selectedElement.height / selectedElement.width))
                  if (field === 'height') updated.width = Math.max(40, Math.round(next * selectedElement.width / selectedElement.height))
                }
                handleUpdateElement(updated)
              }} />
            </label>)}</div>
          </details>}
          {/* 下部: ツールバー ([四角] [画像] [ボタン] 等) */}
          <Toolbar
            onAddRectangle={handleAddRectangle}
            onAddImage={handleAddImage}
            onAddButton={handleAddButton}
            selectedElement={selectedElement}
            onDeleteSelected={handleDeleteSelectedElement}
            onUpdateButtonLabel={handleUpdateButtonLabel}
            onTriggerButtonAction={handleButtonClick}
            targetPagePath={targetPagePath}
          />
        </main>

        {/* 右: ページ情報 (デスクトップ時は常時、モバイル時はドロワー) */}
        {!isMobile ? (
          <PageInfoPanel
            page={currentPage}
            isOnlyPage={projectState.pages.length <= 1}
            onUpdateDisplayName={handleUpdateDisplayName}
            onUpdateComment={handleUpdateComment}
            onRequestDeletePage={handleRequestDeletePage}
          />
        ) : (
          isInfoPanelOpen && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.35)',
                zIndex: 45,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
              onClick={() => setIsInfoPanelOpen(false)}
            >
              <div
                className="drawer-right"
                style={{
                  height: '100%',
                  boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
                  backgroundColor: '#ffffff',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <PageInfoPanel
                  page={currentPage}
                  isOnlyPage={projectState.pages.length <= 1}
                  onUpdateDisplayName={handleUpdateDisplayName}
                  onUpdateComment={handleUpdateComment}
                  onRequestDeletePage={handleRequestDeletePage}
                  onClose={() => setIsInfoPanelOpen(false)}
                />
              </div>
            </div>
          )
        )}
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
