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

	e.File("/", "public/timeline.html")

	api := e.Group("/api", sleep)
	api.GET("/login-status", getLoginStatus)
	api.POST("/login", loginHandler)
	api.GET("/logout", logoutHandler)
	api.POST("/get-island", getPublicIsland)
	api.POST("/more-public-messages", morePublicMessages)
	api.GET("/get-titles", getTitles)

	admin := e.Group("/admin", sleep, checkLogin)
	admin.POST("/create-island", createIsland)
	admin.POST("/get-island", getIsland)
	admin.POST("/update-island", updateIsland)
	admin.POST("/delete-island", deleteIsland)
	admin.GET("/all-islands", allIslands)
	admin.POST("/more-island-messages", moreIslandMessages)
	admin.POST("/post-message", postMessage)
	admin.POST("/delete-message", deleteMessage)
	admin.POST("/update-title", updateTitle)
	admin.POST("/update-subtitle", updateSubtitle)

	e.Logger.Fatal(e.Start(*addr))
}
