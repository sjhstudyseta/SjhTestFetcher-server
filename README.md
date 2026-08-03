# SjhTestFetcher-server
서울세종고 정기고사문제은행 다운로드 링크 가져오는 서버

## 사용법
* `curl "https://sjhtestfetcher-server.onrender.com/fetch"` (GET)
## 가능한 Query
* `count`: 가져올 시험 개수 (10 -> 최근 10개 시험)
* `after`: nttId 이후 시험들

## 예시
* `curl "https://sjhtestfetcher-server.onrender.com/fetch"` (전부 가져오기)
* `curl "https://sjhtestfetcher-server.onrender.com/fetch?count=1"` (가장 최근 1개 시험 정보 가져오기)
* `curl "https://sjhtestfetcher-server.onrender.com/fetch?after=27314400"` (nttId 27314400 이후 시험들 모두 가져오기)
* `curl "https://sjhtestfetcher-server.onrender.com/fetch?count=1&after=27314400"` (nttId 27314400 이후 시험들중 가장 최근 것 1개 가져오기)

## 응답 예시
* `429: Someone's using me! Try a bit later.`: 누군가 서비스를 쓰고 있음. (동시에 여러명 사용 불가)
* `500: I'm sorry. Something went wrong. Please contact us.`: 뭔가 잘못됨.
* `409`: 작업이 겹치면 먼저 시작한 것의 데이터가 불완전 할 수 있음. 데이터가 그대로 보내지는 대신 코드 409로 구별해야 함.
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