# OYHAYA Cruise Calendar

Mobile monthly calendar for Busan cruise arrivals.

## Automatic official-data sync

The calendar is prepared to refresh automatically every 3 hours with GitHub Actions.

1. Apply for **부산광역시_크루즈 선석스케줄 정보** at data.go.kr.
2. In the API detail page, copy a working **JSON request URL** containing the issued service key.
3. In this repository, go to **Settings → Secrets and variables → Actions → New repository secret**.
4. Name it `CRUISE_API_URL` and paste the full request URL as the secret value.
5. Open **Actions → Update cruise calendar data → Run workflow** once.

After that, `cruise/data.json` is refreshed every 3 hours and GitHub Pages serves the latest calendar automatically.

Do not place the service key directly in `index.html` or `app.js`.
