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
