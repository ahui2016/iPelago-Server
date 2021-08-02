package main

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/ahui2016/iPelago-Server/util"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

// Text 用于向前端返回一个简单的文本消息。
// 为了保持一致性，总是向前端返回 JSON, 因此即使是简单的文本消息也使用 JSON.
type Text struct {
	Message string `json:"message"`
}

func sleep(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		time.Sleep(time.Second)
		return next(c)
	}
}

func errorHandler(err error, c echo.Context) {
	if e, ok := err.(*echo.HTTPError); ok {
		c.JSON(e.Code, e.Message)
	}
	c.JSON(500, Text{err.Error()})
}

func getLoginStatus(c echo.Context) error {
	return c.JSON(OK, isLoggedIn(c))
}

func loginHandler(c echo.Context) error {
	if isLoggedIn(c) {
		return c.NoContent(OK)
	}
	pwd, err := getFormValue(c, "password")
	if err != nil {
		return err
	}

	ip := c.RealIP()
	if err := db.CheckPassword(pwd); err != nil {
		ipTryCount[ip]++
		if e := checkIPTryCount(ip); e != nil {
			return e
		}
		return err
	}

	ipTryCount[ip] = 0
	sess, err := session.Get(sessionName, c)
	util.Panic(err)
	sess.Values[cookieLogin] = true
	return sess.Save(c.Request(), c.Response())
}

// getFormValue gets the c.FormValue(key), trims its spaces,
// and checks if it is empty or not.
func getFormValue(c echo.Context, key string) (string, error) {
	value := strings.TrimSpace(c.FormValue(key))
	if value == "" {
		return "", fmt.Errorf("form value [%s] is empty", key)
	}
	return value, nil
}

func getTimestamp(c echo.Context) (int64, error) {
	s := c.QueryParam("time")
	if s == "" {
		return util.TimeNow(), nil
	}
	return strconv.ParseInt(s, 10, 0)
}
