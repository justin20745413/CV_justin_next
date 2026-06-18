# Go 後端認證基礎架構 — Design Spec

Date: 2026-06-18

## 背景與目標

目前專案 (`CV_justin_next`) 是純前端的 Next.js 個人 CV 網站,沒有資料庫與後端服務。
使用者想要開放訪客註冊/登入,未來支援留言板與會員專區,本次 spec 只聚焦在**第一個子專案:認證基礎架構**(註冊/登入/登出/JWT/登入紀錄)。留言板與會員專區留給後續子專案。

此後端同時作為學習 Go 語言的專案。

## 範圍

- 新增 `/backend` 資料夾,使用 Go + Gin + GORM + PostgreSQL
- 註冊、登入、登出、token refresh、取得目前使用者資訊
- 登入/登出紀錄寫入資料庫
- 前端(Next.js)整合:access token 存於 memory(React Context),refresh token 存於 httpOnly cookie,並依到期時間自動續期/自動登出
- login/register 端點加上簡易 IP-based rate limiting

不包含(留給後續子專案):留言板、會員專區/個人資料頁面、Email 驗證、忘記密碼、OAuth 第三方登入。

## 整體架構

```
CV_justin_next/
├── app/              既有 Next.js 前端
├── backend/          新增 Go 後端
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── handlers/   Gin route handlers
│   │   ├── models/     GORM models (User, RefreshToken, LoginRecord)
│   │   ├── middleware/ JWT 驗證、rate limit middleware
│   │   ├── auth/       JWT 簽發/驗證、bcrypt 雜湊
│   │   └── db/         GORM 連線與 migration
│   └── go.mod
```

前端瀏覽器直接呼叫 Go API(例如本地 `http://localhost:8080/api/...`)。Go 端設定 CORS,允許前端 origin 並開放 `credentials`,使 httpOnly cookie 能正常帶送。

## 資料庫表設計(PostgreSQL)

### users
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid (PK) | |
| email | varchar, unique | |
| password_hash | varchar | bcrypt |
| display_name | varchar | |
| created_at / updated_at | timestamp | |

### refresh_tokens
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| token_hash | varchar | 存 hash,不存明文 |
| expires_at | timestamp | |
| revoked_at | timestamp, nullable | 登出時填入,代表此 token 失效 |
| created_at | timestamp | |

### login_records
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| ip_address | varchar | |
| user_agent | varchar | |
| login_at | timestamp | |
| logout_at | timestamp, nullable | 主動登出或 refresh token 失效時回填 |

## API 端點設計

| Method | Path | 說明 | 認證 |
|---|---|---|---|
| POST | `/api/auth/register` | 註冊,回傳 access token + 設定 refresh token cookie | 無 |
| POST | `/api/auth/login` | 登入,驗證密碼,建立 login_records / refresh_tokens,回傳 access token + 設定 httpOnly refresh cookie | 無 |
| POST | `/api/auth/refresh` | 用 refresh token cookie 換發新 access token,並輪換 refresh token | refresh cookie |
| POST | `/api/auth/logout` | 撤銷目前 refresh token、回填 login_records.logout_at、清除 cookie | access token |
| GET | `/api/auth/me` | 回傳目前登入者資訊,驗證 access token 是否有效 | access token |

統一錯誤格式:`{ "error": "message" }`,對應 HTTP status(400 驗證失敗、401 未授權、409 email 已存在、429 超過 rate limit、500 伺服器錯誤)。

`internal/middleware/auth.go` 解析 `Authorization: Bearer <token>`,驗證簽章與過期時間,失敗回 401。

## 認證流程

**註冊**:驗證 email 格式/密碼強度 → bcrypt hash 密碼 → 建立 user → 視為自動登入,簽發 access token(15 分鐘)+ refresh token(7 天,存 DB 並設 httpOnly cookie)→ 寫入 login_records。

**登入**:查 email → bcrypt 比對密碼 → 簽發 access/refresh token(同上)→ 寫入 login_records。

**Refresh**:前端在 access token 過期前(或收到 401 時)呼叫 `/api/auth/refresh` → 後端驗證 cookie 中的 refresh token 是否存在於 DB 且未過期/未撤銷 → 簽發新 access token,並撤銷舊 refresh token、發新的(輪換策略)。

**登出**:呼叫 `/api/auth/logout`(帶 access token)→ 後端撤銷對應 refresh token、回填 login_records.logout_at、清除 cookie → 前端清空 state。

## 前端整合(Next.js)

- 建立 `AuthContext`(React context)保存 access token 與使用者資訊,存於 memory,不使用 localStorage。
- App 啟動時呼叫一次 `/api/auth/refresh`(帶著瀏覽器既有的 refresh cookie):成功則視為已登入並取得 access token;失敗則視為未登入。
- 依 access token 到期時間設定 timer,到期前主動呼叫 refresh;refresh 失敗(代表 refresh token 也過期/被撤銷)則清空 state、導向登入頁面 — 即自動登出。
- 需要登入的 API 呼叫:帶 `Authorization: Bearer <accessToken>` 與 `credentials: 'include'`。

## Rate Limiting

`/api/auth/login` 與 `/api/auth/register` 加上簡易 IP-based rate limit middleware(in-memory token bucket,每 IP 每分鐘最多 5 次),超過回 429。不引入 Redis,僅記憶體實作。

## 本地開發環境

- Postgres:使用本機已安裝的 Postgres,不使用 Docker。
- 部署環境尚未決定,本次先聚焦本機開發。

## 測試考量

- Go 端:對 `internal/auth`(JWT 簽發/驗證、bcrypt)與 handlers(register/login/refresh/logout)寫單元測試,使用測試用 DB 或 mock。
- 前端:AuthContext 的 refresh/自動登出邏輯,可用單元測試模擬 access token 到期情境。
