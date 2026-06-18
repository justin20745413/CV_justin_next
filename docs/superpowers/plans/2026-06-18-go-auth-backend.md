# Go 後端認證基礎架構 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/backend` 建立一個 Go (Gin + GORM + PostgreSQL) 服務,提供註冊/登入/登出/refresh/me 五個 API,使用 access token (JWT, 15 分) + refresh token (random token, 7 天, 存 DB 可撤銷) 雙 token 機制,並記錄登入/登出紀錄;同時在 Next.js 前端建立 `AuthContext` 整合這些 API,做到 access token 存 memory、自動 refresh、自動登出。

**Architecture:** 後端採分層結構:`internal/models`(GORM model)→ `internal/auth`(純邏輯:密碼雜湊、JWT、refresh token 產生/雜湊)→ `internal/middleware`(JWT 驗證、rate limit)→ `internal/handlers`(串接以上邏輯與 DB 的 HTTP handler)→ `cmd/server`(wiring)。前端新增 `AuthContext` 包裝 fetch 呼叫與 token 生命週期管理。詳細設計見 `docs/superpowers/specs/2026-06-18-go-auth-backend-design.md`。

**Tech Stack:** Go 1.x, Gin, GORM + `gorm.io/driver/postgres`, `golang-jwt/jwt/v5`, `google/uuid`, `golang.org/x/crypto/bcrypt`, `joho/godotenv`, `gin-contrib/cors`; PostgreSQL(本機已安裝);前端 React Context + Fetch API。

---

## 前置需求

- 本機已安裝 PostgreSQL,且已能用 `psql` 連線。
- 已安裝 Go 1.21+(執行 `go version` 確認)。
- 在開始 Task 7 之前,需先建立兩個本機資料庫:

```bash
createdb cv_auth
createdb cv_auth_test
```

若 `createdb` 指令不存在或權限有誤,改用 `psql -c "CREATE DATABASE cv_auth;"` 與 `psql -c "CREATE DATABASE cv_auth_test;"`。

---

### Task 1: 初始化 Go 專案骨架與相依套件

**Files:**
- Create: `backend/go.mod`(由 `go mod init` 產生)
- Create: `backend/.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: 建立目錄與初始化 go module**

```bash
mkdir -p backend/cmd/server backend/internal/db backend/internal/models backend/internal/auth backend/internal/middleware backend/internal/handlers backend/internal/testutil
cd backend
go mod init cvbackend
```

- [ ] **Step 2: 安裝所有相依套件**

```bash
go get github.com/gin-gonic/gin
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/golang-jwt/jwt/v5
go get github.com/google/uuid
go get golang.org/x/crypto
go get github.com/joho/godotenv
go get github.com/gin-contrib/cors
```

預期:`backend/go.mod` 與新建的 `backend/go.sum` 都會列出上述套件。

- [ ] **Step 3: 建立 `.env.example`**

```
DATABASE_URL=postgres://localhost:5432/cv_auth?sslmode=disable
TEST_DATABASE_URL=postgres://localhost:5432/cv_auth_test?sslmode=disable
JWT_SECRET=replace-with-a-long-random-string
ALLOWED_ORIGIN=http://localhost:3000
PORT=8080
```

若本機 Postgres 設定了使用者/密碼,請依實際情況調整 DSN(例如 `postgres://user:pass@localhost:5432/cv_auth?sslmode=disable`)。

- [ ] **Step 4: 讓 `.env.example` 不被根目錄的 `.env*` 規則忽略**

編輯根目錄 `.gitignore`,在 `# env files` 區塊新增一行:

```diff
 # env files (can opt-in for committing if needed)
 .env*
+!.env.example
+!backend/.env.example
```

- [ ] **Step 5: Commit**

```bash
git add backend/go.mod backend/go.sum backend/.env.example .gitignore
git commit -m "chore: initialize Go backend module and dependencies"
```

(若此時 `backend/go.sum` 因為還沒有任何 import 而是空的也沒關係,後續任務會持續更新它。)

---

### Task 2: 資料庫連線模組

**Files:**
- Create: `backend/internal/db/db.go`

- [ ] **Step 1: 實作 `Connect()`**

```go
// backend/internal/db/db.go
package db

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	conn, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	return conn
}
```

這是單純的連線包裝,沒有業務邏輯,後續會透過 handler 的整合測試間接驗證,不需要獨立單元測試。

- [ ] **Step 2: 確認可編譯**

```bash
cd backend
go build ./...
```

預期:編譯成功,無錯誤。

- [ ] **Step 3: Commit**

```bash
git add backend/internal/db/db.go
git commit -m "feat: add database connection module"
```

---

### Task 3: GORM Models(User / RefreshToken / LoginRecord)

**Files:**
- Create: `backend/internal/models/user.go`
- Create: `backend/internal/models/refresh_token.go`
- Create: `backend/internal/models/login_record.go`

- [ ] **Step 1: 建立 `User` model**

```go
// backend/internal/models/user.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	Email        string    `gorm:"type:varchar(255);uniqueIndex;not null"`
	PasswordHash string    `gorm:"type:varchar(255);not null"`
	DisplayName  string    `gorm:"type:varchar(255);not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
```

- [ ] **Step 2: 建立 `RefreshToken` model**

```go
// backend/internal/models/refresh_token.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`
	TokenHash string    `gorm:"type:varchar(255);not null;uniqueIndex"`
	ExpiresAt time.Time `gorm:"not null"`
	RevokedAt *time.Time
	CreatedAt time.Time
}

