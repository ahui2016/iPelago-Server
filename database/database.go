package database

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/ahui2016/iPelago-Server/model"
	"github.com/ahui2016/iPelago-Server/stmt"
	"github.com/ahui2016/iPelago-Server/util"
	_ "github.com/mattn/go-sqlite3"
)

// 每一页有多少条消息。注意：如果修改该数值，同时需要修改 util.ts 中的 everyPage
const EveryPage = 10 // 99

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
	if err = db.Exec(stmt.CreateTables); err != nil {
		return
	}
	return db.initMetadata()
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

func (db *DB) UpdateIsland(island *Island) error {
	tx := db.mustBegin()
	defer tx.Rollback()

	if err := updateIsland(tx, island); err != nil {
		return err
	}
	if island.Hide {
		if err := os.Remove(islandAddress(island.ID)); err != nil {
			return err
		}
	} else {
		if err := publishNewsletter(tx, island.ID); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (db *DB) CreateIsland(island *Island) error {
	tx := db.mustBegin()
	defer tx.Rollback()

	e1 := insertIsland(tx, island)
	e2 := insertFirsstMsg(tx, island.ID, island.Name)
	e3 := publishNewsletter(tx, island.ID)
	if err := util.WrapErrors(e1, e2, e3); err != nil {
		return err
	}
	return tx.Commit()
}

func (db *DB) GetIslandByID(id string) (Island, error) {
	island, err := getIslandByID(db.DB, id)
	if err == sql.ErrNoRows {
		err = nil
	}
	return island, err
}

func (db *DB) AllIslands() (islands []*Island, err error) {
	rows, err := db.DB.Query(stmt.AllIslands)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		island, err := scanIsland(rows)
		if err != nil {
			return nil, err
		}
		if island.Message, err = getLastMsg(db.DB, island.ID); err != nil {
			return nil, err
		}
		islands = append(islands, &island)
	}
	return islands, rows.Err()
}

// MoreIslandMessages 获取指定小岛的更多消息。
func (db *DB) MoreIslandMessages(id string, datetime int64) ([]*Message, error) {
	return getMessages(db.DB, stmt.GetMoreMessagesByIsland, id, datetime, EveryPage)
}

// MorePublicMessages 获取全部公开小岛的更多消息。
func (db *DB) MorePublicMessages(datetime int64) ([]*Message, error) {
	return getMessages(db.DB, stmt.GetMorePublicMessages, datetime, EveryPage)
}

func (db *DB) PostMessage(body, islandID string, islandHide bool) (*Message, error) {
	tx := db.mustBegin()
	defer tx.Rollback()

	if err := util.CheckStringSize(body, model.KB); err != nil {
		return nil, err
	}
	msg := model.NewMessage(islandID, body)
	if err := insertMsg(tx, msg); err != nil {
		return nil, err
	}

	if !islandHide {
		if err := publishNewsletter(tx, islandID); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return msg, nil
}

func (db *DB) DeleteIsland(id string) error {
	return db.Exec(stmt.DeleteIsland, id)
}

func (db *DB) DeleteMessage(msgID, islandID string) error {
	n, err := getInt1(db.DB, stmt.CountMessages, islandID)
	if err != nil {
		return err
	}
	if n < 2 {
		return fmt.Errorf("至少需要保留一条消息")
	}
	return db.Exec(stmt.DeleteMessage, msgID)
}
