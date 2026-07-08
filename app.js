const state = {
  stores: [],
  selectedStoreId: null,
  data: null,
};

const nodes = {
  researchButton: document.querySelector("#researchButton"),
  storeSelect: document.querySelector("#storeSelect"),
  storeCard: document.querySelector("#storeCard"),
  storeName: document.querySelector("#storeName"),
  storeDetail: document.querySelector("#storeDetail"),
  storeLink: document.querySelector("#storeLink"),
  mapLink: document.querySelector("#mapLink"),
  storeHeroName: document.querySelector("#storeHeroName"),
  storeHeroMeta: document.querySelector("#storeHeroMeta"),
  message: document.querySelector("#message"),
  placeText: document.querySelector("#placeText"),
  indexCard: document.querySelector(".index-card"),
  indexScore: document.querySelector("#indexScore"),
  indexMeter: document.querySelector("#indexMeter"),
  indexLabel: document.querySelector("#indexLabel"),
  indexReason: document.querySelector("#indexReason"),
  headline: document.querySelector("#headline"),
  summaryText: document.querySelector("#summaryText"),
  todayAction: document.querySelector("#todayAction"),
  tomorrowWeather: document.querySelector("#tomorrowWeather"),
  tomorrowDetail: document.querySelector("#tomorrowDetail"),
  weatherDetailButton: document.querySelector("#weatherDetailButton"),
  eventDetailButton: document.querySelector("#eventDetailButton"),
  eventCount: document.querySelector("#eventCount"),
  eventMeta: document.querySelector("#eventMeta"),
  detailBlock: document.querySelector("#detailBlock"),
  weatherSection: document.querySelector("#weatherSection"),
  eventsSection: document.querySelector("#eventsSection"),
  signalsList: document.querySelector("#signalsList"),
  stockList: document.querySelector("#stockList"),
  eventsList: document.querySelector("#eventsList"),
  weatherList: document.querySelector("#weatherList"),
};

nodes.researchButton.addEventListener("click", researchSelectedStore);
nodes.weatherDetailButton.addEventListener("click", () => openDetail(nodes.weatherSection));
nodes.eventDetailButton.addEventListener("click", () => openDetail(nodes.eventsSection));
nodes.storeSelect.addEventListener("change", () => {
  state.selectedStoreId = nodes.storeSelect.value;
  renderSelectedStore();
  resetResult();
});

loadStores({ autoResearch: new URLSearchParams(window.location.search).get("demo") === "1" });

async function loadStores({ autoResearch = false } = {}) {
  setStoreLoading(true);

  try {
    const response = await fetch("/api/stores");
    const data = await response.json();
    if (!response.ok || !data.stores?.length) throw new Error(data.message || "店舗を取得できませんでした");

    state.stores = data.stores;
    if (!state.selectedStoreId || !state.stores.some((store) => String(store.id) === String(state.selectedStoreId))) {
      state.selectedStoreId = String(state.stores[0].id);
    }
    renderStoreOptions();
    renderSelectedStore();
    showMessage("店舗を選んで調査できます。", "success");
    if (autoResearch) await researchSelectedStore();
  } catch (error) {
    showMessage(`店舗取得に失敗しました: ${error.message}`, "error");
  } finally {
    setStoreLoading(false);
  }
}

async function researchSelectedStore() {
  const store = selectedStore();
  if (!store) {
    showMessage("店舗を選択してください。", "error");
    return;
  }

  setLoading(`${store.shortName || store.title}を調査しています。`);
  try {
    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storeId: store.id }),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.message || data.error || "調査に失敗しました");
    state.data = data;
    render(data);
    setIdle();
    showMessage("調査完了。下の詳細ボタンから一覧を確認できます。", "success");
  } catch (error) {
    setIdle();
    showMessage(`調査に失敗しました: ${error.message}`, "error");
  }
}

function renderStoreOptions() {
  nodes.storeSelect.innerHTML = state.stores
    .map((store) => `<option value="${escapeAttribute(store.id)}">${escapeHtml(store.shortName || store.title)}</option>`)
    .join("");
  nodes.storeSelect.value = String(state.selectedStoreId);
}

