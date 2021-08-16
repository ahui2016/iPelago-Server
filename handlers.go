package main

import (
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ahui2016/iPelago-Server/model"
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

func logoutHandler(c echo.Context) error {
	sess, _ := session.Get(sessionName, c)
	sess.Values[cookieLogin] = false
	return sess.Save(c.Request(), c.Response())
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
	if err := checkIPTryCount(ip); err != nil {
		return err
	}
	if err := db.CheckPassword(pwd); err != nil {
		ipTryCount[ip]++
		return err
	}
	ipTryCount[ip] = 0

	sess, _ := session.Get(sessionName, c)
	sess.Values[cookieLogin] = true
	return sess.Save(c.Request(), c.Response())
}

func getPublicIsland(c echo.Context) error {
	id := c.FormValue("id")
	island, err := db.GetIslandByID(id)
	if err != nil {
		return err
	}
	if island.Hide {
		return fmt.Errorf("the island is hidden")
	}
	return c.JSON(OK, island)
}

func getIslandHandler(c echo.Context) error {
	id, err := getFormValue(c, "id")
	if err != nil {
		return err
	}
	island, err := db.GetIslandByID(id)
	if err != nil {
		return err
	}
	return c.JSON(OK, island)
}

func createIslandHandler(c echo.Context) error {
	island, err := getFormIsland(c)
	if err != nil {
		return err
	}
	if err := db.CreateIsland(island); err != nil {
		return err
	}
	return c.JSON(OK, Text{island.ID})
}

func updateIslandHandler(c echo.Context) error {
	island, err := getFormIsland(c)
	if err != nil {
		return err
	}
	return db.UpdateIsland(island)
}

func allIslands(c echo.Context) error {
	islands, err := db.AllIslands()
	if err != nil {
		return err
	}
	return c.JSON(OK, islands)
}

func moreIslandMessages(c echo.Context) error {
	id, e1 := getFormValue(c, "id")
	datetime, e2 := getTimestamp(c)
	if err := util.WrapErrors(e1, e2); err != nil {
		return err
	}
	messages, err := db.MoreIslandMessages(id, datetime)
	if err != nil {
		return err
	}
	return c.JSON(OK, messages)
}

func morePublicMessages(c echo.Context) error {
	datetime, err := getTimestamp(c)
	if err != nil {
		return err
	}
	messages, err := db.MorePublicMessages(datetime)
	if err != nil {
		return err
	}
	return c.JSON(OK, messages)
}

func postMessage(c echo.Context) error {
	msgBody, err := getFormValue(c, "msg-body")
	if err != nil {
		return err
	}
	msg, err := db.PostMessage(msgBody, c.FormValue("island-id"))
	if err != nil {
		return err
	}
	return c.JSON(OK, msg)
}

func deleteMessage(c echo.Context) error {
	islandID, e1 := getFormValue(c, "island-id")
	msgID, e2 := getFormValue(c, "message-id")
	if err := util.WrapErrors(e1, e2); err != nil {
		return err
	}
	return db.DeleteMessage(msgID, islandID)
}

func deleteIsland(c echo.Context) error {
	id, err := getFormValue(c, "id")
	if err != nil {
		return err
	}
	return db.DeleteIsland(id)
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
	s := c.FormValue("time")
	if s == "" {
		return util.TimeNow(), nil
	}
	return strconv.ParseInt(s, 10, 0)
}

func getIslandHide(c echo.Context) bool {
	value := c.FormValue("hide")
	return value == "private"
}

func getFormIsland(c echo.Context) (island *Island, err error) {
	name, err := getFormValue(c, "name")
	if err != nil {
		return
	}

	id := strings.TrimSpace(c.FormValue("id"))
	if id == "" {
		id = util.RandomID()
	}

	avatar := strings.TrimSpace(c.FormValue("avatar"))
	if avatar != "" {
		if err = checkAvatarSize(avatar); err != nil {
			return
		}
	}

	island = &Island{
		ID:     id,
		Name:   name,
		Email:  strings.TrimSpace(c.FormValue("email")),
		Avatar: avatar,
		Link:   strings.TrimSpace(c.FormValue("link")),
		Note:   strings.TrimSpace(c.FormValue("note")),
		Hide:   getIslandHide(c),
	}
	return
}

func checkAvatarSize(avatar string) (err error) {
	done := make(chan bool, 1)

	var res *http.Response
	go func() {
		res, err = http.Get(avatar)
		done <- true
	}()

	var blob []byte
	select {
	case <-done:
		if err != nil { // 注意这个 err 是最外层那个 err
			return
		}
		defer res.Body.Close()

		blob, err = io.ReadAll(io.LimitReader(res.Body, model.AvatarSizeLimit+model.KB))
		if err != nil {
			return
		}
		if len(blob) > model.AvatarSizeLimit {
			return fmt.Errorf("the size exceeds the limit (150KB)")
		}
		return nil
	case <-time.After(10 * time.Second):
		return fmt.Errorf("timeout")
	}
}
