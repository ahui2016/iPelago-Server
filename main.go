package main

import (
	"github.com/gorilla/sessions"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

func main() {
	defer db.DB.Close()

	e := echo.New()
	e.IPExtractor = echo.ExtractIPFromXFFHeader()
	e.HTTPErrorHandler = errorHandler
	e.Use(session.Middleware(sessions.NewCookieStore(secretKey)))

	e.Static("/public", "public")

	e.File("/", "public/home.html", checkLogin)

	api := e.Group("/api")
	api.GET("/login", loginHanler)

	e.Logger.Fatal(e.Start(*addr))
}
