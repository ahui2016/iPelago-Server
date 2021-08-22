package database

import (
	"database/sql"

	"github.com/ahui2016/iPelago-Server/model"
	"github.com/ahui2016/iPelago-Server/stmt"
	"github.com/ahui2016/iPelago-Server/util"
)

const (
	title_key        = "title-key"
	default_title    = "Timeline"
	subtitle_key     = "subtitle-key"
	default_subtitle = ""
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
	e1 := initTextValue(db.DB, title_key, default_title)
	e2 := initTextValue(db.DB, subtitle_key, default_subtitle)
	return util.WrapErrors(e1, e2)
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
