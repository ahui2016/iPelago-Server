package main

import (
	"flag"
	"net/http"

	"github.com/ahui2016/iPelago-Server/database"
	"github.com/ahui2016/iPelago-Server/model"
	"github.com/ahui2016/iPelago-Server/util"
)

const (
	OK = http.StatusOK
)

const (
	dbFileName = "ipelago.db"
)

type (
	Island     = model.Island
	Newsletter = model.Newsletter
)

var (
	db   = new(database.DB)
	addr = flag.String("addr", "127.0.0.1:996", "IP address of the server")
)

func init() {
	flag.Parse()
	util.Panic(db.Open(dbFileName))
}
