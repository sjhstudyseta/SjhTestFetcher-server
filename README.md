## Usage
`curl -H "key:CORRECT_KEY" "https://sjhtestfetcher-server.onrender.com/fetch`
## Queries
* `count`: amount of entries to get
* `after`: get entries after nttId

## Example
* `curl -H "key:CORRECT_KEY" "https://sjhtestfetcher-server.onrender.com/fetch` (get everything)
* `curl -H "key:CORRECT_KEY" "https://sjhtestfetcher-server.onrender.com/fetch?count=1` (get 1 most recent entry)
* `curl -H "key:CORRECT_KEY" "https://sjhtestfetcher-server.onrender.com/fetch?after=27314400` (all entries after nttId 27314400)
* `curl -H "key:CORRECT_KEY" "https://sjhtestfetcher-server.onrender.com/fetch?count=1&after=27314400` (1 entry after nttId 27314400)

## Possible Responses
* `401: Invalid Key. Don't you dare try to mess with me!`: key was wrong.
* `429: Someone's using me! Try a bit later.`: service is running. (can't run multiple at once)
* `500: I'm sorry. Something went wrong. Please contact us.`: Something failed.
* `200: Up to date.`: no entries were found after nttId.
