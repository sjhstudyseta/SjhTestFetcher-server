# SjhTestFetcher-server
서울세종고 정기고사문제은행 다운로드 링크 가져오는 서버

## 사용법
* [`curl "https://sjhtestfetcher-server.onrender.com/fetch"`](https://sjhtestfetcher-server.onrender.com/fetch) (GET)
## 가능한 Query
* `count`: 가져올 시험 개수 (10 -> 링크 10개)
* `after`: nttId 이후 시험들
* 인식하지 못하는 query는 무시됨

### 예시
* [`curl "https://sjhtestfetcher-server.onrender.com/fetch"`](https://sjhtestfetcher-server.onrender.com/fetch) (전부 가져오기)
* [`curl "https://sjhtestfetcher-server.onrender.com/fetch?count=1"`](https://sjhtestfetcher-server.onrender.com/fetch?count=1) (가장 최근 1개 시험 정보 가져오기)
* [`curl "https://sjhtestfetcher-server.onrender.com/fetch?after=27314308"`](https://sjhtestfetcher-server.onrender.com/fetch?after=27314308) (nttId 27314308 다음 시험들 모두 가져오기, nttId 2734308은 제외하고)
* [`curl "https://sjhtestfetcher-server.onrender.com/fetch?count=2&after=27314308`](https://sjhtestfetcher-server.onrender.com/fetch?count=2&after=27314308) (nttId 27314308 다음 순서대로 시험 2개 가져오기 = nttId 27314308 다음 시험과 다음 다음 시험)

## 응답
* `429: Someone's using me! Try a bit later. (Or try again if on browser)`: 누군가 서비스를 쓰고 있음. (동시에 여러명 사용 불가, 한 번 실행시 최대 5분 소요)
* `500: I'm sorry. Something went wrong. Please contact us.`: 뭔가 잘못됨.
* 다른 응답은 json 형식:

```json
{
  "date": "2000-01-01T01:01:01.001Z",
  "latestNttId": "12345678",
  "data": [
    {
      "nttId": "12345678",
      "title": "2000학년도 1학기 기말고사 3학년 몰래 폰하기1 과목 문제지 및 정답",
      "files": [
        {
          "name": "2000학년도 1학기 기말고사 3학년 몰래 폰하기1 과목 문제지.hwp",
          "url": "exampledownloadlink.com"
        },
        {
          "name": "2000학년도 1학기 기말고사 3학년 몰래 폰하기1 과목 선택형 정답 및 배점.hwp",
          "url": "exampledownloadlink.com"
        }
      ]
    }
  ]
}
```
* query 중 `after`의 `nttId`가 가장 최근 것인 경우:
```json
{
  "date": "2000-01-01T01:01:01.001Z",
  "latestNttId": "Up to date."
}
```
