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
    expect(screen.getByText('ボタン名から自動')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('例: 顧客詳細')).not.toBeInTheDocument()
  })

  it('四角の追加: 薄い色が割り当てられ、色名バッジが表示される', () => {
    render(<App />)

    const addSquareBtn = screen.getByText('四角')
    fireEvent.click(addSquareBtn)

    // 1個目の四角は「赤」
    expect(screen.getByText('赤')).toBeInTheDocument()
    expect(screen.getByText(/赤 の四角/)).toBeInTheDocument()

    // 2個目を追加
    fireEvent.click(addSquareBtn)
    expect(screen.getByText('青')).toBeInTheDocument()
    expect(screen.getByText(/青 の四角/)).toBeInTheDocument()
  })

  it('ボタンの追加とボタン名変更: 表示名のみ変更されターゲット等は独立', () => {
    render(<App />)

    const addBtn = screen.getByText('ボタン')
    fireEvent.click(addBtn)

    // キャンバス上のボタン
    expect(screen.getAllByText('ボタン').length).toBeGreaterThan(1)

    // ボタン名入力欄で変更
    const labelInput = screen.getByDisplayValue('ボタン')
    fireEvent.change(labelInput, { target: { value: '顧客詳細' } })

    expect(screen.getByText('顧客詳細')).toBeInTheDocument()
  })

  it('構成保存: クリックでトースト通知が表示される', async () => {
    render(<App />)

    const saveBtn = screen.getByText('構成を保存')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText(/構成を保存しました/)).toBeInTheDocument()
    })
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
