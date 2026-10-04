(() => {
  const $ = (s) => document.querySelector(s);
  const now = new Date();
  let view = new Date(now.getFullYear(), now.getMonth(), 1);
  let selected = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let cruises = [];

  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const sameDay = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  const itemsFor = (dateKey) => cruises.filter((x) => x.date === dateKey);
  const escapeHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function normalizeDate(value){
    const s = String(value ?? "").trim();
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if(m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    m = s.match(/^(\d{4})(\d{2})(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : s;
  }

  function normalize(data){
    const rows = Array.isArray(data) ? data : (Array.isArray(data?.cruises) ? data.cruises : []);
    return rows.map((r, i) => ({
      id: r.id ?? i,
      date: normalizeDate(r.date ?? r.arrivalDate ?? r["입항일"] ?? r["입항예정일시"]),
      ship: r.ship ?? r.shipName ?? r["선박명"] ?? r["선명"] ?? "선박명 미상",
      arrival: r.arrival ?? r.arrivalTime ?? r["입항시간"] ?? r["입항예정일시"] ?? "",
      departure: r.departure ?? r.departureTime ?? r["출항시간"] ?? r["출항예정일시"] ?? "",
      terminal: r.terminal ?? r.berth ?? r["입항지"] ?? r["터미널"] ?? r["부두"] ?? "",
      passengers: r.passengers ?? r.pax ?? r["승객정원"] ?? r["승객수"] ?? "",
      previousPort: r.previousPort ?? r["이전기항지"] ?? r["전항지"] ?? "",
      nextPort: r.nextPort ?? r["다음기항지"] ?? r["차항지"] ?? ""
    })).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date));
  }

  function timeOnly(value){
    const s = String(value ?? "").trim();
    const m = s.match(/(\d{1,2}):(\d{2})/);
    return m ? `${pad(m[1])}:${m[2]}` : (s || "-");
  }

  function passengerText(value){
    const s = String(value ?? "").trim();
    const n = Number(s.replace(/,/g, ""));
    return s && Number.isFinite(n) ? `${n.toLocaleString("ko-KR")}명` : "-";
  }

  function renderCalendar(){
    const y = view.getFullYear();
    const m = view.getMonth();
    $("#monthTitle").textContent = `${y}년 ${m+1}월`;
    const grid = $("#calendarGrid");
    grid.innerHTML = "";

    const first = new Date(y,m,1);
    const start = new Date(y,m,1-first.getDay());

    for(let i=0;i<42;i++){
      const d = new Date(start);
      d.setDate(start.getDate()+i);
      const count = itemsFor(key(d)).length;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day";
      if(d.getMonth() !== m) btn.classList.add("out");
      if(d.getDay() === 0) btn.classList.add("sun");
      if(d.getDay() === 6) btn.classList.add("sat");
      if(sameDay(d, now)) btn.classList.add("today");
      if(sameDay(d, selected)) btn.classList.add("selected");

      let marks = "";
      if(count === 1) marks = '<span class="dot"></span>';
      else if(count === 2) marks = '<span class="dot"></span><span class="dot"></span>';
      else if(count > 2) marks = `<span class="ship-count">${count}척</span>`;

      btn.innerHTML = `<span class="day-num">${d.getDate()}</span><span class="marks">${marks}</span>`;
      btn.setAttribute("aria-label", `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일, 크루즈 ${count}척`);
      btn.addEventListener("click", () => {
        selected = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if(d.getMonth() !== m || d.getFullYear() !== y) view = new Date(d.getFullYear(), d.getMonth(), 1);
        render();
      });
      grid.appendChild(btn);
    }
  }

  function renderStats(){
    const prefix = `${view.getFullYear()}-${pad(view.getMonth()+1)}-`;
    const monthRows = cruises.filter((x) => x.date.startsWith(prefix));
    $("#monthCount").textContent = monthRows.length;

    const counts = {};
    monthRows.forEach((x) => counts[x.date] = (counts[x.date] || 0) + 1);
    const entries = Object.entries(counts).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
    if(entries.length){
      const [d,c] = entries[0];
      $("#busiestDay").textContent = Number(d.slice(-2));
      $("#busiestCount").textContent = `${c}척`;
    } else {
      $("#busiestDay").textContent = "-";
      $("#busiestCount").textContent = "일정 없음";
    }

    $("#selectedCount").textContent = itemsFor(key(selected)).length;
  }

  function renderDetail(){
    const rows = itemsFor(key(selected));
    const weekdays = ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"];
    $("#selectedWeekday").textContent = weekdays[selected.getDay()];
    $("#selectedDate").textContent = `${selected.getMonth()+1}월 ${selected.getDate()}일`;
    $("#selectedPill").textContent = `${rows.length}척`;

    if(!rows.length){
      $("#eventList").innerHTML = `
        <div class="empty">
          <strong>등록된 크루즈 일정이 없어요.</strong>
          API 연결 전이거나 해당 날짜에 입항 일정이 없습니다.
        </div>`;
      return;
    }

    $("#eventList").innerHTML = rows.map((r) => `
      <article class="event">
        <div class="event-top">
          <div>
            <h3>${escapeHtml(r.ship)}</h3>
            <div class="terminal">${escapeHtml(r.terminal || "입항지 정보 없음")}</div>
          </div>
          <div class="time-badge">${timeOnly(r.arrival)} → ${timeOnly(r.departure)}</div>
        </div>
        <div class="meta">
          <div><span>승객 규모</span><strong>${passengerText(r.passengers)}</strong></div>
          <div><span>이전 기항지</span><strong>${escapeHtml(r.previousPort || "-")}</strong></div>
          <div><span>다음 기항지</span><strong>${escapeHtml(r.nextPort || "-")}</strong></div>
        </div>
      </article>
    `).join("");
  }

  function render(){
    renderCalendar();
    renderStats();
    renderDetail();
  }

  async function loadData(){
    try{
      const res = await fetch("./data.json?ts=" + Date.now(), {cache:"no-store"});
      if(!res.ok) throw new Error("data load failed");
      cruises = normalize(await res.json());
      if(cruises.length){
        $("#statusCard").classList.add("live");
        $("#statusCard").innerHTML = "<strong>일정 데이터 연결됨</strong><span>날짜를 누르면 입항 상세 정보를 볼 수 있어요.</span>";
      }
    } catch(e) {
      cruises = [];
    }
    render();
  }

  $("#prevMonth").addEventListener("click", () => {
    view = new Date(view.getFullYear(), view.getMonth()-1, 1);
    selected = new Date(view.getFullYear(), view.getMonth(), 1);
    render();
  });
  $("#nextMonth").addEventListener("click", () => {
    view = new Date(view.getFullYear(), view.getMonth()+1, 1);
    selected = new Date(view.getFullYear(), view.getMonth(), 1);
    render();
  });
  $("#todayBtn").addEventListener("click", () => {
    view = new Date(now.getFullYear(), now.getMonth(), 1);
    selected = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    render();
  });
  $("#monthTitle").addEventListener("click", () => $("#todayBtn").click());

  loadData();
})();
