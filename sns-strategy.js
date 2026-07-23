const budgetRange = document.querySelector("#budgetRange");
const storeRange = document.querySelector("#storeRange");

const formatNumber = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 1,
});

function updateSimulator() {
  if (!budgetRange || !storeRange) return;

  const budgetMan = Number(budgetRange.value);
  const stores = Number(storeRange.value);
  const basketYen = 3500;
  const contributionMargin = 0.25;
  const days = 30;
  const transactionsMonth = (budgetMan * 10000) / (basketYen * contributionMargin);
  const transactionsDay = transactionsMonth / days;
  const transactionsStore = transactionsDay / stores;

  document.querySelector("#budgetOutput").textContent = `${budgetMan}万円`;
  document.querySelector("#storeOutput").textContent = `${stores}店舗`;
  document.querySelector("#transactionMonth").textContent = `${formatNumber.format(Math.round(transactionsMonth))}件`;
  document.querySelector("#transactionDay").textContent = `${formatNumber.format(transactionsDay)}件`;
  document.querySelector("#transactionStore").textContent = `${formatNumber.format(transactionsStore)}件`;
}

budgetRange?.addEventListener("input", updateSimulator);
storeRange?.addEventListener("input", updateSimulator);
updateSimulator();

document.querySelector("#printButton")?.addEventListener("click", () => window.print());