func (r *RefreshToken) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
```

- [ ] **Step 3: 建立 `LoginRecord` model**

`RefreshTokenID` 用來連結這筆登入紀錄是由哪一個 refresh token 建立的,讓 `Logout`/`Refresh` 之後可以正確回填 `logout_at`(spec 設計時沒有明確列出這欄,但沒有它登出時無法定位該回填哪一筆紀錄)。

```go
// backend/internal/models/login_record.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LoginRecord struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey"`
	UserID         uuid.UUID  `gorm:"type:uuid;not null;index"`
	RefreshTokenID *uuid.UUID `gorm:"type:uuid;index"`
	IPAddress      string     `gorm:"type:varchar(64)"`
	UserAgent      string     `gorm:"type:varchar(255)"`
	LoginAt        time.Time  `gorm:"not null"`
	LogoutAt       *time.Time
}

func (l *LoginRecord) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}
```

- [ ] **Step 4: 確認可編譯**

```bash
cd backend
go build ./...
```

預期:編譯成功。

- [ ] **Step 5: Commit**

```bash
git add backend/internal/models
git commit -m "feat: add User, RefreshToken, LoginRecord models"
```

---

### Task 4: 密碼雜湊工具(TDD)

**Files:**
- Create: `backend/internal/auth/password.go`
- Test: `backend/internal/auth/password_test.go`

- [ ] **Step 1: 寫失敗測試**

```go
// backend/internal/auth/password_test.go
package auth

import "testing"

func TestHashPassword_ProducesVerifiableHash(t *testing.T) {
	hash, err := HashPassword("correct-password")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if hash == "correct-password" {
		t.Fatal("hash must not equal plaintext password")
	}
	if !CheckPassword(hash, "correct-password") {
		t.Fatal("expected CheckPassword to return true for correct password")
	}
}

func TestCheckPassword_RejectsWrongPassword(t *testing.T) {
	hash, _ := HashPassword("correct-password")
	if CheckPassword(hash, "wrong-password") {
		t.Fatal("expected CheckPassword to return false for wrong password")
	}
}
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
cd backend
go test ./internal/auth/... -run TestHashPassword -v
```

預期:`FAIL`,因為 `HashPassword`/`CheckPassword` 尚未定義(編譯錯誤)。

- [ ] **Step 3: 實作**

```go
// backend/internal/auth/password.go
package auth

import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func CheckPassword(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
go test ./internal/auth/... -v
```

預期:`PASS`。

- [ ] **Step 5: Commit**

```bash
git add backend/internal/auth/password.go backend/internal/auth/password_test.go
git commit -m "feat: add bcrypt password hashing"
```

---

### Task 5: Access Token JWT(TDD)

**Files:**
- Create: `backend/internal/auth/jwt.go`
- Test: `backend/internal/auth/jwt_test.go`

- [ ] **Step 1: 寫失敗測試**

```go
// backend/internal/auth/jwt_test.go
package auth

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestGenerateAndParseAccessToken_RoundTrip(t *testing.T) {
	userID := uuid.New()
	secret := "test-secret"

	token, err := GenerateAccessToken(userID, secret, time.Minute)
	if err != nil {
		t.Fatalf("GenerateAccessToken returned error: %v", err)
	}

	parsedID, err := ParseAccessToken(token, secret)
	if err != nil {
		t.Fatalf("ParseAccessToken returned error: %v", err)
	}
	if parsedID != userID {
		t.Fatalf("expected userID %s, got %s", userID, parsedID)
	}
}

func TestParseAccessToken_RejectsExpiredToken(t *testing.T) {
	userID := uuid.New()
	secret := "test-secret"

	token, err := GenerateAccessToken(userID, secret, -time.Minute)
	if err != nil {
		t.Fatalf("GenerateAccessToken returned error: %v", err)
	}

	if _, err := ParseAccessToken(token, secret); err == nil {
		t.Fatal("expected error for expired token, got nil")
	}
}

func TestParseAccessToken_RejectsWrongSecret(t *testing.T) {
	userID := uuid.New()

	token, err := GenerateAccessToken(userID, "secret-a", time.Minute)
	if err != nil {
		t.Fatalf("GenerateAccessToken returned error: %v", err)
	}

	if _, err := ParseAccessToken(token, "secret-b"); err == nil {
		t.Fatal("expected error for wrong secret, got nil")
	}
}
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
go test ./internal/auth/... -run TestGenerateAndParseAccessToken -v
```

預期:`FAIL`(編譯錯誤,函式未定義)。

- [ ] **Step 3: 實作**

```go
// backend/internal/auth/jwt.go
package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type accessClaims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

func GenerateAccessToken(userID uuid.UUID, secret string, ttl time.Duration) (string, error) {
	claims := accessClaims{
		UserID: userID.String(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseAccessToken(tokenString, secret string) (uuid.UUID, error) {
	claims := &accessClaims{}

	_, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return uuid.Nil, err
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return uuid.Nil, errors.New("invalid user id in token")
	}

	return userID, nil
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
go test ./internal/auth/... -v
```

預期:全部 `PASS`。

- [ ] **Step 5: Commit**

```bash
git add backend/internal/auth/jwt.go backend/internal/auth/jwt_test.go
git commit -m "feat: add JWT access token generation and parsing"
```

---

### Task 6: Refresh Token 產生與雜湊(TDD)

**Files:**
- Create: `backend/internal/auth/refresh_token.go`
- Test: `backend/internal/auth/refresh_token_test.go`

- [ ] **Step 1: 寫失敗測試**

```go
// backend/internal/auth/refresh_token_test.go
package auth

import "testing"

func TestGenerateRefreshToken_ReturnsUniqueValues(t *testing.T) {
	token1, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("GenerateRefreshToken returned error: %v", err)
	}
	token2, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("GenerateRefreshToken returned error: %v", err)
	}
	if token1 == token2 {
		t.Fatal("expected two calls to produce different tokens")
	}
	if len(token1) == 0 {
		t.Fatal("expected non-empty token")
	}
}

func TestHashRefreshToken_IsDeterministicAndDiffersFromInput(t *testing.T) {
	token := "some-refresh-token-value"
	hash1 := HashRefreshToken(token)
	hash2 := HashRefreshToken(token)

	if hash1 != hash2 {
		t.Fatal("expected hashing the same token twice to produce the same hash")
	}
	if hash1 == token {
		t.Fatal("hash must not equal the plaintext token")
	}
}
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
go test ./internal/auth/... -run TestGenerateRefreshToken -v
```

預期:`FAIL`(編譯錯誤)。

- [ ] **Step 3: 實作**

```go
// backend/internal/auth/refresh_token.go
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
)

func GenerateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func HashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
go test ./internal/auth/... -v
```

預期:全部 `PASS`。

- [ ] **Step 5: Commit**

```bash
git add backend/internal/auth/refresh_token.go backend/internal/auth/refresh_token_test.go
git commit -m "feat: add refresh token generation and hashing"
```

---

### Task 7: 測試資料庫輔助工具

**Files:**
- Create: `backend/internal/testutil/db.go`

- [ ] **Step 1: 實作 `NewTestDB`**

```go
// backend/internal/testutil/db.go
package testutil

import (
	"os"
	"testing"

	"cvbackend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func NewTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL not set, skipping database test")
	}

	conn, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect to test database: %v", err)
	}

	if err := conn.AutoMigrate(&models.User{}, &models.RefreshToken{}, &models.LoginRecord{}); err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}

	conn.Exec("TRUNCATE TABLE login_records, refresh_tokens, users CASCADE")

	t.Cleanup(func() {
		conn.Exec("TRUNCATE TABLE login_records, refresh_tokens, users CASCADE")
	})

	return conn
}
```

這是測試基礎設施,不需要再為它寫測試;它會被後面所有 handler 測試使用並間接驗證。

- [ ] **Step 2: 設定本機環境變數並確認可連線**

```bash
cd backend
cp .env.example .env
# 依實際本機 Postgres 設定調整 .env 內的 DATABASE_URL / TEST_DATABASE_URL / JWT_SECRET
export $(grep -v '^#' .env | xargs)
go build ./...
```

預期:編譯成功,無錯誤。`.env` 已被 `.gitignore` 排除,不會被提交。

- [ ] **Step 3: Commit**

```bash
git add backend/internal/testutil/db.go
git commit -m "feat: add test database helper"
```

---

### Task 8: Register Handler(TDD)

**Files:**
- Create: `backend/internal/handlers/auth.go`
- Test: `backend/internal/handlers/auth_test.go`

- [ ] **Step 1: 寫失敗測試**

```go
// backend/internal/handlers/auth_test.go
package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"cvbackend/internal/testutil"

	"github.com/gin-gonic/gin"
)

