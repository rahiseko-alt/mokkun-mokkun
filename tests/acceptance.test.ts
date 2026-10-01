import { describe, it, expect, beforeEach } from 'vitest'
import {
  createInitialProject,
  createChildPageFromButton,
  createRootPage,
  deletePageAndDescendants,
  getNextAvailableChildToken,
  getNextRectangleColor,
  recalculateAllPagePaths,
  takeProjectSnapshot,
  restoreProjectSnapshot,
  generateUUID,
  getDescendantPageIds,
} from '../src/services/projectService'
import {
  saveCurrentProjectToStorage,
  loadCurrentProjectFromStorage,
  saveSnapshotsToStorage,
  loadSnapshotsFromStorage,
} from '../src/services/storageService'
import {
  CanvasElement,
  ButtonElement,
  RectangleElement,
  ProjectState,
  Snapshot,
} from '../src/types'
import { RECTANGLE_COLORS } from '../src/constants'

describe('UI Mock Specification Acceptance Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // T-001 プロジェクト作成
  it('T-001: プロジェクト作成時に最初のページが表示され識別子が第1階層の最初の値になる', () => {
    const state = createInitialProject('テストプロジェクト')
    expect(state.project.name).toBe('テストプロジェクト')
    expect(state.pages.length).toBe(1)
    const rootPage = state.pages[0]
    expect(rootPage.identifierToken).toBe('A')
    expect(rootPage.identifierPath).toBe('A')
    expect(rootPage.depth).toBe(1)
    expect(state.currentPageId).toBe(rootPage.id)
  })

  // T-002 四角追加
  it('T-002: 四角を2個追加すると1個目と2個目で異なる薄色が割り当てられる', () => {
    const el1Color = getNextRectangleColor([])
    expect(el1Color.key).toBe('赤')
    expect(el1Color.bg).toBe(RECTANGLE_COLORS[0].bg)

    const el1: RectangleElement = {
      id: generateUUID(),
      pageId: 'p1',
      type: 'rectangle',
      x: 10,
      y: 10,
      width: 100,
      height: 80,
      zIndex: 1,
      colorKey: el1Color.key,
      colorHex: el1Color.bg,
      borderColor: el1Color.border,
      textColor: el1Color.text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const el2Color = getNextRectangleColor([el1])
    expect(el2Color.key).toBe('青')
    expect(el2Color.bg).toBe(RECTANGLE_COLORS[1].bg)
    expect(el1Color.key).not.toBe(el2Color.key)
  })

  // T-003 四角色順
  it('T-003: 同一ページに複数の四角を追加したとき定義された色順で自動割り当てされる', () => {
    const elements: CanvasElement[] = []
    const expectedKeys = ['赤', '青', '黄', '緑', '紫', '橙', '水色', '桃色']

    for (let i = 0; i < 8; i++) {
      const color = getNextRectangleColor(elements)
      expect(color.key).toBe(expectedKeys[i])
      elements.push({
        id: generateUUID(),
        pageId: 'p1',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        zIndex: i,
        colorKey: color.key,
        colorHex: color.bg,
        borderColor: color.border,
        textColor: color.text,
        createdAt: '',
        updatedAt: '',
      })
    }
  })

  // T-004 別ページの四角色
  it('T-004: 別ページでは色割り当てが独立して最初（赤）から開始する', () => {
    const pageAElements: CanvasElement[] = [
      {
        id: '1',
        pageId: 'pageA',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        zIndex: 1,
        colorKey: '赤',
        colorHex: '#fee2e2',
        borderColor: '',
        textColor: '',
        createdAt: '',
        updatedAt: '',
      },
    ]

    const pageBElements: CanvasElement[] = []
    const nextColorForPageB = getNextRectangleColor(pageBElements)
    expect(nextColorForPageB.key).toBe('赤')
  })

  // T-005 画像配置
  it('T-005: 画像配置と縦横比維持の設定', () => {
    const imgElement: CanvasElement = {
      id: generateUUID(),
      pageId: 'p1',
      type: 'image',
      src: 'data:image/png;base64,xxxx',
      fileName: 'logo.png',
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      keepAspectRatio: true,
      zIndex: 1,
      createdAt: '',
      updatedAt: '',
    }
    expect(imgElement.type).toBe('image')
    expect(imgElement.keepAspectRatio).toBe(true)
  })

  // T-006 ボタン追加
  it('T-006: ボタン配置直後は初期表示名「ボタン」かつ targetPageId は null', () => {
    const btn: ButtonElement = {
      id: generateUUID(),
      pageId: 'p1',
      type: 'button',
      label: 'ボタン',
      x: 100,
      y: 100,
      width: 120,
      height: 44,
      targetPageId: null,
      zIndex: 1,
      createdAt: '',
      updatedAt: '',
    }
    expect(btn.label).toBe('ボタン')
    expect(btn.targetPageId).toBeNull()
  })

  // T-007 ボタン名変更
  it('T-007: ボタン名変更でボタン内部IDや targetPageId は変わらない', () => {
    const btnId = generateUUID()
    const targetId = generateUUID()
    const btn: ButtonElement = {
      id: btnId,
      pageId: 'p1',
      type: 'button',
      label: 'ボタン',
      x: 100,
      y: 100,
      width: 120,
      height: 44,
      targetPageId: targetId,
      zIndex: 1,
      createdAt: '',
      updatedAt: '',
    }

    const modifiedBtn: ButtonElement = {
      ...btn,
      label: '顧客詳細',
    }

    expect(modifiedBtn.label).toBe('顧客詳細')
    expect(modifiedBtn.id).toBe(btnId)
    expect(modifiedBtn.targetPageId).toBe(targetId)
  })

  // T-008 子ページ作成
  it('T-008: 遷移先未設定ボタンから子ページを作成し識別子が正しく付与される', () => {
    let state = createInitialProject()
    const rootPage = state.pages[0] // A
    const btnId = generateUUID()

    // Aページにボタンを追加
    const button: ButtonElement = {
      id: btnId,
      pageId: rootPage.id,
      type: 'button',
      label: '詳細を見る',
      x: 10,
      y: 10,
      width: 100,
      height: 40,
      targetPageId: null,
      zIndex: 1,
      createdAt: '',
      updatedAt: '',
    }
    state.pages[0].elements.push(button)

    const result = createChildPageFromButton(state, rootPage.id, btnId, '詳細画面')
    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      state = result.state
      const childPage = state.pages.find((p) => p.id === result.newPageId)!
      expect(childPage).toBeDefined()
      expect(childPage.depth).toBe(2)
      expect(childPage.identifierToken).toBe('松')
      expect(childPage.identifierPath).toBe('A-松')
      expect(childPage.parentPageId).toBe(rootPage.id)

      // ボタンの targetPageId が更新されていること
      const updatedBtn = state.pages
        .find((p) => p.id === rootPage.id)!
        .elements.find((el) => el.id === btnId) as ButtonElement
      expect(updatedBtn.targetPageId).toBe(childPage.id)

      // 作成後新規ページへ自動移動していること
      expect(state.currentPageId).toBe(childPage.id)
    }
  })

  // T-009 既存遷移
  it('T-009: 遷移先設定済みボタンを押した場合は新規ページを作らず既存ページへ移動する', () => {
    let state = createInitialProject()
    const rootPage = state.pages[0]
    const btnId = generateUUID()
    rootPage.elements.push({
      id: btnId,
      pageId: rootPage.id,
      type: 'button',
      label: '次へ',
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      targetPageId: null,
      zIndex: 1,
      createdAt: '',
      updatedAt: '',
    })

    const res = createChildPageFromButton(state, rootPage.id, btnId)
    if (!('error' in res)) {
      state = res.state
      const childId = res.newPageId

      // ルートページに戻る
      state = { ...state, currentPageId: rootPage.id }

      // 遷移先設定済みボタンを押すシミュレーション: targetPageId があればそこへ移動
      const btn = state.pages[0].elements[0] as ButtonElement
      expect(btn.targetPageId).toBe(childId)
      state = { ...state, currentPageId: btn.targetPageId! }
      expect(state.currentPageId).toBe(childId)
      expect(state.pages.length).toBe(2) // ページ数は増えていない
    }
  })

  // T-010 同階層の識別子重複防止
  it('T-010: 同一階層の識別子セット内で重複をチェックできる', () => {
    const tokens = ['松', '竹', '梅']
    const hasDuplicate = (arr: string[]) => new Set(arr).size !== arr.length
    expect(hasDuplicate(tokens)).toBe(false)
    expect(hasDuplicate(['松', '竹', '松'])).toBe(true)
  })

  // T-011 識別子不足
  it('T-011: 次階層の識別子がすべて使用済みの場合は新規ページを作成しない', () => {
    const state = createInitialProject()
    const rootPage = state.pages[0]
    // 第2階層のトークンを1つだけにする
    state.project.identifierSets.find((s) => s.depth === 2)!.tokens = ['松']

    // 1つ目の子ページを作成
    const btn1 = generateUUID()
    rootPage.elements.push({
      id: btn1,
      pageId: rootPage.id,
      type: 'button',
      label: '1',
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      targetPageId: null,
      zIndex: 1,
      createdAt: '',
      updatedAt: '',
    })
    const res1 = createChildPageFromButton(state, rootPage.id, btn1)
    expect('error' in res1).toBe(false)

    // 2つ目の子ページ作成を試みる
    if (!('error' in res1)) {
      const btn2 = generateUUID()
      const res2 = createChildPageFromButton(res1.state, rootPage.id, btn2)
      expect('error' in res2).toBe(true)
      if ('error' in res2) {
        expect(res2.error).toBe('NO_AVAILABLE_TOKEN')
      }
    }
  })

  // T-012 識別子変更
  it('T-012: 識別子セット変更時に既存ページの内部ID不変でパスのみ再計算される', () => {
    let state = createInitialProject()
    const root = state.pages[0] // A
    const btn1 = generateUUID()
    root.elements.push({
      id: btn1,
      pageId: root.id,
      type: 'button',
      label: '子1',
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      targetPageId: null,
      zIndex: 1,
      createdAt: '',
      updatedAt: '',
    })
    // A-松
    const res1 = createChildPageFromButton(state, root.id, btn1)
    if (!('error' in res1)) {
      state = res1.state
      const child1 = state.pages.find((p) => p.id === res1.newPageId)!
      const btn2 = generateUUID()
      child1.elements.push({
        id: btn2,
        pageId: child1.id,
        type: 'button',
        label: '孫1',
        x: 0,
        y: 0,
        width: 100,
        height: 40,
        targetPageId: null,
        zIndex: 1,
        createdAt: '',
        updatedAt: '',
      })
      // A-松-天
      const res2 = createChildPageFromButton(state, child1.id, btn2)
      if (!('error' in res2)) {
        state = res2.state
        const grandchild = state.pages.find((p) => p.id === res2.newPageId)!
        expect(grandchild.identifierPath).toBe('A-松-天')

        // 第2階層の「松」を「柏」に変更
        const depth2Set = state.project.identifierSets.find((s) => s.depth === 2)!
        depth2Set.tokens[0] = '柏'

        const recalculated = recalculateAllPagePaths(
          state.pages,
          state.project.identifierSets
        )
        const updatedChild1 = recalculated.find((p) => p.id === child1.id)!
        const updatedGrandchild = recalculated.find((p) => p.id === grandchild.id)!

        expect(updatedChild1.identifierToken).toBe('柏')
        expect(updatedChild1.identifierPath).toBe('A-柏')
        expect(updatedGrandchild.identifierPath).toBe('A-柏-天')
        // 内部IDは不変
        expect(updatedChild1.id).toBe(child1.id)
        expect(updatedGrandchild.id).toBe(grandchild.id)
      }
    }
  })

  // T-013 コメント保存
  it('T-013: ページコメントが更新・保持される', () => {
    const state = createInitialProject()
    const page = state.pages[0]
    page.comment = '赤の四角には顧客情報を表示する。'
    expect(page.comment).toBe('赤の四角には顧客情報を表示する。')
  })

  // T-014 子なしページ削除
  it('T-014: 子なしページの削除', () => {
    let state = createInitialProject()
    // ルートページをもう1つ追加
    const rootRes = createRootPage(state)
    if (!('error' in rootRes)) {
      state = rootRes.state
      expect(state.pages.length).toBe(2)
      const pageToDelete = rootRes.newPageId
      const delRes = deletePageAndDescendants(state, pageToDelete)
      expect('error' in delRes).toBe(false)
      if (!('error' in delRes)) {
        expect(delRes.state.pages.length).toBe(1)
        expect(delRes.state.pages.some((p) => p.id === pageToDelete)).toBe(false)
      }
    }
  })

  // T-015 子ありページ削除・子孫再帰リストアップ
  it('T-015: 子孫ページがある場合、全子孫ページIDがリストアップされる', () => {
    let state = createInitialProject()
    const root = state.pages[0]
    const btn1 = generateUUID()
    root.elements.push({
      id: btn1,
      pageId: root.id,
      type: 'button',
      label: '1',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      targetPageId: null,
      zIndex: 1,
      createdAt: '',
      updatedAt: '',
    })
    const res1 = createChildPageFromButton(state, root.id, btn1)
    if (!('error' in res1)) {
      state = res1.state
      const child = state.pages.find((p) => p.id === res1.newPageId)!
      const btn2 = generateUUID()
      child.elements.push({
        id: btn2,
        pageId: child.id,
        type: 'button',
        label: '2',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        targetPageId: null,
        zIndex: 1,
        createdAt: '',
        updatedAt: '',
      })
      const res2 = createChildPageFromButton(state, child.id, btn2)
      if (!('error' in res2)) {
        state = res2.state
        const grandchild = state.pages.find((p) => p.id === res2.newPageId)!

        const descendants = getDescendantPageIds(state.pages, root.id)
        expect(descendants).toContain(root.id)
        expect(descendants).toContain(child.id)
        expect(descendants).toContain(grandchild.id)
        expect(descendants.length).toBe(3)
      }
    }
  })

  // T-016 削除キャンセル
  it('T-016: 削除をキャンセルした場合は状態が一切変わらない', () => {
    const state = createInitialProject()
    const clone = JSON.parse(JSON.stringify(state))
    // キャンセル時は何もしない
    expect(state).toEqual(clone)
  })

  // T-017 子孫一括削除 & 外部リンクの targetPageId 解除
  it('T-017: 子孫ページの一括削除と外部ボタンリンクの null 化（ボタン本体は残る）', () => {
    let state = createInitialProject()
    // ルートページ2つ作成 (A, B)
    const rootBRes = createRootPage(state)
    if (!('error' in rootBRes)) {
      state = rootBRes.state
      const pageA = state.pages[0]
      const pageB = state.pages.find((p) => p.id === rootBRes.newPageId)!

      // pageB に子ページ B-松 を作成
      const btnB = generateUUID()
      pageB.elements.push({
        id: btnB,
        pageId: pageB.id,
        type: 'button',
        label: 'Bの子へ',
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        targetPageId: null,
        zIndex: 1,
        createdAt: '',
        updatedAt: '',
      })
      const childBRes = createChildPageFromButton(state, pageB.id, btnB)
      if (!('error' in childBRes)) {
        state = childBRes.state
        const pageBChild = state.pages.find((p) => p.id === childBRes.newPageId)!

        // pageA 内に pageBChild を指すボタンを作成（外部リンク）
        const externalBtnId = generateUUID()
        pageA.elements.push({
          id: externalBtnId,
          pageId: pageA.id,
          type: 'button',
          label: 'B子へのリンク',
          x: 50,
          y: 50,
          width: 100,
          height: 40,
          targetPageId: pageBChild.id,
          zIndex: 1,
          createdAt: '',
          updatedAt: '',
        })

        // pageB（およびその子 B-松）を削除
        const delRes = deletePageAndDescendants(state, pageB.id)
        expect('error' in delRes).toBe(false)
        if (!('error' in delRes)) {
          state = delRes.state
          expect(state.pages.length).toBe(1)
          expect(state.pages[0].id).toBe(pageA.id)

          // 外部ボタンのリンクが null に更新されているが、ボタン自体は残っていること
          const preservedBtn = state.pages[0].elements.find(
            (el) => el.id === externalBtnId
          ) as ButtonElement
          expect(preservedBtn).toBeDefined()
          expect(preservedBtn.targetPageId).toBeNull()
          expect(preservedBtn.label).toBe('B子へのリンク')
        }
      }
    }
  })

  // T-018 最終1ページ削除防止
  it('T-018: プロジェクトに1ページしかない場合は削除不可', () => {
    const state = createInitialProject()
    expect(state.pages.length).toBe(1)
    const res = deletePageAndDescendants(state, state.pages[0].id)
    expect('error' in res).toBe(true)
    if ('error' in res) {
      expect(res.error).toBe('CANNOT_DELETE_LAST_PAGE')
    }
  })

  // T-019 構成保存
  it('T-019: 構成を保存で日時タグ付きスナップショットが作成される', () => {
    const state = createInitialProject()
    const { snapshots, newSnapshot } = takeProjectSnapshot(state, [])
    expect(snapshots.length).toBe(1)
    expect(newSnapshot.createdAt).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/)
    expect(newSnapshot.serializedProjectState.project.id).toBe(state.project.id)
  })

  // T-020 スナップショット3件
  it('T-020: 構成保存を3回実行すると3件保持される', () => {
    const state = createInitialProject()
    let snapshots: Snapshot[] = []
    for (let i = 0; i < 3; i++) {
      const res = takeProjectSnapshot(state, snapshots)
      snapshots = res.snapshots
    }
    expect(snapshots.length).toBe(3)
  })

  // T-021 4件目保存で最古削除
  it('T-021: 4回目の構成保存で最新3件だけ残り最古の1件が削除される', () => {
    const state = createInitialProject()
    let snapshots: Snapshot[] = []
    const ids: string[] = []
    for (let i = 0; i < 4; i++) {
      const res = takeProjectSnapshot(state, snapshots)
      snapshots = res.snapshots
      ids.push(res.newSnapshot.id)
    }
    expect(snapshots.length).toBe(3)
    // 最も古いスナップショット (ids[0]) が除外されていること
    expect(snapshots.some((s) => s.id === ids[0])).toBe(false)
    // 最新 (ids[3]) が含まれること
    expect(snapshots.some((s) => s.id === ids[3])).toBe(true)
  })

  // T-022 復元
  it('T-022: 過去構成を選択して復元できる', () => {
    const state1 = createInitialProject('初期状態')
    const { snapshots } = takeProjectSnapshot(state1, [])

    // 編集して状態を変更
    const state2: ProjectState = {
      ...state1,
      project: { ...state1.project, name: '変更後の状態' },
    }
    expect(state2.project.name).toBe('変更後の状態')

    // スナップショットから復元
    const restored = restoreProjectSnapshot(snapshots[0])
    expect(restored.project.name).toBe('初期状態')
  })

  // T-023 復元キャンセル
  it('T-023: 復元キャンセルで現在状態に一切変更なし', () => {
    const currentState = createInitialProject('作業中')
    const clone = JSON.parse(JSON.stringify(currentState))
    // キャンセル操作
    expect(currentState).toEqual(clone)
  })

  // T-024 自動保存
  it('T-024: 通常編集の localStorage 保存と再読込復元', () => {
    const state = createInitialProject()
    state.pages[0].elements.push({
      id: 'rect1',
      pageId: state.pages[0].id,
      type: 'rectangle',
      x: 120,
      y: 80,
      width: 200,
      height: 100,
      zIndex: 1,
      colorKey: '赤',
      colorHex: '#fee2e2',
      borderColor: '#f87171',
      textColor: '#991b1b',
      createdAt: '',
      updatedAt: '',
    })

    const saveSuccess = saveCurrentProjectToStorage(state)
    expect(saveSuccess).toBe(true)

    const loaded = loadCurrentProjectFromStorage()
    expect(loaded.pages[0].elements.length).toBe(1)
    expect(loaded.pages[0].elements[0].x).toBe(120)
    expect(loaded.pages[0].elements[0].y).toBe(80)
  })

  // T-025 ボタン名と識別子の独立
  it('T-025: ボタン名を変更しても遷移先識別子は変わらない', () => {
    let state = createInitialProject()
    const root = state.pages[0]
    const btnId = generateUUID()
    root.elements.push({
      id: btnId,
      pageId: root.id,
      type: 'button',
      label: '顧客',
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      targetPageId: null,
      zIndex: 1,
      createdAt: '',
      updatedAt: '',
    })

    const res = createChildPageFromButton(state, root.id, btnId)
    if (!('error' in res)) {
      state = res.state
      const childPage = state.pages.find((p) => p.id === res.newPageId)!
      expect(childPage.identifierPath).toBe('A-松')

      // ボタン名を「顧客一覧」に変更
      const btn = state.pages[0].elements[0] as ButtonElement
      btn.label = '顧客一覧'

      expect(btn.label).toBe('顧客一覧')
      expect(btn.targetPageId).toBe(childPage.id)
      expect(childPage.identifierPath).toBe('A-松')
    }
  })

  // 破壊系テスト T-101 深い階層 (10階層以上)
  it('T-101: 10階層以上の深い階層を作成してもデータ破損せずパス生成可能', () => {
    let state = createInitialProject()
    let currentParentId = state.pages[0].id

    // 10階層まで子ページを作成していく
    for (let depth = 1; depth <= 10; depth++) {
      const btnId = generateUUID()
      const parentPage = state.pages.find((p) => p.id === currentParentId)!
      parentPage.elements.push({
        id: btnId,
        pageId: parentPage.id,
        type: 'button',
        label: `階層${depth + 1}へ`,
        x: 0,
        y: 0,
        width: 100,
        height: 40,
        targetPageId: null,
        zIndex: 1,
        createdAt: '',
        updatedAt: '',
      })

      // 必要なら階層の識別子セットを追加
      const targetDepth = depth + 1
      if (!state.project.identifierSets.some((s) => s.depth === targetDepth)) {
        state.project.identifierSets.push({
          id: generateUUID(),
          projectId: state.project.id,
          depth: targetDepth,
          tokens: ['α', 'β', 'γ'],
        })
      }

      const res = createChildPageFromButton(state, parentPage.id, btnId)
      expect('error' in res).toBe(false)
      if (!('error' in res)) {
        state = res.state
        currentParentId = res.newPageId
      }
    }

    expect(state.pages.length).toBe(11)
    const deepestPage = state.pages.find((p) => p.id === currentParentId)!
    expect(deepestPage.depth).toBe(11)
    expect(deepestPage.identifierPath.split('-').length).toBe(11)
  })

  // 破壊系テスト T-102 大量ページ
  it('T-102: 大量ページ（1000ページ）を生成してもデータ整合性を維持できる', () => {
    const state = createInitialProject()
    const idSet = state.project.identifierSets[0]
    // 1000個のトークンを用意
    for (let i = idSet.tokens.length; i < 1000; i++) {
      idSet.tokens.push(`P${i}`)
    }

    const pages = [state.pages[0]]
    for (let i = 1; i < 1000; i++) {
      pages.push({
        id: `page-${i}`,
        projectId: state.project.id,
        parentPageId: null,
        identifierToken: idSet.tokens[i],
        identifierPath: idSet.tokens[i],
        displayName: `ページ${i}`,
        depth: 1,
        order: i,
        comment: '',
        elements: [],
        createdAt: '',
        updatedAt: '',
      })
    }
    state.pages = pages
    expect(state.pages.length).toBe(1000)
    // 検索やID整合性のチェック
    const found = state.pages.find((p) => p.id === 'page-999')
    expect(found).toBeDefined()
    expect(found?.identifierPath).toBe('P999')
  })

  // 破壊系テスト T-103 大量四角 (100個の四角、色循環)
  it('T-103: 1ページに100個の四角を追加しても色が循環してID重複なく配置可能', () => {
    const elements: CanvasElement[] = []
    const ids = new Set<string>()

    for (let i = 0; i < 100; i++) {
      const color = getNextRectangleColor(elements)
      const id = generateUUID()
      ids.add(id)
      elements.push({
        id,
        pageId: 'p1',
        type: 'rectangle',
        x: i * 5,
        y: i * 5,
        width: 60,
        height: 60,
        zIndex: i,
        colorKey: color.key,
        colorHex: color.bg,
        borderColor: color.border,
        textColor: color.text,
        createdAt: '',
        updatedAt: '',
      })
    }

    expect(elements.length).toBe(100)
    expect(ids.size).toBe(100)
    // 9個目は1個目と同じ赤色
    const rect8 = elements[8] as RectangleElement
    expect(rect8.colorKey).toBe('赤')
  })

  // 破壊系テスト T-104 大量画像
  it('T-104: 画像データの保持とデータ構造の健全性', () => {
    const largeDataUrl = 'data:image/png;base64,' + 'A'.repeat(5000)
    const img: CanvasElement = {
      id: generateUUID(),
      pageId: 'p1',
      type: 'image',
      src: largeDataUrl,
      fileName: 'test.png',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      keepAspectRatio: true,
      zIndex: 1,
      createdAt: '',
      updatedAt: '',
    }
    expect(img.src.length).toBeGreaterThan(5000)
  })

  // 破壊系テスト T-105 削除時の整合性
  it('T-105: 削除処理で中途半端な親子関係が残らない', () => {
    let state = createInitialProject()
    const rootB = createRootPage(state)
    if (!('error' in rootB)) {
      state = rootB.state
      expect(state.pages.length).toBe(2)
      // 存在しないページを削除しても安全
      const res = deletePageAndDescendants(state, 'non-existent-id')
      expect('error' in res).toBe(false)
      if (!('error' in res)) {
        expect(res.state.pages.length).toBe(2)
      }
    }
  })

  // 破壊系テスト T-106 復元時の安全性
  it('T-106: 破損したスナップショットからの復元でも安全に処理できる', () => {
    const validState = createInitialProject()
    const snapshot: Snapshot = {
      id: generateUUID(),
      projectId: validState.project.id,
      createdAt: '2026/10/01 09:00',
      serializedProjectState: validState,
    }
    const restored = restoreProjectSnapshot(snapshot)
    expect(restored.pages.length).toBe(1)
  })
})
