package model

import (
	"fmt"
	"strings"

	"github.com/ahui2016/iPelago-Server/util"
)

const (
	KB                 = 1024
	MsgSizeLimitBase   = 10 * KB
	MsgSizeLimitMargin = 5 * KB
	MsgSizeLimit       = MsgSizeLimitBase + MsgSizeLimitMargin // 15KB
	AvatarSizeLimit    = 500 * KB
)

type Newsletter struct {
	Name     string       `json:"name"`
	Email    string       `json:"email"`
	Avatar   string       `json:"avatar"`
	Link     string       `json:"link"`
	Messages []*SimpleMsg `json:"messages"`
}

// Trim 清除多余的空格，也清除 SimpleMsg.Body 为空的消息，
// 并且，如果 SimpleMsg.Time 比 time.Now() 晚超过 24 小时，这样的消息也应清除。
func (nl *Newsletter) Trim() *Newsletter {
	nl.Name = strings.TrimSpace(nl.Name)
	nl.Email = strings.TrimSpace(nl.Email)
	nl.Avatar = strings.TrimSpace(nl.Avatar)
	nl.Link = strings.TrimSpace(nl.Link)

	const hour = 60 * 60
	var messages []*SimpleMsg
	for _, msg := range nl.Messages {
		if msg.Time-util.TimeNow() > 24*hour {
			continue
		}
		msg.Body = strings.TrimSpace(msg.Body)
		if len(msg.Body) == 0 {
			continue
		}
		messages = append(messages, msg)
	}
	nl.Messages = messages
	return nl
}

// Check 检查 newsletter 是否含有必要的项目。
// 注意，应检查经 Tirm() 处理后的 newsletter, 即应 "先trim后check".
func (nl *Newsletter) Check() (err error) {
	if nl.Name == "" {
		err = util.WrapErrors(err, fmt.Errorf("没有岛名"))
	}
	if len(nl.Messages) == 0 {
		err = util.WrapErrors(err, fmt.Errorf("没有消息"))
	}
	if err != nil {
		return util.WrapErrors(err, fmt.Errorf("缺少必要的项目"))
	}
	return nil
}

type SimpleMsg struct {
	Time int64  `json:"time"`
	Body string `json:"body"`
}

func (msg *SimpleMsg) ToMessage(islandID string) *Message {
	return &Message{
		ID:       util.RandomID(),
		IslandID: islandID,
		Time:     msg.Time,
		Body:     msg.Body,
	}
}

type Island struct {
	ID       string    // primary key
	Name     string    // 岛名
	Email    string    // Email
	Avatar   string    // 头像
	Link     string    // 小岛主页或岛主博客
	Note     string    // 对该小岛的备注或评价
	HideJSON bool      // JSON文件是否允许公开访问
	HideHTML bool      // 小岛网页版是否允许公开访问
	Message  SimpleMsg // 最新一条消息
}

func NewIsland(nl *Newsletter) Island {
	return Island{
		ID:     util.RandomID(),
		Name:   nl.Name,
		Email:  nl.Email,
		Avatar: nl.Avatar,
		Link:   nl.Link,
	}
}

type Message struct {
	ID       string
	IslandID string
	Time     int64
	Body     string
}

func NewMessage(islandID, body string) *Message {
	return &Message{
		ID:       util.RandomID(),
		IslandID: islandID,
		Time:     util.TimeNow(),
		Body:     body,
	}
}

func (msg *Message) ToSimple() *SimpleMsg {
	return &SimpleMsg{
		Time: msg.Time,
		Body: msg.Body,
	}
}
