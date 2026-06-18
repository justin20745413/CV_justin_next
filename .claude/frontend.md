# Frontend 架構指引(Next.js × 後端整合)

這份文件給未來的 Claude Code 與開發者參考,描述 Next.js 前端如何與 `/backend`(Go)整合,特別是認證相關的部分。隨著新功能加入請持續更新本文件。

關於前端本身既有架構(i18n 路由、page/view 分層等)請見專案根目錄的 `CLAUDE.md`,本文件只聚焦在與後端 API 的整合慣例。

## 認證狀態管理

- 建立 `AuthContext`(React context),保存目前使用者資訊與 access token。
- Access token 只存於 memory(React state),**不**存 localStorage,避免 XSS 竊取。
- Refresh token 由後端以 httpOnly cookie 形式管理,前端 JS 完全讀不到內容。

## 自動登入與自動登出

- App 啟動時呼叫一次後端的 `/api/auth/refresh`(瀏覽器會自動帶上既有的 refresh cookie):
  - 成功 → 取得新 access token,視為已登入。
  - 失敗 → 視為未登入,導向登入頁面。
- 依 access token 的到期時間設定計時器,到期前主動呼叫 `/api/auth/refresh` 換新 token。
- 若 refresh 失敗(代表 refresh token 也已過期或被撤銷),清空 `AuthContext` 狀態並導向登入頁 — 即自動登出。

## API 呼叫慣例

- 呼叫需要登入的後端 API 時:
  - 帶上 `Authorization: Bearer <accessToken>` header。
  - 帶上 `credentials: 'include'`,讓 refresh token cookie 能跨來源傳送。
- 後端 API base URL 透過環境變數設定(例如 `NEXT_PUBLIC_API_BASE_URL`),不要寫死在程式碼中。

## 與後端的關係

- 前後端為分離服務,前端不直接存取資料庫,所有資料存取都透過呼叫 `/backend` 的 REST API。
- 後端的資料表設計與 API 規格見 `docs/superpowers/specs/2026-06-18-go-auth-backend-design.md` 與 `.claude/backend.md`。
