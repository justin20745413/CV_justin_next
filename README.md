# CV_justin_next

個人作品集 / CV 網站。前端是 Next.js 16（App Router）+ React 19 + Tailwind v4 + next-intl（多語系），帳號系統的後端是獨立的 Go（Gin + GORM）服務 + PostgreSQL。

## 專案結構

```
.
├── app/                  # Next.js 前端（App Router）
├── messages/             # next-intl 多語系文字（zh-TW / en-US）
├── backend/              # Go 帳號系統後端（獨立服務）
└── docs/auth-database.md # 帳號系統的資料表結構與規則文件
```

## 前端指令

```bash
npm install            # 安裝依賴（第一次或 package.json 變動後）

npm run dev             # 啟動開發伺服器，預設 http://localhost:3000
npm run build           # production build
npm run start           # 跑 production build（需先 npm run build）
npm run lint            # eslint 檢查
npm run format          # prettier 自動修正格式
npm run format:check    # prettier 只檢查不修改
```

開發時打開 [http://localhost:3000](http://localhost:3000) 即可看到網站。目前這個 repo 還沒有設定測試框架。

## 後端指令（帳號系統，`backend/`）

### 第一次設定

需要本機有 PostgreSQL 跑著（Homebrew 裝的話用 `brew services start postgresql@18` 啟動），並先建好資料庫：

```bash
createdb cv_auth        # 正式用的資料庫
createdb cv_auth_test   # 跑測試用的資料庫（go test 會用到）
```

複製環境變數範例檔並依本機設定調整（例如 `DATABASE_URL` 裡的使用者名稱）：

```bash
cd backend
cp .env.example .env
```

`.env` 內容說明：

```bash
DATABASE_URL=postgres://localhost:5432/cv_auth?sslmode=disable
TEST_DATABASE_URL=postgres://localhost:5432/cv_auth_test?sslmode=disable
JWT_SECRET=replace-with-a-long-random-string   # 換成真的隨機字串，不要用預設值
ALLOWED_ORIGIN=http://localhost:3000           # 要跟前端實際跑的網址一致（CORS）
PORT=8080
```

### 啟動與開發

```bash
cd backend
go run ./cmd/server     # 啟動後端，預設 http://localhost:8080
```

啟動時會自動跑 GORM 的 `AutoMigrate`，建立/更新 `users`、`refresh_tokens`、`login_records` 三張表，不需要額外手動跑 migration。

```bash
go build ./...           # 編譯檢查，確認可以正常 build
go test ./...             # 跑全部測試（需要 TEST_DATABASE_URL 指到的資料庫存在）
go vet ./...              # 靜態檢查
```

### API 一覽

| Method | Path | 說明 | 需要登入 |
|---|---|---|---|
| POST | `/api/auth/register` | 註冊 | 否 |
| POST | `/api/auth/login` | 登入 | 否 |
| POST | `/api/auth/refresh` | 用 refresh token cookie 換發新的 access token | 否（靠 cookie） |
| POST | `/api/auth/logout` | 登出，撤銷 refresh token | 是 |
| GET | `/api/auth/me` | 取得目前登入使用者資訊 | 是 |

詳細的資料表結構、欄位規則、token 機制請看 [`docs/auth-database.md`](docs/auth-database.md)。

## 本機完整啟動流程

開兩個終端機視窗：

```bash
# 視窗 1：後端
cd backend
go run ./cmd/server

# 視窗 2：前端
npm run dev
```

確認 `backend/.env` 的 `ALLOWED_ORIGIN` 跟前端網址（預設 `http://localhost:3000`）一致，否則登入/註冊會被 CORS 擋掉。

## 資料庫檢視（DBeaver 等工具）

連線設定對應 `backend/.env` 的 `DATABASE_URL`：

| 欄位 | 值 |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `cv_auth` |
| Username | 你的本機帳號（`DATABASE_URL` 裡指定的） |
| Password | 留空 |
| SSL | 關閉 |

⚠️ 手動在資料庫新增使用者時，`password_hash` 不能填明文密碼，必須是 bcrypt 雜湊值，否則該帳號無法登入。建議直接用 `/api/auth/register` 建立測試帳號。

## 部署

前端可以直接部署到 [Vercel](https://vercel.com/new)。後端是獨立服務，需要自己找地方跑 Go 服務 + PostgreSQL（例如 Railway、Fly.io、自架 VM），並把前端的 API base URL 指過去。
