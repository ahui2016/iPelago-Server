package main

import "github.com/labstack/echo/v4"

func main() {
	defer db.DB.Close()

	e := echo.New()
	e.HTTPErrorHandler = errorHandler

	e.Static("/public", "public")

	e.File("/", "public/home.html")

	e.Logger.Fatal(e.Start(*addr))
}
