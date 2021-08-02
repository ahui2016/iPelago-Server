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

	e.File("/", "public/home.html")

	api := e.Group("/api")
	api.GET("/login-status", getLoginStatus)
	api.GET("/login", loginHandler)

	e.Logger.Fatal(e.Start(*addr))
}
