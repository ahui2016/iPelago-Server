package database

import (
	"database/sql"
	"fmt"

	"github.com/ahui2016/iPelago-Server/model"
	"github.com/ahui2016/iPelago-Server/stmt"
	"github.com/ahui2016/iPelago-Server/util"
	_ "github.com/mattn/go-sqlite3"
)

// 每一页有多少条消息。注意：如果修改该数值，同时需要修改 util.js 中的 everyPage
const OnePage = 99

const (
	SecretKeyName = "secret-key" // for sessions
	PasswordName  = "password"
)

type (
	Island     = model.Island
	Message    = model.Message
	SimpleMsg  = model.SimpleMsg
	Newsletter = model.Newsletter
)

type DB struct {
	Path string
	DB   *sql.DB
}

func (db *DB) mustBegin() *sql.Tx {
	tx, err := db.DB.Begin()
	util.Panic(err)
	return tx
}

func (db *DB) Exec(query string, args ...interface{}) (err error) {
	_, err = db.DB.Exec(query, args...)
	return
}

func (db *DB) Open(dbPath string) (err error) {
	if db.DB, err = sql.Open("sqlite3", dbPath+"?_fk=1"); err != nil {
		return
	}
	db.Path = dbPath
	return db.Exec(stmt.CreateTables)
}

func (db *DB) InsertSecretKey(key []byte) error {
	return db.Exec(stmt.InsertTextValue, SecretKeyName, util.Base64Encode(key))
}

func (db *DB) GetSecretKey() ([]byte, error) {
	key64, err := getText1(db.DB, stmt.GetTextValue, SecretKeyName)
	if err != nil {
		return nil, err
	}
	return util.Base64Decode(key64)
}

func (db *DB) InsertPassword(pwd string) error {
	return db.Exec(stmt.InsertTextValue, PasswordName, pwd)
}

func (db *DB) CheckPassword(userInputPwd string) error {
	pwd, err := getText1(db.DB, stmt.GetTextValue, PasswordName)
	if err != nil {
		return err
	}
	if userInputPwd != pwd {
		return fmt.Errorf("wrong password")
	}
	return nil
}
