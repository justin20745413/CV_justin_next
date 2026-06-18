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
