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
* `401: Invalid Key.`: key was wrong.
* `500: Something went wrong... Contact owner please!`: Something failed.
* `200: Up to date.`: no entries were found after nttId.
