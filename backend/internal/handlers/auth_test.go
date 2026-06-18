package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"cvbackend/internal/auth"
	"cvbackend/internal/models"
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
