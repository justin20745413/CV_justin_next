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
