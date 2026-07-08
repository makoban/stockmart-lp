const nodes = {
  receiptUploadInput: document.querySelector("#receiptUploadInput"),
  receiptUploadButton: document.querySelector("#receiptUploadButton"),
  receiptUploadStatus: document.querySelector("#receiptUploadStatus"),
  receiptUploadPreview: document.querySelector("#receiptUploadPreview"),
  receiptUploadResult: document.querySelector("#receiptUploadResult"),
  loadCostcoProductsButton: document.querySelector("#loadCostcoProductsButton"),
  costcoProductCount: document.querySelector("#costcoProductCount"),
  costcoProductList: document.querySelector("#costcoProductList"),
  ocrProofSummary: document.querySelector("#ocrProofSummary"),
  ocrSourceList: document.querySelector("#ocrSourceList"),
  masterSummary: document.querySelector("#masterSummary"),
  confirmCard: document.querySelector("#confirmCard"),
  confirmSummary: document.querySelector("#confirmSummary"),
  confirmList: document.querySelector("#confirmList"),
  confirmAddRowButton: document.querySelector("#confirmAddRowButton"),
  confirmTotal: document.querySelector("#confirmTotal"),
  confirmButton: document.querySelector("#confirmButton"),
  confirmCancelButton: document.querySelector("#confirmCancelButton"),
  confirmStatus: document.querySelector("#confirmStatus"),
  marginRateSelect: document.querySelector("#marginRateSelect"),
  dashboardGrid: document.querySelector("#dashboardGrid"),
};

let selectedReceiptFile = null;
let pendingReceipt = null;

nodes.receiptUploadInput.addEventListener("change", handleReceiptFileChange);
nodes.receiptUploadButton.addEventListener("click", uploadReceiptForOcr);
nodes.loadCostcoProductsButton.addEventListener("click", loadCostcoProducts);
nodes.confirmButton.addEventListener("click", confirmReceiptItems);
nodes.confirmAddRowButton.addEventListener("click", addManualConfirmRow);
nodes.confirmCancelButton.addEventListener("click", resetConfirmCard);
nodes.marginRateSelect.addEventListener("change", loadDashboard);

loadCostcoProducts();
loadProductMasterSummary();
loadDashboard();

