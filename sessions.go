package main

// https://gowebexamples.com/sessions/

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

const (
	sessionName    = "ipelago-server-session"
	cookieLogin    = "ipelago-server-cookie-login"
	passwordMaxTry = 3
)

var ipTryCount = make(map[string]int)

func checkIPTryCount(ip string) error {
	if *demo {
		return nil // 演示版允许无限重试密码
	}
	if ipTryCount[ip] >= passwordMaxTry {
		return fmt.Errorf("no more try, input wrong password too many times")
	}
	return nil
}

func isLoggedIn(c echo.Context) (yes bool) {
	sess, err := session.Get(sessionName, c)
	if err != nil {
		return false
	}
	yes, _ = sess.Values[cookieLogin].(bool)
	return
}

func isLoggedOut(c echo.Context) bool {
	return !isLoggedIn(c)
}

func checkLogin(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if isLoggedOut(c) {
			return c.NoContent(http.StatusUnauthorized)
		}
		return next(c)
	}
}
