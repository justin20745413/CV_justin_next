# Backend 架構指引(Go)

這份文件給未來的 Claude Code 與開發者參考,描述 `/backend` 的整體架構與慣例。隨著新功能加入請持續更新本文件。

## 技術棧

- Go + [Gin](https://github.com/gin-gonic/gin)(web 框架)
- [GORM](https://gorm.io/)(ORM)+ PostgreSQL(資料庫,本機已安裝,非 Docker)
- JWT(access token + refresh token 雙 token 機制)
- bcrypt(密碼雜湊)

## 目錄結構

```
backend/
├── cmd/server/main.go     程式進入點,啟動 Gin 伺服器
├── internal/
│   ├── handlers/           Gin route handlers(每個資源一個檔案,例如 auth.go)
│   ├── models/              GORM models(User, RefreshToken, LoginRecord ...)
│   ├── middleware/          JWT 驗證、rate limit 等 middleware
│   ├── auth/                JWT 簽發/驗證、bcrypt 雜湊邏輯
│   └── db/                  GORM 連線初始化與 migration
└── go.mod
```

`internal/` 下的套件僅限本模組使用,不對外公開,這是 Go 的慣例做法。

## 認證架構

- **Access token**:JWT,有效期 15 分鐘,前端存於 memory,不落地 cookie/localStorage。
- **Refresh token**:有效期 7 天,雜湊後存於 `refresh_tokens` 表,以 httpOnly cookie 形式發給前端;每次 refresh 會輪換(撤銷舊的、發新的)。
- **登入/登出紀錄**:每次登入寫入 `login_records`,登出或 refresh token 失效時回填 `logout_at`。
- 詳細資料表設計與 API 端點規格見 `docs/superpowers/specs/2026-06-18-go-auth-backend-design.md`。

## API 慣例

- 路由前綴 `/api/...`。
- 統一錯誤回應格式:`{ "error": "message" }`,搭配對應 HTTP status code。
- 需要登入的端點透過 `internal/middleware` 的 JWT middleware 驗證 `Authorization: Bearer <token>`。
- 登入/註冊端點掛載 IP-based rate limit middleware(in-memory,非 Redis)。

## CORS

後端需設定 CORS 允許前端 origin,並開放 `credentials`,讓 httpOnly refresh token cookie 能在跨來源請求中正確帶送。

## 環境變數

- 資料庫連線字串、JWT signing secret 等敏感資訊透過環境變數注入,不寫入程式碼或提交至 git。
