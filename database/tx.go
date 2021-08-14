package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/ahui2016/iPelago-Server/stmt"
	"github.com/ahui2016/iPelago-Server/util"
)

type TX interface {
	Exec(string, ...interface{}) (sql.Result, error)
	Query(string, ...interface{}) (*sql.Rows, error)
	QueryRow(string, ...interface{}) *sql.Row
}

// getText1 gets one text value from the database.
func getText1(tx TX, query string, args ...interface{}) (text string, err error) {
	row := tx.QueryRow(query, args...)
	err = row.Scan(&text)
	return
}

// getInt1 gets one number value from the database.
func getInt1(tx TX, query string, arg ...interface{}) (n int64, err error) {
	row := tx.QueryRow(query, arg...)
	err = row.Scan(&n)
	return
}

type Row interface {
	Scan(...interface{}) error
}

func scanIsland(row Row) (island Island, err error) {
	err = row.Scan(
		&island.ID,
		&island.Name,
		&island.Email,
		&island.Avatar,
		&island.Link,
		&island.Note,
		&island.Hide,
	)
	return
}

func insertIsland(tx TX, island Island) error {
	_, err := tx.Exec(
		stmt.InsertIsland,
		island.ID,
		island.Name,
		island.Email,
		island.Avatar,
		island.Link,
		island.Note,
		island.Hide,
	)
	return err
}

func insertMsg(tx TX, msg *Message) error {
	_, err := tx.Exec(
		stmt.InsertMsg,
		msg.ID,
		msg.IslandID,
		msg.Time,
		msg.Body,
	)
	return err
}

func scanMessage(row Row) (msg Message, err error) {
	err = row.Scan(
		&msg.ID,
		&msg.IslandID,
		&msg.Time,
		&msg.Body,
	)
	return
}

// insertFirstMsg 插入每个小岛被建立时的第一条消息。
func insertFirsstMsg(tx TX, islandID, name string) error {
	now := time.Now()
	datetime := now.Format("2006年1月2日")
	body := fmt.Sprintf("%s创建于%s", name, datetime)
	msg := &Message{
		ID:       util.RandomID(),
		IslandID: islandID,
		Time:     now.Unix(),
		Body:     body,
	}
	return insertMsg(tx, msg)
}

func getIslandByID(tx TX, id string) (island Island, err error) {
	row := tx.QueryRow(stmt.GetIslandByID, id)
	return scanIsland(row)
}

func getLastMsg(tx TX, id string) (msg SimpleMsg, err error) {
	msg, err = getNextMsg(tx, id, util.TimeNow())
	if err != nil {
		return
	}
	oldLength := len(msg.Body)
	msg.Body = util.StringLimit(msg.Body, 256) // 256 bytes
	if oldLength != len(msg.Body) {
		msg.Body += "......"
	}
	return
}

func getNextMsg(tx TX, id string, datetime int64) (SimpleMsg, error) {
	row := tx.QueryRow(stmt.GetMoreMessagesByIsland, id, datetime, 1)
	msg, err := scanMessage(row)
	simple := msg.ToSimple()
	return *simple, err
}

func getMessages(tx TX, query string, args ...interface{}) (messages []*Message, err error) {
	rows, err := tx.Query(query, args...)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		msg, err := scanMessage(rows)
		if err != nil {
			return nil, err
		}
		messages = append(messages, &msg)
	}
	err = rows.Err()
	return
}
