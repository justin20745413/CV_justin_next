# 登入/註冊 UI — Design Spec

Date: 2026-06-18

## 背景與目標

[[2026-06-18-go-auth-backend-design]]（Go 後端認證基礎架構）已完成並合併，提供 `AuthContext`（`app/contexts/AuthContext.tsx`）作為前端的認證狀態管理與 API 串接邏輯（`login`/`register`/`logout`/`user`/`accessToken`/`isLoading`）。但目前沒有任何畫面元件呼叫這個 context，Nav 上也沒有登入入口。

本次子專案的目標：把 `AuthContext` 接上實際的登入/註冊 UI 與 Nav 的登入狀態顯示，讓訪客可以透過畫面完成註冊、登入、登出。

## 範圍

- 一個可在登入/註冊模式間切換的 Modal 表單元件
- Nav 整合：未登入時顯示「登入」入口；已登入時顯示顯示名稱與「登出」按鈕
- 中/英文 i18n 文字（沿用既有 next-intl 架構）
- 手動驗證（專案目前沒有前端自動化測試執行器）

不包含：忘記密碼、Email 驗證、OAuth 第三方登入、會員專區頁面（這些留給後續子專案）。

## 元件結構

```
app/
├── contexts/AuthContext.tsx        （已存在，不修改）
├── components/auth/
│   ├── AuthModal.tsx                Modal 容器：管理開/關 + 登入/註冊模式切換
│   ├── LoginForm.tsx                 登入表單（email + password）
│   └── RegisterForm.tsx              註冊表單（email + password + display_name）
└── components/layout/Nav.tsx        （修改）新增登入/已登入狀態顯示與開啟 Modal 的觸發器
```

`AuthModal` 自己管理「開/關」與「目前是登入還是註冊模式」這兩個 state。`Nav` 只需要一個 `isAuthModalOpen` state 來控制要不要渲染它。`LoginForm`/`RegisterForm` 各自管理輸入欄位與提交時的 loading/錯誤狀態，呼叫 `useAuth()` 的 `login()`/`register()`，成功後呼叫父層傳入的 `onSuccess`（由 `AuthModal` 傳入，內部呼叫 `onClose`）。

## Nav 整合

`Nav.tsx` 新增：

- `const { user, logout } = useAuth();` 與 `const [authModalOpen, setAuthModalOpen] = useState(false);`
- 未登入時，在現有的「語言切換/主題切換」按鈕群組旁加一個「登入」文字按鈕，點擊後 `setAuthModalOpen(true)`。
- 已登入時，改顯示 `display_name` + 一個「登出」按鈕，點擊呼叫 `logout()`（不需要再開 modal）。
- 在 `<nav>` 結尾渲染 `{authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}`。這個按鈕區塊本身位於 desktop/mobile 共用的「Right controls」區，沿用現有版面即可。
- `mounted` 為 `false` 時的 skeleton 版本不需要修改：登入狀態需要等 `AuthProvider` 的 `isLoading` 結束才有意義，維持現有的 hydration-safe 寫法。

## i18n 文字

新增 `messages/zh-TW/auth.json` 與 `messages/en-US/auth.json`，並在 `intl/request.ts` 加入這個新 namespace 的 import（與現有 home/banner/about 相同的做法）。內容大致包含：

```json
{
  "Auth": {
    "loginTitle": "登入",
    "registerTitle": "註冊",
    "email": "Email",
    "password": "密碼",
    "displayName": "顯示名稱",
    "loginButton": "登入",
    "registerButton": "註冊",
    "switchToRegister": "還沒有帳號？註冊",
    "switchToLogin": "已經有帳號？登入",
    "loggingIn": "登入中...",
    "registering": "註冊中...",
    "navLogin": "登入",
    "navLogout": "登出",
    "greeting": "你好，{name}"
  }
}
```

`Auth.navLogin`/`Auth.navLogout`/`Auth.greeting` 由 Nav 使用；其餘鍵由 `AuthModal`/`LoginForm`/`RegisterForm` 使用。這個 namespace 由 Nav 與 Auth 元件共用。

## 錯誤處理與 Loading 狀態

`LoginForm`/`RegisterForm` 內部各自管理 `isSubmitting` 與 `errorMessage` 兩個 state：

- 提交時設 `isSubmitting = true`、清空 `errorMessage`，呼叫 `useAuth()` 的 `login`/`register`。
- 失敗時（`AuthContext` 的 `login`/`register` 會 `throw new Error(message)`），把 `error.message` 顯示在表單上方的錯誤區塊，並把 `isSubmitting` 設回 `false`。
- 成功時呼叫 `onSuccess()`，不需要自己清空欄位——modal 關閉、元件卸載即可。
- 按鈕在 `isSubmitting` 為真時顯示 loading 文字（`Auth.loggingIn`/`Auth.registering`）並 disable，避免重複送出。

## 測試/驗證方式

專案目前沒有前端測試執行器（見根目錄 `CLAUDE.md`），延用既有慣例採手動驗證：

- `npm run build` 確認 TypeScript 編譯與 Next.js build 無誤。
- 啟動 Go 後端（`go run ./cmd/server`）與 `npm run dev`，在瀏覽器手動跑過：未登入時點 Nav「登入」→ 開 modal → 切換到註冊 → 註冊成功 → modal 自動關閉、Nav 顯示名稱 → 點「登出」→ Nav 變回「登入」。
- 確認重新整理頁面後（若 refresh token cookie 仍有效）會自動恢復登入狀態——這是 `AuthContext` 已有的 mount-time refresh 邏輯，這次只驗證 UI 是否正確反映該狀態。
