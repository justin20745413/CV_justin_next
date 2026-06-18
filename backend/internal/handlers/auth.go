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
