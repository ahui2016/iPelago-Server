package database

import (
	"database/sql"

	"github.com/ahui2016/iPelago-Server/model"
	"github.com/ahui2016/iPelago-Server/stmt"
	"github.com/ahui2016/iPelago-Server/util"
)

// 每一页有多少条消息。注意：如果修改该数值，同时需要修改 util.js 中的 everyPage
const OnePage = 99

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
