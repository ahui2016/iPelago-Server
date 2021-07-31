package main

// https://gowebexamples.com/sessions/

import (
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/ahui2016/iPelago-Server/util"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

const (
	sessionName    = "ipelago-server-session"
	cookieLogin    = "ipelago-server-cookie-login"
	passwordMaxTry = 100
)

var ipTryCount = make(map[string]int)

func checkIPTryCount(ip string) error {
	log.Print(ip)
	if ipTryCount[ip] >= passwordMaxTry {
		return fmt.Errorf("no more try, input wrong password too many times")
	}
	return nil
}

func mustGenerateRandomKey32() []byte {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	util.Panic(err)
	return b
}

func initSecretKey() (err error) {
	secretKey, err = db.GetSecretKey()
	if err == sql.ErrNoRows {
		secretKey = mustGenerateRandomKey32()
		err = db.InsertSecretKey(secretKey)
	}
	log.Print(secretKey)
	return err
}

func initPassword() error {
	err := db.CheckPassword(defaultPassword)
	if util.ErrorContains(err, "wrong password") {
		return nil
	}
	if err == sql.ErrNoRows {
		err = db.InsertPassword(defaultPassword)
	}
	return err
}

func isLoggedIn(c echo.Context) (yes bool) {
	sess, err := session.Get(sessionName, c)
	util.Panic(err)
	yes, _ = sess.Values[cookieLogin].(bool)
	return
}

func isLoggedOut(c echo.Context) bool {
	return !isLoggedIn(c)
}

func checkLogin(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if isLoggedOut(c) {
			ip := c.RealIP()
			ipTryCount[ip]++
			if err := checkIPTryCount(ip); err != nil {
				return err
			}
			return c.NoContent(http.StatusUnauthorized)
		}
		return next(c)
	}
}