function renderSelectedStore() {
  const store = selectedStore();
  if (!store) return;

  nodes.storeHeroName.textContent = store.shortName || store.title;
  nodes.storeHeroMeta.textContent = [store.access, store.hours].filter(Boolean).join(" / ") || "店舗周辺";
  nodes.placeText.textContent = store.area ? `${store.area}周辺` : "店舗周辺";
  nodes.storeName.textContent = store.title;
  nodes.storeDetail.textContent = [store.access, store.address, store.hours].filter(Boolean).join(" / ");
  nodes.storeLink.href = store.permalink || "https://stockmart-sp.com/store/";
  nodes.mapLink.href = store.googleMapsUrl || store.permalink || "https://stockmart-sp.com/store/";

  const thumb = nodes.storeCard.querySelector(".store-thumb");
  if (store.image) {
    thumb.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.18)), url("${store.image}")`;
    thumb.classList.add("has-image");
  } else {
    thumb.style.backgroundImage = "";
    thumb.classList.remove("has-image");
  }
}

function render(data) {
  const summary = data.summary;
  const tomorrow = data.weather.tomorrow || {};
  const index = data.derived.purchaseIndex || {};
  const store = data.store || selectedStore();

  nodes.storeHeroName.textContent = store?.shortName || data.place.label || "店舗周辺";
  nodes.storeHeroMeta.textContent = [store?.access, store?.hours].filter(Boolean).join(" / ") || data.place.label || "店舗周辺";
  nodes.placeText.textContent = store?.area ? `${store.area}周辺` : "店舗周辺";
  nodes.indexCard.dataset.tone = index.tone || "normal";
  nodes.indexScore.textContent = index.score ?? "--";
  nodes.indexMeter.style.width = `${index.score || 0}%`;
  nodes.indexLabel.textContent = index.label || "通常";
  nodes.indexReason.textContent = index.primaryAction || "通常発注でOK";
  nodes.headline.textContent = summaryTitle(summary.headline, index);
  nodes.summaryText.innerHTML = renderSummaryBody(summary.summary || "");
  nodes.todayAction.textContent = cleanSummaryText(clampDisplaySentence(summary.todayAction || index.reason || "", 180));
  nodes.tomorrowWeather.textContent = `${tomorrow.icon || "🌡️"} ${tomorrow.condition || "-"}`;
  nodes.tomorrowDetail.textContent = weatherCopy(tomorrow);
  nodes.eventCount.textContent = `${data.events.length}件`;
  nodes.eventMeta.textContent = topEventCopy(data.events, data.period?.start) || formatDateRange(data.period?.start, data.period?.end);

  renderSimpleList(nodes.stockList, data.derived.stockHints || [], (item) => ({
    icon: item.icon,
    title: `${item.category}: ${item.recommendation}`,
    body: item.reason,
  }));
  renderSimpleList(nodes.signalsList, data.derived.signals || [], (item) => ({
    icon: item.icon,
    title: `${item.label}: ${item.impact}`,
    body: item.reason,
  }));
  renderEvents(data);
  renderWeather(data);
}

function resetResult() {
  state.data = null;
  nodes.indexCard.dataset.tone = "normal";
  nodes.indexScore.textContent = "--";
  nodes.indexMeter.style.width = "0%";
  nodes.indexLabel.textContent = "調査待ち";
  nodes.indexReason.textContent = "店舗を選んで調査してください。";
  nodes.headline.textContent = "まだ調査していません";
  nodes.summaryText.innerHTML = renderSummaryBody("天気と近隣イベントから、まず「多め・通常・少なめ」を出します。");
  nodes.todayAction.textContent = "";
  nodes.tomorrowWeather.textContent = "-";
  nodes.tomorrowDetail.textContent = "-";
  nodes.eventCount.textContent = "0件";
  nodes.eventMeta.textContent = "-";
}

function renderSimpleList(target, items, mapItem) {
  if (!items.length) {
    target.className = "simple-list empty";
    target.textContent = "情報がありません。";
    return;
  }
  target.className = "simple-list";
  target.innerHTML = items
    .map((item) => {
      const mapped = mapItem(item);
      return `
        <article class="simple-row">
          <span>${escapeHtml(mapped.icon || "•")}</span>
          <div>
            <strong>${escapeHtml(mapped.title)}</strong>
            <p>${escapeHtml(mapped.body)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderEvents(data) {
  if (!data.events.length) {
    nodes.eventsList.className = "event-list empty";
    nodes.eventsList.textContent = "イベント候補は見つかりませんでした。";
    return;
  }

  const calendar = buildEventCalendar(data.events, data.period?.start, data.period?.end);
  nodes.eventsList.className = "events-panel";
  nodes.eventsList.innerHTML = `
    ${renderCalendarStats(calendar)}
    ${renderCalendarGrid(calendar)}
    ${renderCalendarAgenda(calendar)}
    ${renderCalendarReview(calendar)}
  `;
}

function renderEventRowList(events) {
  return events
    .map(
      (event) => `
        <article class="event-row">
          <span>${eventIcon(event.category)}</span>
          <div>
            <div class="row-top">
              <b class="event-date-label">${escapeHtml(eventDateLabel(event))}</b>
              <small>${escapeHtml(event.category || "地域")}</small>
            </div>
            <strong>${escapeHtml(displayEventTitle(event.title))}</strong>
            <p>${escapeHtml(displayEventSnippet(event.snippet))}</p>
            <small>${escapeHtml(event.source || "source")}</small>
          </div>
          ${event.url ? `<a class="open-link" href="${escapeAttribute(event.url)}" target="_blank" rel="noreferrer">開く</a>` : ""}
        </article>
      `,
    )
    .join("");
}

function buildEventCalendar(events = [], startText, endText) {
  const start = toLocalDate(startText) || startOfDay(new Date());
  const end = toLocalDate(endText) || addCalendarDays(start, 30);
  const dateGroups = new Map();
  const review = [];

  for (const event of sortEventsForDisplay(events, startText)) {
    const date = parseEventDate(event.inferredDate, toIsoDate(start));
    if (date && date >= start && date <= end) {
      const key = toIsoDate(date);
      if (!dateGroups.has(key)) dateGroups.set(key, []);
      dateGroups.get(key).push(event);
    } else {
      review.push({
        ...event,
        reviewLabel: date && date < start ? "終了候補" : hasEventTiming(event.inferredDate) ? "時期のみ" : "日時確認",
      });
    }
  }

  const calendarStart = addCalendarDays(start, -start.getDay());
  const calendarEnd = addCalendarDays(end, 6 - end.getDay());
  const days = [];
  for (let date = calendarStart; date <= calendarEnd; date = addCalendarDays(date, 1)) {
    const key = toIsoDate(date);
    days.push({
      key,
      date,
      inPeriod: date >= start && date <= end,
      events: dateGroups.get(key) || [],
    });
  }

  return {
    start,
    end,
    days,
    dateGroups,
    datedCount: [...dateGroups.values()].reduce((sum, items) => sum + items.length, 0),
    review,
    totalCount: events.length,
  };
}

function renderCalendarStats(calendar) {
  return `
    <div class="calendar-stats" aria-label="イベント集計">
      <div>
        <b>${escapeHtml(calendar.datedCount)}件</b>
        <span>日付あり</span>
      </div>
      <div>
        <b>${escapeHtml(calendar.review.length)}件</b>
        <span>日時確認</span>
      </div>
      <div>
        <b>${escapeHtml(formatDateRange(toIsoDate(calendar.start), toIsoDate(calendar.end)))}</b>
        <span>対象期間</span>
      </div>
    </div>
  `;
}

function renderCalendarGrid(calendar) {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `
    <section class="event-calendar-card" aria-label="イベントカレンダー">
      <div class="calendar-weekdays">
        ${weekdays.map((day) => `<span>${escapeHtml(day)}</span>`).join("")}
      </div>
      <div class="event-calendar-grid">
        ${calendar.days
          .map((day) => {
            const icons = [...new Set(day.events.map((event) => eventIcon(event.category)))].slice(0, 3).join(" ");
            const classes = ["calendar-day", day.inPeriod ? "is-period" : "is-outside", day.events.length ? "has-event" : ""]
              .filter(Boolean)
              .join(" ");
            return `
              <div class="${classes}" aria-label="${escapeAttribute(calendarDayAria(day))}">
                <time datetime="${escapeAttribute(day.key)}">${escapeHtml(day.date.getDate())}</time>
                ${
                  day.events.length
                    ? `<span class="calendar-count">${escapeHtml(day.events.length)}件</span><small aria-hidden="true">${escapeHtml(icons)}</small>`
                    : "<small></small>"
                }
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderCalendarAgenda(calendar) {
  const groups = [...calendar.dateGroups.entries()].sort(([a], [b]) => a.localeCompare(b));
  if (!groups.length) {
    return `<div class="calendar-empty">日付が確定したイベントはまだありません。</div>`;
  }

  return `
    <div class="calendar-agenda">
      ${groups
        .map(
          ([dateKey, events]) => `
            <section class="agenda-day">
              <div class="agenda-date">
                <b>${escapeHtml(formatDate(dateKey))}</b>
                <span>${escapeHtml(events.length)}件</span>
              </div>
              <div class="agenda-events">
                ${events
                  .map(
                    (event) => `
                      <article class="agenda-event">
                        <span>${escapeHtml(eventIcon(event.category))}</span>
                        <div>
                          <strong>${escapeHtml(displayEventTitle(event.title))}</strong>
                          <p>${escapeHtml(displayEventSnippet(event.snippet))}</p>
                          <small>${escapeHtml(event.category || "地域")} / ${escapeHtml(event.source || "source")}</small>
                        </div>
                        ${event.url ? `<a class="open-link" href="${escapeAttribute(event.url)}" target="_blank" rel="noreferrer">開く</a>` : ""}
                      </article>
                    `,
                  )
                  .join("")}
              </div>
            </section>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCalendarReview(calendar) {
  if (!calendar.review.length) return "";
  return `
    <details class="calendar-review">
      <summary>日時確認が必要 ${escapeHtml(calendar.review.length)}件</summary>
      <div class="calendar-review-list">
        ${renderEventRowList(calendar.review)}
      </div>
    </details>
  `;
}

function calendarDayAria(day) {
  const label = formatDate(day.key);
  if (!day.events.length) return `${label} イベントなし`;
  return `${label} ${day.events.length}件 ${day.events.map((event) => displayEventTitle(event.title)).join("、")}`;
}

function renderWeather(data) {
  nodes.weatherList.className = "weather-list";
  nodes.weatherList.innerHTML = (data.weather.daily || [])
    .map(
      (day) => `
        <article class="weather-row">
          <div class="weather-day">
            <b>${escapeHtml(formatDate(day.date))}</b>
            <small>${escapeHtml(day.label)}</small>
          </div>
          <span class="weather-icon" aria-hidden="true">${escapeHtml(day.icon || "🌡️")}</span>
          <div class="weather-main">
            <strong>${escapeHtml(day.condition)}</strong>
            <p>
              <span>最高${value(day.maxTemp, "度")}</span>
              <span>最低${value(day.minTemp, "度")}</span>
              <span>降水${value(day.rainProbability, "%")}</span>
              <span>UV${value(day.uvIndex, "")}</span>
            </p>
          </div>
        </article>
      `,
    )
    .join("");
}

function weatherCopy(day) {
  if (!day) return "-";
  return `${formatDate(day.date)} / 最高${value(day.maxTemp, "度")} / 降水${value(day.rainProbability, "%")}`;
}

function topEventCopy(events = [], referenceDate) {
  const concrete = events.filter((event) => event.source !== "検索リンク");
  const base = (concrete.length ? concrete : events).filter((item) => item.title);
  const event = sortEventsForDisplay(base, referenceDate)[0];
  if (!event) return "";
  const date = eventDateLabel(event);
  return `${date} / ${shortText(event.title)}`;
}

function sortEventsForDisplay(events = [], referenceDate) {
  return [...events].sort((a, b) => {
    const pastDiff = Number(isPastEvent(a, referenceDate)) - Number(isPastEvent(b, referenceDate));
    if (pastDiff) return pastDiff;
    const dateDiff = Number(hasEventTiming(b.inferredDate)) - Number(hasEventTiming(a.inferredDate));
    if (dateDiff) return dateDiff;
    return eventScore(b) - eventScore(a);
  });
}

function eventDateLabel(event) {
  const date = String(event.inferredDate || "").trim();
  if (hasEventDate(date)) return `開催日時: ${date}`;
  if (/^\d{1,2}月中$/.test(date)) return `開催時期: ${date}`;
  return "開催日時: 要確認";
}

function displayEventTitle(title) {
  const raw = String(title || "").replace(/\s+/g, " ").trim();
  const wasTruncated = /(\.\.\.|…+)$/.test(raw);
  const value = raw
    .replace(/\s*\.\.\.$/, "")
    .replace(/\s*…+$/, "")
    .trim();
  return wasTruncated && value ? `${value}（詳細確認）` : value;
}

function displayEventSnippet(snippet) {
  const value = cleanVisibleText(snippet);
  return value || "詳細はリンク先で確認してください。";
}

function cleanVisibleText(text) {
  return String(text || "")
    .replace(/\s*(?:\.\.\.|…+)\s*/g, "（続きはリンク先）")
    .replace(/\s+/g, " ")
    .trim();
}

function hasEventTiming(dateText) {
  const date = String(dateText || "");
  return hasEventDate(date) || /^\d{1,2}月中$/.test(date);
}

function clampDisplaySentence(text, maxLength) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, maxLength);
  const sentenceEnd = Math.max(clipped.lastIndexOf("。"), clipped.lastIndexOf("！"), clipped.lastIndexOf("？"));
  if (sentenceEnd >= Math.floor(maxLength * 0.55)) return clipped.slice(0, sentenceEnd + 1);
  const softBreak = Math.max(clipped.lastIndexOf("、"), clipped.lastIndexOf("・"), clipped.lastIndexOf(" "));
  const rounded = softBreak >= Math.floor(maxLength * 0.55) ? clipped.slice(0, softBreak) : clipped.slice(0, maxLength - 1);
  return /[。！？!?]$/.test(rounded) ? rounded : `${rounded}。`;
}

function renderSummaryBody(text) {
  const value = cleanSummaryText(clampDisplaySentence(text, 300));
  const sentences = value
    .split(/(?<=。)/)
    .map((item) => item.trim())
    .filter(Boolean);
  const lines = sentences.length ? sentences : [value];
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function summaryTitle(headline, index) {
  const value = cleanSummaryText(headline || "");
  if (!value || value.includes("詳細確認") || value.length > 32) {
    return `仕入れ${index.label || "通常"}: ${index.primaryAction || "通常発注でOK"}`;
  }
  return value;
}

function cleanSummaryText(text) {
  return String(text || "")
    .replace(/\s*\.\.\./g, "（詳細確認）")
    .replace(/\s*…+/g, "（詳細確認）")
    .replace(/\s+/g, " ")
    .trim();
}

function shortText(text) {
  return displayEventTitle(text);
}

function eventScore(event) {
  const text = `${event.title || ""} ${event.snippet || ""} ${event.category || ""}`;
  let score = 0;
  if (/フェア|祭り|夏祭り|盆踊り|マルシェ|花火|フリマ|フリーマーケット|大会|公演|ライブ|ワークショップ|学園祭|運動会|体育祭/i.test(text)) score += 30;
  if (/サマーフェア|花火大会|マルシェ|フリーマーケット|盆踊り/i.test(text)) score += 20;
  if (event.inferredDate && hasEventDate(event.inferredDate)) score += 8;
  if (/公式サイト|イベント一覧|周辺のイベント|ウォーカープラス|ファンページ|観光機構|イベント情報/i.test(event.title || "")) score -= 18;
  if (/検索で確認|日付確認/.test(event.inferredDate || "")) score -= 3;
  return score;
}

function isPastEvent(event, referenceDate) {
  const eventDate = parseEventDate(event.inferredDate, referenceDate);
  if (!eventDate) return false;
  const current = new Date(`${referenceDate}T00:00:00`);
  eventDate.setHours(0, 0, 0, 0);
  return eventDate < current;
}

function parseEventDate(dateText, referenceDate) {
  if (!dateText || !referenceDate) return null;
  const text = String(dateText);
  const ref = new Date(`${referenceDate}T00:00:00`);
  let match = text.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  match = text.match(/(\d{1,2})[\/月](\d{1,2})/);
  if (!match) return null;
  return new Date(ref.getFullYear(), Number(match[1]) - 1, Number(match[2]));
}

function toLocalDate(dateText) {
  if (!dateText) return null;
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return startOfDay(date);
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addCalendarDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasEventDate(dateText) {
  if (!dateText) return false;
  return /(\d{1,4})[-/年月](\d{1,2})/.test(String(dateText));
}

function openDetail(target) {
  nodes.detailBlock.open = true;
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("focus-flash");
    window.setTimeout(() => target.classList.remove("focus-flash"), 900);
  });
}

function selectedStore() {
  return state.stores.find((store) => String(store.id) === String(state.selectedStoreId));
}

function setStoreLoading(isLoading) {
  nodes.storeSelect.disabled = isLoading;
  nodes.researchButton.disabled = isLoading || !state.stores.length;
}

function setLoading(text) {
  nodes.researchButton.disabled = true;
  nodes.storeSelect.disabled = true;
  nodes.researchButton.classList.add("loading");
  showMessage(text, "info");
}

function setIdle() {
  nodes.researchButton.disabled = !state.stores.length;
  nodes.storeSelect.disabled = false;
  nodes.researchButton.classList.remove("loading");
}

function showMessage(text, type = "info") {
  nodes.message.textContent = text;
  nodes.message.dataset.type = type;
}

function eventIcon(category) {
  return {
    祭り: "🏮",
    マルシェ: "🛍️",
    学校: "🏫",
    公共施設: "🏛️",
    スポーツ: "🏃",
    地域: "📌",
  }[category] || "📌";
}

function value(input, suffix) {
  return input === null || input === undefined ? "-" : `${input}${suffix}`;
}

function formatDate(dateText) {
  if (!dateText) return "日付未定";
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateText;
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
}

function formatDateRange(start, end) {
  if (!start || !end) return "-";
  return `${formatDate(start)}〜${formatDate(end)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