async function loadDashboard() {
  try {
    const marginRate = nodes.marginRateSelect.value || "0.3";
    const response = await fetch(`/api/inventory-dashboard?marginRate=${encodeURIComponent(marginRate)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "集計を取得できませんでした");
    renderDashboard(data);
  } catch (error) {
    nodes.dashboardGrid.textContent = `集計を取得できませんでした: ${error.message}`;
  }
}

function renderDashboard(data) {
  const yen = (value) => `${Number(value || 0).toLocaleString("ja-JP")}円`;
  nodes.dashboardGrid.innerHTML = `
    <article>
      <small>在庫</small>
      <strong>${escapeHtml(data.itemCount)}SKU / ${escapeHtml(data.inventoryTotal)}点</strong>
      <span>要確認 ${escapeHtml(data.needsReview)}件</span>
    </article>
    <article>
      <small>商品紐づけ</small>
      <strong>${escapeHtml(data.masterMatchRate)}%</strong>
      <span>マスター${Number(data.masterItemCount || 0).toLocaleString("ja-JP")}件と照合</span>
    </article>
    <article>
      <small>参考仕入額</small>
      <strong>${yen(data.costKnownTotal)}</strong>
      <span>価格判明 ${escapeHtml(data.priceKnown)}/${escapeHtml(data.itemCount)}SKU</span>
    </article>
    <article>
      <small>粗利見込み(想定${Math.round((data.marginRate || 0) * 100)}%)</small>
      <strong>${yen(data.assumedProfit)}</strong>
      <span>想定売上 ${yen(data.assumedSales)}</span>
    </article>
    <article>
      <small>税率8%(食品)</small>
      <strong>${escapeHtml(data.tax8?.skuCount || 0)}SKU / ${escapeHtml(data.tax8?.quantity || 0)}点</strong>
      <span>仕入 ${yen(data.tax8?.cost)}</span>
    </article>
    <article>
      <small>税率10%(その他)</small>
      <strong>${escapeHtml(data.tax10?.skuCount || 0)}SKU / ${escapeHtml(data.tax10?.quantity || 0)}点</strong>
      <span>仕入 ${yen(data.tax10?.cost)}</span>
    </article>
  `;
}

async function loadProductMasterSummary() {
  try {
    const response = await fetch("/api/product-master");
    const data = await response.json();
    if (response.ok && data.itemCount) {
      nodes.masterSummary.textContent = `商品マスター${Number(data.itemCount).toLocaleString("ja-JP")}件`;
    }
  } catch {
    // マスター未生成でも画面は動かす
  }
}

function handleReceiptFileChange() {
  const file = nodes.receiptUploadInput.files?.[0] || null;
  selectedReceiptFile = file;
  nodes.receiptUploadButton.disabled = !file;
  if (!file) {
    nodes.receiptUploadStatus.textContent = "画像を選ぶと読み込みできます。";
    nodes.receiptUploadPreview.hidden = true;
    nodes.receiptUploadPreview.innerHTML = "";
    return;
  }

  nodes.receiptUploadStatus.textContent = `${file.name} を選択しました。`;
  const previewUrl = URL.createObjectURL(file);
  nodes.receiptUploadPreview.hidden = false;
  nodes.receiptUploadPreview.innerHTML = `
    <img src="${escapeAttribute(previewUrl)}" alt="読み込み画像プレビュー" />
    <span>選択中</span>
  `;
}

async function uploadReceiptForOcr() {
  if (!selectedReceiptFile) return;
  if (selectedReceiptFile.size > 18_000_000) {
    renderUploadError("画像は18MB以下にしてください。");
    return;
  }

  setUploadLoading(true);
  try {
    const uploadImage = await prepareReceiptImage(selectedReceiptFile);
    const response = await fetch("/api/costco-receipt-ocr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: selectedReceiptFile.name,
        mimeType: uploadImage.mimeType,
        imageBase64: uploadImage.imageBase64,
        dryRun: true,
      }),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.message || data.error || "OCRに失敗しました");
    if (data.dryRun && data.isCostcoReceipt && (data.items || []).length) {
      renderConfirmCard(data);
    } else {
      renderUploadResult(data);
    }
  } catch (error) {
    renderUploadError(error.message);
  } finally {
    setUploadLoading(false);
  }
}

function setUploadLoading(isLoading) {
  nodes.receiptUploadButton.disabled = isLoading || !selectedReceiptFile;
  nodes.receiptUploadInput.disabled = isLoading;
  nodes.receiptUploadButton.textContent = isLoading ? "読み込み中" : "OCRで読み込む";
  if (isLoading) nodes.receiptUploadStatus.textContent = "画像を読み取っています。";
}

function renderConfirmCard(data) {
  pendingReceipt = {
    imageHash: data.imageHash || "",
    fileName: data.fileName || "receipt.jpg",
    provider: data.provider || "",
  };
  const items = data.items || [];
  const matched = items.filter((item) => item.master).length;
  nodes.receiptUploadStatus.textContent = data.message || `${items.length}件を読み取りました。`;
  nodes.receiptUploadResult.className = "upload-result is-success";
  nodes.receiptUploadResult.innerHTML = `
    <div class="upload-result-head">
      <strong>読み取りOK</strong>
      <span>${escapeHtml(data.verdict?.reason || "")}</span>
    </div>
    <div class="upload-stats">
      <span>読取 ${escapeHtml(items.length)}行</span>
      <span>マスター一致 ${escapeHtml(matched)}件</span>
      <span>要確認 ${escapeHtml(items.length - matched)}件</span>
    </div>
  `;
  nodes.confirmCard.hidden = false;
  nodes.confirmSummary.textContent = `マスター一致 ${matched}/${items.length}件`;
  nodes.confirmStatus.textContent = "商品名と数量を確認して、確定ボタンを押してください。";
  // 低信頼・未一致・数量省略の行を先頭に出し、確認すべき行から見せる
  const sorted = items
    .map((item, index) => ({ item, index, flags: reviewFlags(item) }))
    .sort((a, b) => Number(b.flags.needsReview) - Number(a.flags.needsReview) || a.index - b.index);
  nodes.confirmList.innerHTML = sorted.map(({ item, flags }) => renderConfirmRow(item, flags)).join("");
  bindConfirmRowEvents(nodes.confirmList);
  updateConfirmSummary();
  nodes.confirmCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reviewFlags(item) {
  const confidence = Number(item.confidence || 0);
  const lowConfidence = confidence > 0 && confidence < 0.75;
  const noMaster = !item.master;
  const qtyOmitted = !item.quantityText || /数量省略/.test(item.quantityText);
  return { lowConfidence, noMaster, qtyOmitted, needsReview: lowConfidence || noMaster || qtyOmitted };
}

function renderConfirmRow(item, flags) {
  const master = item.master;
  const badge = master
    ? `<span class="master-badge is-matched" title="${escapeAttribute(master.source === "costcotuu" ? "商品マスターの正式名に自動補正しました" : "学習辞書と一致しました")}">マスター一致</span>`
    : `<span class="master-badge is-review">マスター未一致</span>`;
  const flagChips = [
    flags.lowConfidence ? `<span class="flag-chip">低信頼 ${Math.round(Number(item.confidence || 0) * 100)}%</span>` : "",
    flags.qtyOmitted ? `<span class="flag-chip">数量省略=1</span>` : "",
    item.manual ? `<span class="flag-chip is-manual">手入力</span>` : "",
  ].filter(Boolean).join("");
  const priceNote = master?.price ? `<small class="master-price">参考価格 ${Number(master.price).toLocaleString("ja-JP")}円${master.priceNote ? `(${escapeHtml(master.priceNote)})` : ""}</small>` : "";
  const ocrNote = master && item.ocrName && item.ocrName !== item.productName
    ? `<small class="ocr-note">OCRの読み: ${escapeHtml(item.ocrName)}</small>`
    : "";
  const qtyNote = item.quantityText && !flags.qtyOmitted
    ? `<small class="ocr-note">数量根拠: ${escapeHtml(item.quantityText)}</small>`
    : "";
  const codeField = master
    ? `<code class="confirm-code">${escapeHtml(item.itemCode || "-")}</code>`
    : `<input class="confirm-code confirm-code-input" type="text" inputmode="numeric" pattern="\\d{4,7}" maxlength="7" value="${escapeAttribute(item.itemCode || "")}" placeholder="商品番号" aria-label="商品番号" />`;
  return `
    <div class="confirm-row${flags.needsReview ? " is-flagged" : ""}">
      ${codeField}
      <div class="confirm-main">
        <div class="confirm-name-line">
          <input class="confirm-name" type="text" value="${escapeAttribute(item.productName || "")}" aria-label="商品名" />
          ${badge}
          ${flagChips}
        </div>
        ${ocrNote}
        ${qtyNote}
        ${priceNote}
      </div>
      <label class="confirm-qty-label">数量
        <input class="confirm-qty" type="number" min="1" max="99" value="${escapeAttribute(item.quantity || 1)}" aria-label="数量" />
      </label>
      <button class="confirm-remove" type="button" aria-label="この行を除外">×</button>
    </div>
  `;
}

function bindConfirmRowEvents(scope) {
  for (const button of scope.querySelectorAll(".confirm-remove")) {
    if (button.dataset.bound) continue;
    button.dataset.bound = "1";
    button.addEventListener("click", () => {
      button.closest(".confirm-row").remove();
      updateConfirmSummary();
    });
  }
  for (const input of scope.querySelectorAll(".confirm-qty")) {
    if (input.dataset.bound) continue;
    input.dataset.bound = "1";
    input.addEventListener("input", updateConfirmSummary);
  }
}

function addManualConfirmRow() {
  const flags = { lowConfidence: false, noMaster: true, qtyOmitted: false, needsReview: true };
  nodes.confirmList.insertAdjacentHTML(
    "beforeend",
    renderConfirmRow({ itemCode: "", productName: "", quantity: 1, quantityText: "手入力", manual: true, master: null }, flags),
  );
  bindConfirmRowEvents(nodes.confirmList);
  updateConfirmSummary();
  const lastRow = nodes.confirmList.lastElementChild;
  lastRow?.querySelector(".confirm-code-input")?.focus();
}

function updateConfirmSummary() {
  const rows = [...nodes.confirmList.querySelectorAll(".confirm-row")];
  const matched = nodes.confirmList.querySelectorAll(".master-badge.is-matched").length;
  const flagged = nodes.confirmList.querySelectorAll(".confirm-row.is-flagged").length;
  nodes.confirmSummary.textContent = `マスター一致 ${matched}/${rows.length}件`;
  const totalQuantity = rows.reduce((sum, row) => sum + Math.max(0, Number(row.querySelector(".confirm-qty")?.value || 0)), 0);
  nodes.confirmTotal.innerHTML = `確定すると在庫へ <strong>${totalQuantity}点</strong>(${rows.length}行)を反映します。${flagged ? `<span class="confirm-total-warn">要確認 ${flagged}行</span>` : ""}`;
}

async function confirmReceiptItems() {
  const rows = [...nodes.confirmList.querySelectorAll(".confirm-row")];
  const items = rows
    .map((row) => {
      const codeNode = row.querySelector(".confirm-code");
      const itemCode = (codeNode?.matches("input") ? codeNode.value : codeNode?.textContent || "").trim();
      return {
        itemCode,
        productName: row.querySelector(".confirm-name")?.value.trim() || "",
        quantity: Number(row.querySelector(".confirm-qty")?.value || 1),
      };
    })
    .filter((item) => item.itemCode || item.productName);
  const invalid = items.filter((item) => !/^\d{4,7}$/.test(item.itemCode) || item.productName.length < 3);
  if (invalid.length) {
    nodes.confirmStatus.textContent = `商品番号(4〜7桁の数字)と商品名(3文字以上)が足りない行が${invalid.length}行あります。修正するか×で除外してください。`;
    return;
  }
  if (!items.length) {
    nodes.confirmStatus.textContent = "確定できる行がありません。";
    return;
  }

  nodes.confirmButton.disabled = true;
  nodes.confirmStatus.textContent = "確定しています…";
  try {
    const response = await fetch("/api/costco-receipt-confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...pendingReceipt, items }),
    });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.message || "確定に失敗しました");
    nodes.confirmStatus.textContent = data.message || "確定しました。";
    nodes.confirmCard.hidden = true;
    nodes.receiptUploadResult.className = "upload-result is-success";
    nodes.receiptUploadResult.innerHTML = `
      <div class="upload-result-head">
        <strong>在庫へ反映しました</strong>
        <span>${escapeHtml(data.message || "")}</span>
      </div>
      <div class="upload-stats">
        <span>確定 ${escapeHtml(data.confirmedCount || 0)}行</span>
        <span>在庫 +${escapeHtml(data.stockAdded || 0)}点</span>
        <span>新規 ${escapeHtml(data.addedCount || 0)}件</span>
        <span>重複 ${escapeHtml(data.duplicateCount || 0)}件</span>
      </div>
      <p class="receipt-item">続けて<a href="/api/airregi-csv" download>AirレジCSVを出力</a>できます。</p>
    `;
    await loadCostcoProducts();
    await loadDashboard();
  } catch (error) {
    nodes.confirmStatus.textContent = error.message;
  } finally {
    nodes.confirmButton.disabled = false;
  }
}

function resetConfirmCard() {
  pendingReceipt = null;
  nodes.confirmCard.hidden = true;
  nodes.confirmList.innerHTML = "";
  nodes.confirmStatus.textContent = "";
  nodes.receiptUploadStatus.textContent = "画像を選ぶと読み込みできます。";
  nodes.receiptUploadResult.className = "upload-result empty";
  nodes.receiptUploadResult.textContent = "まだ画像を読み込んでいません。";
}

function renderUploadError(message) {
  nodes.receiptUploadStatus.textContent = "読み込みできませんでした。";
  nodes.receiptUploadResult.className = "upload-result is-error";
  nodes.receiptUploadResult.innerHTML = `<strong>エラー</strong><p>${escapeHtml(message)}</p>`;
}

function renderUploadResult(data) {
  const addedItems = data.addedItems || [];
  const duplicateItems = data.duplicateItems || [];
  const items = data.items || [];
  const statusText = data.isCostcoReceipt ? "コストコ判定OK" : "コストコ判定NG";
  nodes.receiptUploadStatus.textContent = data.message || statusText;
  nodes.receiptUploadResult.className = `upload-result ${data.isCostcoReceipt ? "is-success" : "is-warning"}`;
  nodes.receiptUploadResult.innerHTML = `
    <div class="upload-result-head">
      <strong>${escapeHtml(statusText)}</strong>
      <span>${escapeHtml(data.verdict?.reason || "")}</span>
    </div>
    <div class="upload-stats">
      <span>抽出 ${escapeHtml(data.extractedPairs || 0)}件</span>
      <span>在庫 +${escapeHtml(data.stockAdded || 0)}点</span>
      <span>新規 ${escapeHtml(data.addedCount || 0)}件</span>
      <span>重複 ${escapeHtml(data.duplicateCount || 0)}件</span>
    </div>
    ${renderUploadItemBlock("新規追加", addedItems)}
    ${renderUploadItemBlock("重複", duplicateItems)}
    ${items.length && !addedItems.length && !duplicateItems.length ? renderUploadItemBlock("読み取り候補", items) : ""}
  `;
}

function renderUploadItemBlock(title, items) {
  if (!items.length) return "";
  return `
    <div class="upload-items">
      <b>${escapeHtml(title)}</b>
      ${items
        .map(
          (item) => `
            <p class="receipt-item">
              <code>${escapeHtml(item.itemCode || "-")}</code>
              <strong>${escapeHtml(item.productName || "-")}</strong>
              <span class="receipt-quantity">数量 ${escapeHtml(quantityText(item))}</span>
            </p>
          `,
        )
        .join("")}
    </div>
  `;
}

async function prepareReceiptImage(file) {
  if (!file.type.startsWith("image/") || /hei[cf]/i.test(file.type)) {
    return {
      imageBase64: await fileToBase64(file),
      mimeType: file.type || "image/jpeg",
    };
  }

  try {
    const dataUrl = await fileToDataUrl(file);
    const image = await loadImage(dataUrl);
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
    if (scale >= 1 && file.size <= 1_500_000) {
      return {
        imageBase64: dataUrlToBase64(dataUrl),
        mimeType: file.type || "image/jpeg",
      };
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.84);
    return {
      imageBase64: await fileToBase64(blob),
      mimeType: "image/jpeg",
    };
  } catch (_error) {
    return {
      imageBase64: await fileToBase64(file),
      mimeType: file.type || "image/jpeg",
    };
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      resolve(text.includes(",") ? text.split(",").pop() : text);
    };
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.readAsDataURL(file);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBase64(dataUrl) {
  const text = String(dataUrl || "");
  return text.includes(",") ? text.split(",").pop() : text;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像プレビューを読み込めませんでした。"));
    image.src = src;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("画像を圧縮できませんでした。"));
    }, mimeType, quality);
  });
}

async function loadCostcoProducts() {
  nodes.loadCostcoProductsButton.disabled = true;
  try {
    const response = await fetch("/api/costco-products");
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "商品DBを取得できませんでした");
    renderCostcoProducts(data);
  } catch (error) {
    nodes.costcoProductCount.textContent = "取得失敗";
    nodes.costcoProductList.className = "product-list empty";
    nodes.costcoProductList.textContent = `商品DB取得に失敗しました: ${error.message}`;
  } finally {
    nodes.loadCostcoProductsButton.disabled = false;
  }
}

function renderCostcoProducts(data) {
  const items = data.items || [];
  nodes.costcoProductCount.textContent = `${data.itemCount || items.length}SKU / 在庫${escapeHtml(data.inventoryTotal || 0)}点`;
  renderOcrProof(data);
  if (!items.length) {
    nodes.costcoProductList.className = "product-list empty";
    nodes.costcoProductList.textContent = "まだ商品がありません。";
    return;
  }

  nodes.costcoProductList.className = "product-list";
  nodes.costcoProductList.innerHTML = items
    .slice(0, 36)
    .map(
      (item) => `
        <article class="product-row">
          <b>${escapeHtml(item.itemCode || "-")}</b>
          <div>
            <div class="product-title-line">
              <strong>${escapeHtml(item.productName || "-")}</strong>
              <span class="stock-pill">在庫 ${escapeHtml(quantityText(item))}</span>
            </div>
            <p>${escapeHtml(item.category || "未分類")} / ${escapeHtml(item.status || "仮登録")} / 取得元 ${escapeHtml(sourceText(item.sources))}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderOcrProof(data) {
  const run = data.latestRun;
  if (!run) {
    nodes.ocrProofSummary.textContent = "OCR実行ログはまだありません。";
    nodes.ocrSourceList.className = "source-list empty";
    nodes.ocrSourceList.textContent = "参考元はまだありません。";
    return;
  }

  nodes.ocrProofSummary.textContent = `${run.imagesProcessed}枚OCR / ${run.receiptImagesAccepted}枚採用 / ${run.extractedPairs}行抽出 / 在庫${data.inventoryTotal || run.inventoryTotal || 0}点`;
  const sources = run.sources || [];
  if (!sources.length) {
    nodes.ocrSourceList.className = "source-list empty";
    nodes.ocrSourceList.textContent = "参考元はまだありません。";
    return;
  }

  nodes.ocrSourceList.className = "source-list";
  nodes.ocrSourceList.innerHTML = sources
    .map((source, index) => {
      const pageLabel = ["direct-seed", "upload"].includes(source.pageUrl) ? source.imageHost || "直接画像" : hostFromUrl(source.pageUrl);
      const readItems = itemsForSource(data.items || [], source.imageHash);
      const cover = source.imageUrl
        ? `
          <a class="receipt-cover" href="${escapeAttribute(source.imageUrl)}" target="_blank" rel="noreferrer">
            <img src="${escapeAttribute(source.imageUrl)}" alt="参考レシート${index + 1}" loading="lazy" referrerpolicy="no-referrer" />
            <span>表紙</span>
          </a>
        `
        : `<div class="receipt-cover is-empty">表紙なし</div>`;
      const pageLink =
        source.pageUrl && !["direct-seed", "upload"].includes(source.pageUrl)
          ? `<a class="open-link" href="${escapeAttribute(source.pageUrl)}" target="_blank" rel="noreferrer">元ページ</a>`
          : "";
      return `
        <article class="source-row">
          ${cover}
          <div>
            <b>参考${index + 1}</b>
            <strong>${escapeHtml(pageLabel || source.imageHost || "公開画像")}</strong>
            <p>${escapeHtml(source.imageHost || "-")} / 画像ID ${escapeHtml(source.imageHash || "-")} / ${escapeHtml(source.pairs || 0)}件抽出 / 数量${escapeHtml(source.quantity || 0)}点</p>
            <div class="receipt-readout">
              <span>読み取ったデータ ${readItems.length}件 / 数量${escapeHtml(itemsQuantityTotal(readItems))}点</span>
              ${renderReceiptItems(readItems)}
            </div>
          </div>
          ${pageLink}
        </article>
      `;
    })
    .join("");
}

function renderReceiptItems(items) {
  if (!items.length) return `<p class="receipt-empty">商品番号・商品名の候補はありません。</p>`;
  return items
    .map(
      (item) => `
        <p class="receipt-item">
          <code>${escapeHtml(item.itemCode || "-")}</code>
          <strong>${escapeHtml(item.productName || "-")}</strong>
          <span class="receipt-quantity">数量 ${escapeHtml(quantityText(item))}</span>
        </p>
      `,
    )
    .join("");
}

function quantityText(item) {
  const quantity = Number(item.stockQuantity || item.inventoryQuantity || item.quantity || 0);
  return `${quantity || 0}${item.quantityUnit || "点"}`;
}

function itemsQuantityTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.stockQuantity || item.inventoryQuantity || item.quantity || 0), 0);
}

function itemsForSource(items, imageHash) {
  return items
    .flatMap((item) =>
      (item.sources || [])
        .filter((source) => source.imageHash === imageHash)
        .map((source) => ({
          ...item,
          quantity: Number(source.quantity || 1),
          stockQuantity: Number(source.quantity || 1),
          inventoryQuantity: Number(source.quantity || 1),
          quantityText: source.quantityText || "",
        })),
    )
    .sort((a, b) => String(a.itemCode || "").localeCompare(String(b.itemCode || ""), "ja"));
}

function sourceText(sources = []) {
  if (!sources.length) return "不明";
  const hosts = [...new Set(sources.map((source) => source.imageHost).filter(Boolean))];
  const label = hosts.slice(0, 2).join("、") || "公開画像";
  return sources.length > 1 ? `${label}ほか${sources.length}件` : label;
}

function hostFromUrl(rawUrl) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return rawUrl || "";
  }
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
