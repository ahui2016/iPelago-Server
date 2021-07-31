package util

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

// WrapErrors 把多个错误合并为一个错误.
func WrapErrors(allErrors ...error) (wrapped error) {
	for _, err := range allErrors {
		if err != nil {
			if wrapped == nil {
				wrapped = err
			} else {
				wrapped = fmt.Errorf("%v | %v", err, wrapped)
			}
		}
	}
	return
}

// ErrorContains returns NoCaseContains(err.Error(), substr)
// Returns false if err is nil.
func ErrorContains(err error, substr string) bool {
	if err == nil {
		return false
	}
	return noCaseContains(err.Error(), substr)
}

// noCaseContains reports whether substr is within s case-insensitive.
func noCaseContains(s, substr string) bool {
	s = strings.ToLower(s)
	substr = strings.ToLower(substr)
	return strings.Contains(s, substr)
}

// Panic panics if err != nil
func Panic(err error) {
	if err != nil {
		panic(err)
	}
}

func PathIsNotExist(name string) (ok bool) {
	_, err := os.Lstat(name)
	if os.IsNotExist(err) {
		ok = true
		err = nil
	}
	Panic(err)
	return
}

// PathIsExist .
func PathIsExist(name string) bool {
	return !PathIsNotExist(name)
}

func TimeNow() int64 {
	return time.Now().Unix()
}

// RandomID 返回一个上升趋势的随机 id, 由时间戳与随机数组成。
// 时间戳确保其上升趋势（大致有序），随机数确保其随机性（防止被穷举, 防冲突）。
// RandomID 考虑了 “生成 id 的速度”、 “并发防冲突” 与 “id 长度”
// 这三者的平衡，适用于大多数中、小规模系统（当然，不适用于大型系统）。
func RandomID() string {
	var max int64 = 100_000_000
	n, err := rand.Int(rand.Reader, big.NewInt(max))
	if err != nil {
		panic(err)
	}
	timestamp := time.Now().Unix()
	idInt64 := timestamp*max + n.Int64()
	return strconv.FormatInt(idInt64, 36)
}

// StringLimit 截取 s, 确保 s 不大于 limit.
// 同时会确保截取后的 s 是有效的 utf8 字符串.
func StringLimit(s string, limit int) string {
	if len(s) > limit {
		s = s[:limit]
	}
	for len(s) > 0 {
		if utf8.ValidString(s) {
			break
		}
		s = s[:len(s)-1]
	}
	return s
}

func CheckStringSize(body string, sizeLimit int64) error {
	size := float64(len(body)) / 1024
	limit := float64(sizeLimit) / 1024
	if size > limit {
		return fmt.Errorf("size: %.1fKB, exceeds the limit (%.1fKB)", size, limit)
	}
	return nil
}