func newAuthHandler(t *testing.T) *AuthHandler {
	t.Helper()
	db := testutil.NewTestDB(t)
	return &AuthHandler{
		DB:         db,
		JWTSecret:  "test-secret",
		AccessTTL:  15 * time.Minute,
		RefreshTTL: 7 * 24 * time.Hour,
	}
}

func TestRegister_CreatesUserAndReturnsAccessToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)
	router := gin.New()
	router.POST("/api/auth/register", h.Register)

	body, _ := json.Marshal(map[string]string{
		"email":        "alice@example.com",
		"password":     "supersecret123",
		"display_name": "Alice",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp authResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.AccessToken == "" {
		t.Fatal("expected non-empty access token")
	}
	if resp.User.Email != "alice@example.com" {
		t.Fatalf("expected email alice@example.com, got %s", resp.User.Email)
	}

	found := false
	for _, ck := range rec.Result().Cookies() {
		if ck.Name == "refresh_token" {
			found = true
		}
	}
	if !found {
		t.Fatal("expected refresh_token cookie to be set")
	}
}

func TestRegister_RejectsDuplicateEmail(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)
	router := gin.New()
	router.POST("/api/auth/register", h.Register)

	body, _ := json.Marshal(map[string]string{
		"email":        "bob@example.com",
		"password":     "supersecret123",
		"display_name": "Bob",
	})

	req1 := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
	req1.Header.Set("Content-Type", "application/json")
	rec1 := httptest.NewRecorder()
	router.ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusCreated {
		t.Fatalf("expected first registration to succeed, got %d: %s", rec1.Code, rec1.Body.String())
	}

	req2 := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
	req2.Header.Set("Content-Type", "application/json")
	rec2 := httptest.NewRecorder()
	router.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusConflict {
		t.Fatalf("expected second registration to be rejected with 409, got %d: %s", rec2.Code, rec2.Body.String())
	}
}

func TestRegister_RejectsShortPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)
	router := gin.New()
	router.POST("/api/auth/register", h.Register)

	body, _ := json.Marshal(map[string]string{
		"email":        "short@example.com",
		"password":     "short",
		"display_name": "Short",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d: %s", rec.Code, rec.Body.String())
	}
}
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
cd backend
go test ./internal/handlers/... -run TestRegister -v
```

預期:`FAIL`(編譯錯誤,`AuthHandler`、`Register` 等尚未定義)。

- [ ] **Step 3: 實作 handler 與共用 helper**

```go
// backend/internal/handlers/auth.go
package handlers

