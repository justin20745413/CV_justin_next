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
