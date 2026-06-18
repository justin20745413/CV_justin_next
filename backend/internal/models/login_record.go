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