import (
	"net/http"
	"time"

	"cvbackend/internal/auth"
	"cvbackend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthHandler struct {
	DB         *gorm.DB
	JWTSecret  string
	AccessTTL  time.Duration
	RefreshTTL time.Duration
}

type registerRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=8"`
	DisplayName string `json:"display_name" binding:"required"`
}

type authResponse struct {
	AccessToken string     `json:"access_token"`
	User        userPublic `json:"user"`
}

type userPublic struct {
	ID          uuid.UUID `json:"id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existing models.User
	if err := h.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process password"})
		return
	}

	user := models.User{
		Email:        req.Email,
		PasswordHash: hash,
		DisplayName:  req.DisplayName,
	}
	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	h.completeLogin(c, user, http.StatusCreated)
}

func (h *AuthHandler) issueTokens(user models.User) (accessToken, refreshPlain string, refreshRecord models.RefreshToken, err error) {
	accessToken, err = auth.GenerateAccessToken(user.ID, h.JWTSecret, h.AccessTTL)
	if err != nil {
		return "", "", models.RefreshToken{}, err
	}

	refreshPlain, err = auth.GenerateRefreshToken()
	if err != nil {
		return "", "", models.RefreshToken{}, err
	}

	refreshRecord = models.RefreshToken{
		UserID:    user.ID,
		TokenHash: auth.HashRefreshToken(refreshPlain),
		ExpiresAt: time.Now().Add(h.RefreshTTL),
	}
	if err := h.DB.Create(&refreshRecord).Error; err != nil {
		return "", "", models.RefreshToken{}, err
	}

	return accessToken, refreshPlain, refreshRecord, nil
}

func (h *AuthHandler) setRefreshCookie(c *gin.Context, refreshPlain string) {
	c.SetCookie("refresh_token", refreshPlain, int(h.RefreshTTL.Seconds()), "/api/auth", "", false, true)
}

func (h *AuthHandler) recordLogin(c *gin.Context, userID, refreshTokenID uuid.UUID) error {
	record := models.LoginRecord{
		UserID:         userID,
		RefreshTokenID: &refreshTokenID,
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
		LoginAt:        time.Now(),
	}
	return h.DB.Create(&record).Error
}

// completeLogin issues access/refresh tokens, records the login, sets the
// refresh cookie, and writes the JSON response. Shared by Register and Login.
func (h *AuthHandler) completeLogin(c *gin.Context, user models.User, statusCode int) {
	accessToken, refreshPlain, refreshRecord, err := h.issueTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue tokens"})
		return
	}

	if err := h.recordLogin(c, user.ID, refreshRecord.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record login"})
		return
	}

	h.setRefreshCookie(c, refreshPlain)

	c.JSON(statusCode, authResponse{
		AccessToken: accessToken,
		User: userPublic{
			ID:          user.ID,
			Email:       user.Email,
			DisplayName: user.DisplayName,
		},
	})
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
go test ./internal/handlers/... -v
```

預期:全部 `PASS`。(若看到 `SKIP`,代表 `TEST_DATABASE_URL` 環境變數沒有載入,回到 Task 7 Step 2 重新 `export`。)

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers/auth.go backend/internal/handlers/auth_test.go
git commit -m "feat: add register endpoint"
```

---

### Task 9: Login Handler(TDD)

**Files:**
- Modify: `backend/internal/handlers/auth.go`
- Modify: `backend/internal/handlers/auth_test.go`

- [ ] **Step 1: 寫失敗測試**

在 `auth_test.go` 新增:

```go
func TestLogin_ReturnsAccessTokenForValidCredentials(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)

	hash, _ := auth.HashPassword("supersecret123")
	user := models.User{Email: "carol@example.com", PasswordHash: hash, DisplayName: "Carol"}
	if err := h.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to seed user: %v", err)
	}

	router := gin.New()
	router.POST("/api/auth/login", h.Login)

	body, _ := json.Marshal(map[string]string{
		"email":    "carol@example.com",
		"password": "supersecret123",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp authResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.AccessToken == "" {
		t.Fatal("expected non-empty access token")
	}
}

func TestLogin_RejectsWrongPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)

	hash, _ := auth.HashPassword("supersecret123")
	user := models.User{Email: "dave@example.com", PasswordHash: hash, DisplayName: "Dave"}
	if err := h.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to seed user: %v", err)
	}

	router := gin.New()
	router.POST("/api/auth/login", h.Login)

	body, _ := json.Marshal(map[string]string{
		"email":    "dave@example.com",
		"password": "wrong-password",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d: %s", rec.Code, rec.Body.String())
	}
}
```

同時在檔案最上方的 import 區塊加入 `"cvbackend/internal/auth"` 與 `"cvbackend/internal/models"`(若 Task 8 尚未加入)。

- [ ] **Step 2: 執行測試確認失敗**

```bash
go test ./internal/handlers/... -run TestLogin -v
```

預期:`FAIL`(編譯錯誤,`Login` 尚未定義)。

- [ ] **Step 3: 實作 `Login`**

在 `auth.go` 新增:

```go
type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if !auth.CheckPassword(user.PasswordHash, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	h.completeLogin(c, user, http.StatusOK)
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
go test ./internal/handlers/... -v
```

預期:全部 `PASS`。

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers/auth.go backend/internal/handlers/auth_test.go
git commit -m "feat: add login endpoint"
```

---

### Task 10: Refresh Handler(TDD)

**Files:**
- Modify: `backend/internal/handlers/auth.go`
- Modify: `backend/internal/handlers/auth_test.go`

- [ ] **Step 1: 寫失敗測試**

```go
func TestRefresh_IssuesNewAccessTokenAndRotatesRefreshToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)
	router := gin.New()
	router.POST("/api/auth/register", h.Register)
	router.POST("/api/auth/refresh", h.Refresh)

	registerBody, _ := json.Marshal(map[string]string{
		"email":        "erin@example.com",
		"password":     "supersecret123",
		"display_name": "Erin",
	})
	registerReq := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(registerBody))
	registerReq.Header.Set("Content-Type", "application/json")
	registerRec := httptest.NewRecorder()
	router.ServeHTTP(registerRec, registerReq)
	if registerRec.Code != http.StatusCreated {
		t.Fatalf("expected registration to succeed, got %d: %s", registerRec.Code, registerRec.Body.String())
	}

	var refreshCookie *http.Cookie
	for _, ck := range registerRec.Result().Cookies() {
		if ck.Name == "refresh_token" {
			refreshCookie = ck
		}
	}
	if refreshCookie == nil {
		t.Fatal("expected refresh_token cookie from register response")
	}

	refreshReq := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	refreshReq.AddCookie(refreshCookie)
	refreshRec := httptest.NewRecorder()
	router.ServeHTTP(refreshRec, refreshReq)
	if refreshRec.Code != http.StatusOK {
		t.Fatalf("expected refresh to succeed, got %d: %s", refreshRec.Code, refreshRec.Body.String())
	}

	reuseReq := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	reuseReq.AddCookie(refreshCookie)
	reuseRec := httptest.NewRecorder()
	router.ServeHTTP(reuseRec, reuseReq)
	if reuseRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected reusing a rotated refresh token to fail with 401, got %d", reuseRec.Code)
	}
}

func TestRefresh_RejectsMissingCookie(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)
	router := gin.New()
	router.POST("/api/auth/refresh", h.Refresh)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rec.Code)
	}
}
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
go test ./internal/handlers/... -run TestRefresh -v
```

預期:`FAIL`(`Refresh` 未定義)。

- [ ] **Step 3: 實作 `Refresh`**

```go
func (h *AuthHandler) Refresh(c *gin.Context) {
	refreshPlain, err := c.Cookie("refresh_token")
	if err != nil || refreshPlain == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing refresh token"})
		return
	}

	hash := auth.HashRefreshToken(refreshPlain)
	var stored models.RefreshToken
	if err := h.DB.Where("token_hash = ? AND revoked_at IS NULL AND expires_at > ?", hash, time.Now()).
		First(&stored).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired refresh token"})
		return
	}

	var user models.User
	if err := h.DB.First(&user, "id = ?", stored.UserID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	now := time.Now()
	stored.RevokedAt = &now
	if err := h.DB.Save(&stored).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to revoke old refresh token"})
		return
	}

	accessToken, newRefreshPlain, newRefreshRecord, err := h.issueTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue tokens"})
		return
	}

	// Keep the login_record pointing at the currently-active refresh token
	// so Logout can still find it after rotation.
	h.DB.Model(&models.LoginRecord{}).
		Where("refresh_token_id = ?", stored.ID).
		Update("refresh_token_id", newRefreshRecord.ID)

	h.setRefreshCookie(c, newRefreshPlain)

	c.JSON(http.StatusOK, authResponse{
		AccessToken: accessToken,
		User: userPublic{
			ID:          user.ID,
			Email:       user.Email,
			DisplayName: user.DisplayName,
		},
	})
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
go test ./internal/handlers/... -v
```

預期:全部 `PASS`。

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers/auth.go backend/internal/handlers/auth_test.go
git commit -m "feat: add refresh endpoint with token rotation"
```

---

### Task 11: JWT 驗證 Middleware(TDD)

**Files:**
- Create: `backend/internal/middleware/auth.go`
- Test: `backend/internal/middleware/auth_test.go`

- [ ] **Step 1: 寫失敗測試**

```go
// backend/internal/middleware/auth_test.go
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"cvbackend/internal/auth"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func TestRequireAuth_AllowsValidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	secret := "test-secret"
	token, _ := auth.GenerateAccessToken(uuid.New(), secret, time.Minute)

	router := gin.New()
	router.GET("/protected", RequireAuth(secret), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestRequireAuth_RejectsMissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/protected", RequireAuth("test-secret"), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rec.Code)
	}
}

