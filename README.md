# Huntinality 2021 Static Site

This is the static version of Huntinality 2021. It is not backed by a database or a server -- as a result, the following features are no longer supported:
- Login/Logout
- Registration
- Hunt progress tracking

Otherwise, the puzzle content of the hunt is more or less identical except for a single achievement in the final puzzle.

## Local Testing
Because there is no db, testing is very simple. Simply open one of the html files in Chrome (or your favorite browser).

Some pages (such as The Dating Sim) may not work if the file is opened directly with a browser with the URI scheme `file://`. Chrome, for example, will show an error about `Cross origin requests are only supported for HTTP`. It is necessary to spin up a local webserver in this case. With python3, simply run `python3 -m http.server` in the directory with the Huntinality 2021 static files and browse to `http://localhost:8000`.