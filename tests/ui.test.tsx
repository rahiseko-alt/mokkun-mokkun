import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { App } from '../src/App'

describe('UI Mock App Component Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('初期画面の描画: プロジェクト名、識別子A、白いキャンバス、ツールバーが表示される', () => {
    render(<App />)

    // プロジェクト名および新規プロジェクトボタン
    const projectLabels = screen.getAllByText('新しいプロジェクト')
    expect(projectLabels.length).toBeGreaterThanOrEqual(1)

    // ページ一覧
    expect(screen.getByText(/ページ一覧/)).toBeInTheDocument()

    // 初期識別子 A
    const idTokens = screen.getAllByText('A')
    expect(idTokens.length).toBeGreaterThan(0)

    // ツールバー
    expect(screen.getByText('四角')).toBeInTheDocument()
    expect(screen.getByText('画像')).toBeInTheDocument()
    expect(screen.getByText('ボタン')).toBeInTheDocument()

    // 右パネル
    expect(screen.getByText('ページ識別子')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('例: 顧客詳細')).not.toBeInTheDocument()
    expect(screen.queryByText('コメント')).not.toBeInTheDocument()

    // プロジェクト操作はパネルにまとめる
    for (const name of ['保存', '保存一覧', '新規作成', '設定']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    // 描画ツール
    for (const name of ['選択', '鉛筆', '消しゴム']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('四角の追加: 薄い色が割り当てられ、色名バッジが表示される', () => {
    render(<App />)

    const addSquareBtn = screen.getByText('四角')
    fireEvent.click(addSquareBtn)

    // 1個目の四角は「赤」
    expect(screen.getByText('赤')).toBeInTheDocument()

    // 2個目を追加
    fireEvent.click(addSquareBtn)
    expect(screen.getByText('青')).toBeInTheDocument()

    // 選択中の要素は右上の × で削除できる
    fireEvent.click(screen.getByRole('button', { name: '選択中の要素を削除' }))
    expect(screen.queryByText('青')).not.toBeInTheDocument()
    expect(screen.getByText('赤')).toBeInTheDocument()
  })

  it('ボタンの追加とボタン名変更: 表示名のみ変更されターゲット等は独立', () => {
    render(<App />)

    const addBtn = screen.getByText('ボタン')
    fireEvent.click(addBtn)

    // キャンバス上のボタン
    expect(screen.getAllByText('ボタン').length).toBeGreaterThan(1)

    // 選択済みのボタンをもう一度押すと、描画画面上でボタン名を直接変更できる
    const canvasButton = screen.getAllByText('ボタン').find((el) => el.closest('.canvas-region'))!
    fireEvent.pointerDown(canvasButton, { button: 0, pointerId: 1, clientX: 110, clientY: 110 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    const labelInput = screen.getByRole('textbox', { name: 'ボタン名を直接編集' })
    fireEvent.change(labelInput, { target: { value: '顧客詳細' } })
    fireEvent.blur(labelInput)

    expect(screen.getByText('顧客詳細')).toBeInTheDocument()
  })

  it('構成保存: クリックでトースト通知が表示される', async () => {
    render(<App />)

    const saveBtn = screen.getByRole('button', { name: '保存' })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText(/構成を保存しました/)).toBeInTheDocument()
    })
  })

  it('鉛筆で線を描き、消しゴムで消せる', () => {
    const { container } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '鉛筆' }))
    const layer = container.querySelector('.canvas-draw-layer') as Element
    fireEvent.pointerDown(layer, { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(layer, { pointerId: 1, buttons: 1, clientX: 140, clientY: 120 })
    // 描画画面の外で指を離しても線は確定し、その後のホバーでは描き続けない
    fireEvent.pointerUp(window, { pointerId: 1 })
    fireEvent.pointerMove(layer, { pointerId: 1, buttons: 0, clientX: 300, clientY: 300 })
    const paths = container.querySelectorAll('.canvas-draw-layer path')
    expect(paths).toHaveLength(1)
    expect(paths[0].getAttribute('d')).toBe('M100 100 L140 120')

    // 鉛筆中は「鉛筆を終了」で選択に戻れる
    fireEvent.click(screen.getByRole('button', { name: '鉛筆を終了' }))
    expect(screen.queryByRole('button', { name: '鉛筆を終了' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '選択' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: '消しゴム' }))
    fireEvent.pointerDown(layer, { button: 0, pointerId: 2, clientX: 141, clientY: 121 })
    expect(container.querySelectorAll('.canvas-draw-layer path')).toHaveLength(0)
  })

  it('設定モーダルの表示と重複エラーチェック', () => {
    render(<App />)

    const settingsBtn = screen.getByText('設定')
    fireEvent.click(settingsBtn)

    // 設定モーダルのヘッダーとガイド文
    expect(screen.getByText('識別子セット設定')).toBeInTheDocument()
    expect(
      screen.getByText(/声に出して区別しやすい文字・単語を推奨します/)
    ).toBeInTheDocument()

    // トークン追加欄
    const addInput = screen.getByPlaceholderText(/第1階層に識別子を追加/)
    // 既存の 'A' を重複して追加しようとする
    fireEvent.change(addInput, { target: { value: 'A' } })
    fireEvent.keyDown(addInput, { key: 'Enter', code: 'Enter' })

    expect(screen.getByText('同じ階層に同じ識別子は登録できません。')).toBeInTheDocument()
  })
})