func TestRequireAuth_RejectsInvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/protected", RequireAuth("test-secret"), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer not-a-real-token")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rec.Code)
	}
}
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
go test ./internal/middleware/... -run TestRequireAuth -v
```

預期:`FAIL`(`RequireAuth` 未定義)。

- [ ] **Step 3: 實作**

```go
// backend/internal/middleware/auth.go
package middleware

import (
	"net/http"
	"strings"

	"cvbackend/internal/auth"

	"github.com/gin-gonic/gin"
)

const ContextUserIDKey = "user_id"

func RequireAuth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization header"})
			return
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")
		userID, err := auth.ParseAccessToken(tokenString, jwtSecret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired access token"})
			return
		}

		c.Set(ContextUserIDKey, userID)
		c.Next()
	}
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
go test ./internal/middleware/... -v
```

預期:全部 `PASS`。

- [ ] **Step 5: Commit**

```bash
git add backend/internal/middleware/auth.go backend/internal/middleware/auth_test.go
git commit -m "feat: add JWT auth middleware"
```

---

### Task 12: Logout Handler(TDD)

**Files:**
- Modify: `backend/internal/handlers/auth.go`
- Modify: `backend/internal/handlers/auth_test.go`

- [ ] **Step 1: 寫失敗測試**

在 import 區塊加入 `"cvbackend/internal/middleware"`,然後新增:

```go
func TestLogout_RevokesRefreshTokenAndPreventsFurtherRefresh(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)
	router := gin.New()
	router.POST("/api/auth/register", h.Register)
	router.POST("/api/auth/refresh", h.Refresh)
	router.POST("/api/auth/logout", middleware.RequireAuth(h.JWTSecret), h.Logout)

	registerBody, _ := json.Marshal(map[string]string{
		"email":        "frank@example.com",
		"password":     "supersecret123",
		"display_name": "Frank",
	})
	registerReq := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(registerBody))
	registerReq.Header.Set("Content-Type", "application/json")
	registerRec := httptest.NewRecorder()
	router.ServeHTTP(registerRec, registerReq)

	var resp authResponse
	if err := json.Unmarshal(registerRec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode register response: %v", err)
	}

	var refreshCookie *http.Cookie
	for _, ck := range registerRec.Result().Cookies() {
		if ck.Name == "refresh_token" {
			refreshCookie = ck
		}
	}
	if refreshCookie == nil {
		t.Fatal("expected refresh_token cookie from register response")
	}

	logoutReq := httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	logoutReq.AddCookie(refreshCookie)
	logoutReq.Header.Set("Authorization", "Bearer "+resp.AccessToken)
	logoutRec := httptest.NewRecorder()
	router.ServeHTTP(logoutRec, logoutReq)
	if logoutRec.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d: %s", logoutRec.Code, logoutRec.Body.String())
	}

	refreshReq := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	refreshReq.AddCookie(refreshCookie)
	refreshRec := httptest.NewRecorder()
	router.ServeHTTP(refreshRec, refreshReq)
	if refreshRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected revoked refresh token to fail refresh with 401, got %d", refreshRec.Code)
	}
}

