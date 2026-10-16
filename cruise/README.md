# OYHAYA Cruise Calendar

Mobile monthly calendar for Busan cruise arrivals.

## Automatic official-data sync

Source: [부산광역시_크루즈 선석스케줄 정보](https://www.data.go.kr/data/15164308/openapi.do).
Endpoint: `https://apis.data.go.kr/6260000/CruiseBerthScheduleService/getCruiseBerthSchedule`.

1. Apply for the API at data.go.kr and confirm approval.
2. Open this repository's **Settings → Secrets and variables → Actions → New repository secret**.
3. Name it **`CRUISE_SERVICE_KEY`** and paste only the issued service key (not a request URL).
4. Open **Actions → Update cruise calendar data → Run workflow**.
5. Verify that the fetch step reports `Saved … official cruise schedule rows` and that `cruise/data.json` contains the schedules. A successful Pages deployment must also finish before the public calendar changes.

The scheduled workflow attempts a refresh every three hours; GitHub may delay scheduled runs.
`CRUISE_API_URL` is no longer used. Never commit the service key or put it in client-side files.

The importer uses the documented fields (`vslNm`, `ptentPrnmntDt`, `dfptPrnmntDt`, `poent`, `psngPscp`, `bfrPrt`, `nextPrt`), fetches all pages, and preserves the existing file on API errors, incomplete results, invalid dates, and empty results. Passenger figures are ship capacity, not actual visitor counts.

## Verification

Run `node --test cruise/fetch-data.test.mjs`. These tests use synthetic fixtures; live API receipt must be verified separately.
