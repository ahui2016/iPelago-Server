package database

import (
	"crypto/rand"
	"database/sql"
	"fmt"

	"github.com/ahui2016/iPelago-Server/model"
	"github.com/ahui2016/iPelago-Server/stmt"
	"github.com/ahui2016/iPelago-Server/util"
)

const (
	SecretKeyName    = "secret-key"
	title_key        = "title-key"
	default_title    = "Timeline"
	subtitle_key     = "subtitle-key"
	default_subtitle = ""
	password_key     = "password-key"
	default_password = "abc"
)

type Titles = model.Titles

func initTextValue(tx TX, key, value string) (err error) {
	_, err = getText1(tx, stmt.GetTextValue, key)
	if err == sql.ErrNoRows {
		_, err = tx.Exec(stmt.InsertTextValue, key, value)
	}
	return
}

func (db *DB) initMetadata() error {
	tx := db.mustBegin()
	defer tx.Rollback()

	e1 := initTextValue(tx, title_key, default_title)
	e2 := initTextValue(tx, subtitle_key, default_subtitle)
	e3 := initTextValue(tx, password_key, default_password)
	e4 := initTextValue(tx, SecretKeyName, util.Base64Encode(mustGenerateRandomKey32()))
	if err := util.WrapErrors(e1, e2, e3, e4); err != nil {
		return err
	}
	return tx.Commit()
}

func mustGenerateRandomKey32() []byte {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	util.Panic(err)
	return b
}

func (db *DB) GetSecretKey() ([]byte, error) {
	key64, err := getText1(db.DB, stmt.GetTextValue, SecretKeyName)
	if err != nil {
		return nil, err
	}
	return util.Base64Decode(key64)
}

func (db *DB) GetTitles() (Titles, error) {
	title, e1 := getText1(db.DB, stmt.GetTextValue, title_key)
	subtitle, e2 := getText1(db.DB, stmt.GetTextValue, subtitle_key)
	return Titles{Title: title, Subtitle: subtitle}, util.WrapErrors(e1, e2)
}

func (db *DB) UpdateTitle(title string) error {
	return db.Exec(stmt.UpdateTextValue, title, title_key)
}

func (db *DB) UpdateSubtitle(subtitle string) error {
	return db.Exec(stmt.UpdateTextValue, subtitle, subtitle_key)
}

func (db *DB) UpdateTitles(title, subtitle string) error {
	tx := db.mustBegin()
	defer tx.Rollback()

	_, e1 := tx.Exec(stmt.UpdateTextValue, title, title_key)
	_, e2 := tx.Exec(stmt.UpdateTextValue, subtitle, subtitle_key)
	if err := util.WrapErrors(e1, e2); err != nil {
		return err
	}
	return tx.Commit()
}

func (db *DB) ChangePassword(oldPwd, newPwd string) error {
	if err := db.CheckPassword(oldPwd); err != nil {
		if util.ErrorContains(err, "wrong password") {
			return fmt.Errorf("旧密码错误")
		} else {
			return err
		}
	}
	return db.Exec(stmt.UpdateTextValue, newPwd, password_key)
}

func (db *DB) CheckPassword(userInputPwd string) error {
	pwd, err := getText1(db.DB, stmt.GetTextValue, password_key)
	if err != nil {
		return err
	}
	if userInputPwd != pwd {
		return fmt.Errorf("wrong password")
	}
	return nil
}