func TestLogout_RejectsMissingAccessToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)
	router := gin.New()
	router.POST("/api/auth/logout", middleware.RequireAuth(h.JWTSecret), h.Logout)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rec.Code)
	}
}
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
go test ./internal/handlers/... -run TestLogout -v
```

預期:`FAIL`(`Logout` 未定義)。

- [ ] **Step 3: 實作 `Logout`**

```go
func (h *AuthHandler) Logout(c *gin.Context) {
	refreshPlain, err := c.Cookie("refresh_token")
	if err != nil || refreshPlain == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing refresh token"})
		return
	}

	hash := auth.HashRefreshToken(refreshPlain)
	var stored models.RefreshToken
	if err := h.DB.Where("token_hash = ?", hash).First(&stored).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	now := time.Now()
	stored.RevokedAt = &now
	if err := h.DB.Save(&stored).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to revoke refresh token"})
		return
	}

	h.DB.Model(&models.LoginRecord{}).
		Where("refresh_token_id = ? AND logout_at IS NULL", stored.ID).
		Update("logout_at", now)

	c.SetCookie("refresh_token", "", -1, "/api/auth", "", false, true)
	c.Status(http.StatusNoContent)
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
go test ./internal/handlers/... -v
```

預期:全部 `PASS`。

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers/auth.go backend/internal/handlers/auth_test.go
git commit -m "feat: add logout endpoint"
```

---

### Task 13: Me Handler(TDD)

**Files:**
- Modify: `backend/internal/handlers/auth.go`
- Modify: `backend/internal/handlers/auth_test.go`

- [ ] **Step 1: 寫失敗測試**

```go
func TestMe_ReturnsCurrentUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)
	router := gin.New()
	router.POST("/api/auth/register", h.Register)
	router.GET("/api/auth/me", middleware.RequireAuth(h.JWTSecret), h.Me)

	registerBody, _ := json.Marshal(map[string]string{
		"email":        "grace@example.com",
		"password":     "supersecret123",
		"display_name": "Grace",
	})
	registerReq := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(registerBody))
	registerReq.Header.Set("Content-Type", "application/json")
	registerRec := httptest.NewRecorder()
	router.ServeHTTP(registerRec, registerReq)

	var resp authResponse
	if err := json.Unmarshal(registerRec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode register response: %v", err)
	}

	meReq := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	meReq.Header.Set("Authorization", "Bearer "+resp.AccessToken)
	meRec := httptest.NewRecorder()
	router.ServeHTTP(meRec, meReq)

	if meRec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", meRec.Code, meRec.Body.String())
	}

	var meResp userPublic
	if err := json.Unmarshal(meRec.Body.Bytes(), &meResp); err != nil {
		t.Fatalf("failed to decode me response: %v", err)
	}
	if meResp.Email != "grace@example.com" {
		t.Fatalf("expected email grace@example.com, got %s", meResp.Email)
	}
}

func TestMe_RejectsMissingAccessToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := newAuthHandler(t)
	router := gin.New()
	router.GET("/api/auth/me", middleware.RequireAuth(h.JWTSecret), h.Me)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rec.Code)
	}
}
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
go test ./internal/handlers/... -run TestMe -v
```

預期:`FAIL`(`Me` 未定義)。

- [ ] **Step 3: 實作 `Me`**

```go
func (h *AuthHandler) Me(c *gin.Context) {
	userIDValue, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	userID := userIDValue.(uuid.UUID)

	var user models.User
	if err := h.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, userPublic{
		ID:          user.ID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
	})
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
go test ./internal/handlers/... -v
```

