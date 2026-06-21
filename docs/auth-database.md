# 帳號系統資料庫結構與規則

後端：`backend/`（Go + Gin + GORM），資料庫：PostgreSQL（`cv_auth`）。
三張表都是 GORM `AutoMigrate` 在 `cmd/server/main.go` 啟動時自動建立/更新的，沒有手寫的 migration 檔。

## 資料表

### `users`

帳號本體。

| 欄位 | 型別 | 規則 |
|---|---|---|
| `id` | uuid (PK) | 由後端 `BeforeCreate` hook 產生（`uuid.New()`），不是 DB default |
| `email` | varchar(255) | unique index，必填 |
| `password_hash` | varchar(255) | 必填，**bcrypt 雜湊值**，不是明文密碼 |
| `display_name` | varchar(255) | 必填 |
| `created_at` / `updated_at` | timestamptz | GORM 自動維護 |

**規則：**
- 註冊時 email 格式需通過驗證、密碼長度 ≥ 8 字、display_name 不可空白（`registerRequest` binding tag）。
- Email 唯一性由資料庫的 unique index 把關，不是後端先查再插入 —— 避免併發註冊時的 TOCTOU race。違反時回傳 409。
- 密碼一律用 `bcrypt.GenerateFromPassword`（`internal/auth/password.go`）雜湊後才存，登入時用 `bcrypt.CompareHashAndPassword` 比對。**直接在資料庫塞明文密碼會導致該帳號無法登入。**

### `refresh_tokens`

每次登入/換發 access token 時產生的長效憑證，存在 cookie 裡（明文），資料庫只存雜湊值。

| 欄位 | 型別 | 規則 |
|---|---|---|
| `id` | uuid (PK) | 同上自動產生 |
| `user_id` | uuid | 對應 `users.id`，有 index |
| `token_hash` | varchar(255) | unique index，存的是明文 token 的 SHA-256 雜湊 |
| `expires_at` | timestamptz | 發出時設為 `now + 7 天` |
| `revoked_at` | timestamptz, nullable | 登出或換發新 token 時設為當下時間 |
| `created_at` | timestamptz | |

**規則：**
- 明文 refresh token（32 bytes random hex）只透過 HttpOnly cookie（`refresh_token`，path 限定 `/api/auth`）傳給前端，資料庫只存 SHA-256 雜湊，洩漏資料庫不會直接洩漏可用 token。
- **Token rotation**：每次呼叫 `/api/auth/refresh` 成功後，舊 token 會被標記 `revoked_at`，同時發一組新的 access + refresh token。也就是同一條 refresh token 只能用一次。
- 驗證條件是 `revoked_at IS NULL AND expires_at > now()` 同時成立，兩者缺一都視為無效。
- Access token（JWT，15 分鐘有效）跟這張表無關，是無狀態的，不存 DB，靠 `JWT_SECRET` 簽章驗證。

### `login_records`

登入歷史紀錄（稽核用），不是登入流程必經的判斷依據。

| 欄位 | 型別 | 規則 |
|---|---|---|
| `id` | uuid (PK) | 自動產生 |
| `user_id` | uuid | index |
| `refresh_token_id` | uuid, nullable | index，指向當前有效的 `refresh_tokens.id` |
| `ip_address` | varchar(64) | `c.ClientIP()` |
| `user_agent` | varchar(255) | request header |
| `login_at` | timestamptz | 登入/註冊成功當下 |
| `logout_at` | timestamptz, nullable | 登出時填入，未登出則為 null |

**規則：**
- 註冊、登入成功時各建立一筆。
- Refresh 時不會新增記錄，而是把同一筆記錄的 `refresh_token_id` 改指向新發出的 token（保持「目前這次登入 session」跟最新 refresh token 的對應關係，這樣登出時還能找到它）。
- 這張表的寫入失敗只會記 log，不會讓登入/註冊整體失敗（次要功能，不擋主流程）。

## 後端 API 行為規則

| Endpoint | 驗證 | Rate limit |
|---|---|---|
| `POST /api/auth/register` | email 格式、密碼 ≥8、display_name 必填；email 重複回 409 | IP 限制 5 次/分鐘 |
| `POST /api/auth/login` | email/password 錯誤統一回「invalid email or password」（不洩漏是哪一項錯） | IP 限制 5 次/分鐘 |
| `POST /api/auth/refresh` | 需要有效的 `refresh_token` cookie | IP 限制 5 次/分鐘 |
| `POST /api/auth/logout` | 需要 `Authorization: Bearer <access_token>`；refresh token 必須屬於同一個已驗證的使用者，否則拒絕 | 無 |
| `GET /api/auth/me` | 需要 `Authorization: Bearer <access_token>` | 無 |

- Rate limit 是記憶體內的固定窗口計數器（`internal/middleware/ratelimit.go`），**重啟伺服器或多台伺服器水平擴展時不會共享狀態**，目前只適合單機開發/小流量用。
- CORS 只允許 `ALLOWED_ORIGIN` 環境變數指定的單一來源，且 `AllowCredentials: true`（前端打 API 要帶 `credentials: 'include'` 才能讓 refresh cookie 正常往返）。
- Access token TTL 15 分鐘、Refresh token TTL 7 天，寫死在 `cmd/server/main.go`。

## DBeaver 操作備忘

- 連線資訊：`localhost:5432`，DB `cv_auth`，user `justin`，無密碼，SSL 關閉（對應 `backend/.env` 的 `DATABASE_URL`）。
- 想手動新增使用者：**不要**在 `password_hash` 填明文，要先用 bcrypt 產生雜湊值（或直接用 `/api/auth/register` 讓後端處理），否則該帳號無法登入。
