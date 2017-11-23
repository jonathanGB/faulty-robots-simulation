package main

import (
	"net/http"
	"os"
	"os/exec"
	"runtime"
)

func main() {
	fs := http.FileServer(http.Dir("app"))
	http.Handle("/", fs)

	if len(os.Args) > 1 && os.Args[1] == "-o" {
		go openBrowser("http://localhost:8080/")
	}

	http.ListenAndServe(":8080", nil)
}

// taken from https://stackoverflow.com/a/39324149/3893901
func openBrowser(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default:
		cmd = "xdg-open"
	}

	args = append(args, url)
	return exec.Command(cmd, args...).Start()
}