預期:全部 `PASS`。

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers/auth.go backend/internal/handlers/auth_test.go
git commit -m "feat: add me endpoint"
```

---

### Task 14: IP Rate Limit Middleware(TDD)

**Files:**
- Create: `backend/internal/middleware/ratelimit.go`
- Test: `backend/internal/middleware/ratelimit_test.go`

- [ ] **Step 1: 寫失敗測試**

```go
// backend/internal/middleware/ratelimit_test.go
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestNewIPRateLimiter_BlocksAfterLimitExceeded(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(NewIPRateLimiter(2, time.Minute))
	router.GET("/ping", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodGet, "/ping", nil)
		req.RemoteAddr = "10.0.0.1:1234"
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected request %d to succeed, got %d", i+1, rec.Code)
		}
	}

	req := httptest.NewRequest(http.MethodGet, "/ping", nil)
	req.RemoteAddr = "10.0.0.1:1234"
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 3rd request to be rate limited with 429, got %d", rec.Code)
	}
}

func TestNewIPRateLimiter_TracksIPsIndependently(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(NewIPRateLimiter(1, time.Minute))
	router.GET("/ping", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req1 := httptest.NewRequest(http.MethodGet, "/ping", nil)
	req1.RemoteAddr = "10.0.0.1:1234"
	rec1 := httptest.NewRecorder()
	router.ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusOK {
		t.Fatalf("expected first IP's request to succeed, got %d", rec1.Code)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/ping", nil)
	req2.RemoteAddr = "10.0.0.2:1234"
	rec2 := httptest.NewRecorder()
	router.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("expected second IP's request to succeed, got %d", rec2.Code)
	}
}
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
go test ./internal/middleware/... -run TestNewIPRateLimiter -v
```

預期:`FAIL`(`NewIPRateLimiter` 未定義)。

- [ ] **Step 3: 實作**

```go
// backend/internal/middleware/ratelimit.go
package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type ipLimiter struct {
	mu          sync.Mutex
	counts      map[string]int
	windowStart map[string]time.Time
	limit       int
	window      time.Duration
}

// NewIPRateLimiter returns a middleware that allows at most `limit` requests
// per `window` for each client IP, using a fixed-window counter kept in memory.
func NewIPRateLimiter(limit int, window time.Duration) gin.HandlerFunc {
	l := &ipLimiter{
		counts:      make(map[string]int),
		windowStart: make(map[string]time.Time),
		limit:       limit,
		window:      window,
	}

	return func(c *gin.Context) {
		ip := c.ClientIP()

		l.mu.Lock()
		now := time.Now()
		start, ok := l.windowStart[ip]
		if !ok || now.Sub(start) > l.window {
			l.windowStart[ip] = now
			l.counts[ip] = 0
		}
		l.counts[ip]++
		count := l.counts[ip]
		l.mu.Unlock()

		if count > l.limit {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "too many requests, please try again later"})
			return
		}

		c.Next()
	}
}
```

- [ ] **Step 4: 執行測試確認通過**

```bash
go test ./internal/middleware/... -v
```

預期:全部 `PASS`。

- [ ] **Step 5: Commit**

```bash
git add backend/internal/middleware/ratelimit.go backend/internal/middleware/ratelimit_test.go
git commit -m "feat: add per-IP rate limit middleware"
```

---

### Task 15: main.go Wiring

**Files:**
- Create: `backend/cmd/server/main.go`

- [ ] **Step 1: 實作**

```go
// backend/cmd/server/main.go
package main

import (
	"log"
	"os"
	"time"

	"cvbackend/internal/db"
	"cvbackend/internal/handlers"
	"cvbackend/internal/middleware"
	"cvbackend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, relying on environment variables")
	}

	conn := db.Connect()
	if err := conn.AutoMigrate(&models.User{}, &models.RefreshToken{}, &models.LoginRecord{}); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is not set")
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000"
	}

	authHandler := &handlers.AuthHandler{
		DB:         conn,
		JWTSecret:  jwtSecret,
		AccessTTL:  15 * time.Minute,
		RefreshTTL: 7 * 24 * time.Hour,
	}

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{allowedOrigin},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	authLimiter := middleware.NewIPRateLimiter(5, time.Minute)

	api := router.Group("/api/auth")
	api.POST("/register", authLimiter, authHandler.Register)
	api.POST("/login", authLimiter, authHandler.Login)
	api.POST("/refresh", authHandler.Refresh)
	api.POST("/logout", middleware.RequireAuth(jwtSecret), authHandler.Logout)
	api.GET("/me", middleware.RequireAuth(jwtSecret), authHandler.Me)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("server listening on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
```

main.go 是 wiring 程式碼(組裝既有的、已測試過的元件),不需要額外的單元測試;會在 Task 18 用手動驗證確認整條串接是正確的。

- [ ] **Step 2: 確認可編譯**

```bash
cd backend
go build ./...
```

預期:編譯成功。

- [ ] **Step 3: Commit**

```bash
git add backend/cmd/server/main.go
git commit -m "feat: wire up Gin server with auth routes"
```

---

### Task 16: 前端 AuthContext

**Files:**
- Create: `app/contexts/AuthContext.tsx`

- [ ] **Step 1: 實作**

```tsx
// app/contexts/AuthContext.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_MARGIN_MS = 60 * 1000;

type AuthUser = {
  id: string;
  email: string;
  display_name: string;
};

type AuthResponse = {
  access_token: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseErrorMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({ error: fallback }));
  return body.error ?? fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const clearSession = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    setUser(null);
    setAccessToken(null);
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }
    refreshTimer.current = setTimeout(
      () => refreshRef.current(),
      ACCESS_TOKEN_TTL_MS - REFRESH_MARGIN_MS
    );
  }, []);

  const applyAuthResponse = useCallback(
    (data: AuthResponse) => {
      setUser(data.user);
      setAccessToken(data.access_token);
      scheduleRefresh();
    },
    [scheduleRefresh]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        clearSession();
        return;
      }
      const data: AuthResponse = await res.json();
      applyAuthResponse(data);
    } catch {
      clearSession();
    }
  }, [applyAuthResponse, clearSession]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
    // Intentionally run only on mount: refresh() is re-bound via refreshRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'login failed'));
      }
      const data: AuthResponse = await res.json();
      applyAuthResponse(data);
    },
    [applyAuthResponse]
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName,
        }),
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'registration failed'));
      }
      const data: AuthResponse = await res.json();
      applyAuthResponse(data);
    },
    [applyAuthResponse]
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => undefined);
    }
    clearSession();
  }, [accessToken, clearSession]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
```

專案目前沒有設定前端測試執行器(見 `CLAUDE.md`:「There is no test runner configured in this repo yet.」)。引入一套測試框架超出本次認證子專案的範圍,因此這個元件改用 Task 18 的手動驗證來確認行為,而非自動化測試。

- [ ] **Step 2: 加入環境變數設定**

在專案根目錄(Next.js)建立或更新 `.env.local`(不會被提交,已被 `.env*` 規則忽略):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

- [ ] **Step 3: 確認可編譯**

```bash
npm run build
```

預期:建置成功,無 TypeScript 錯誤。

- [ ] **Step 4: Commit**

```bash
git add app/contexts/AuthContext.tsx
git commit -m "feat: add AuthContext for frontend auth integration"
```

---

### Task 17: 將 AuthProvider 接入 App

**Files:**
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: 修改 layout,包入 `AuthProvider`**

在 `app/[locale]/layout.tsx` 中:

```diff
 import { NextIntlClientProvider } from 'next-intl';
 import { getMessages } from 'next-intl/server';
 import { notFound } from 'next/navigation';
 import { routing } from '@/intl/routing';
 import { ThemeProvider } from '@/app/components/ThemeProvider';
+import { AuthProvider } from '@/app/contexts/AuthContext';
 import '../globals.css';
 import { Analytics } from '@vercel/analytics/next';
```

```diff
     <html lang={locale} suppressHydrationWarning>
       <body suppressHydrationWarning>
         <ThemeProvider>
           <NextIntlClientProvider messages={messages}>
-            {children}
-            <Analytics />
+            <AuthProvider>
+              {children}
+              <Analytics />
+            </AuthProvider>
           </NextIntlClientProvider>
         </ThemeProvider>
       </body>
     </html>
```

- [ ] **Step 2: 確認可編譯**

```bash
npm run build
```

預期:建置成功。

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/layout.tsx
git commit -m "feat: wire AuthProvider into app layout"
```

---

### Task 18: 手動端對端驗證

**Files:** 無新檔案,純驗證步驟。

- [ ] **Step 1: 啟動後端**

```bash
cd backend
go run ./cmd/server
```

預期輸出包含 `server listening on :8080`。

- [ ] **Step 2: 用 curl 測試註冊**

```bash
curl -i -c /tmp/cookies.txt -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"manual-test@example.com","password":"supersecret123","display_name":"Manual Test"}'
```

預期:HTTP 201,回應 body 含 `access_token` 與 `user`,並看到 `Set-Cookie: refresh_token=...`。

- [ ] **Step 3: 用 curl 測試 `/me`**

把上一步回應中的 `access_token` 帶入:

```bash
curl -i http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <貼上access_token>"
```

預期:HTTP 200,回傳剛剛註冊的 email/display_name。

- [ ] **Step 4: 用 curl 測試 refresh 與 logout**

```bash
curl -i -b /tmp/cookies.txt -c /tmp/cookies.txt -X POST http://localhost:8080/api/auth/refresh
curl -i -b /tmp/cookies.txt -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer <貼上最新一次回應的access_token>"
```

預期:refresh 回傳 200 與新的 `access_token`;logout 回傳 204。登出後再呼叫一次 refresh 應回傳 401。

- [ ] **Step 5: 啟動前端並驗證瀏覽器流程**

```bash
npm run dev
```

打開 `http://localhost:3000`,在瀏覽器 devtools console 手動呼叫(或之後實作登入頁面 UI 時透過畫面操作):

```js
// 在瀏覽器 console 中執行,確認 AuthContext 串接成功
fetch('http://localhost:8080/api/auth/register', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'browser-test@example.com',
    password: 'supersecret123',
    display_name: 'Browser Test',
  }),
}).then(r => r.json()).then(console.log);
```

預期:在 Network 分頁看到請求帶有 `Access-Control-Allow-Origin` 對應到 `http://localhost:3000`,且 `Set-Cookie` 成功寫入(可在 Application > Cookies 確認 `refresh_token` 為 httpOnly)。

- [ ] **Step 6: 執行完整後端測試套件確認沒有迴歸**

```bash
cd backend
go test ./... -v
```

預期:全部 `PASS`。

- [ ] **Step 7: 確認沒有遺漏的變更**

```bash
git status
```

預期:working tree clean(所有變更都已在前面的任務中 commit)。

---

## 注意事項

- 本計畫不包含 UI 層的登入/註冊表單頁面 — `AuthContext` 是給後續頁面使用的基礎設施,實際畫面(`/login`、`/register` 頁面)留給下一個子專案,屆時會連同留言板或會員專區一起設計。
- 留言板、會員專區為後續子專案,不在本計畫範圍。
