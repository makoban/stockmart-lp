const QUANTITIES = [50, 100, 200, 300, 400, 500];

const PRODUCTS = [
  {
    code: "5001",
    name: "5.6oz ハイクオリティーTシャツ",
    variants: [
      { size: "S-XL", color: "白", prices: [113214, 199917, 371049, 526798, 679167, 807868] },
      { size: "S-XL", color: "カラー56色", prices: [116339, 205750, 382339, 543204, 700379, 833603] },
      { size: "XXL", color: "白", prices: [123214, 218584, 407178, 579298, 747045, 890220] },
      { size: "XXL", color: "カラー56色", prices: [129822, 230917, 431049, 613985, 791894, 944633] },
      { size: "XXXL", color: "白", prices: [130714, 232584, 434274, 618673, 797955, 951985] },
      { size: "XXXL", color: "カラー56色", prices: [136964, 244250, 456855, 651485, 840379, 1003457] }
    ]
  },
  {
    code: "5942",
    name: "6.2oz プレミアムTシャツ",
    variants: [
      { size: "XS-XL", color: "白", prices: [128839, 229084, 427500, 608829, 785228, 936544] },
      { size: "XS-XL", color: "カラー36色", prices: [132322, 235584, 440082, 627110, 808864, 965220] },
      { size: "XXL", color: "白", prices: [143839, 257084, 481694, 687579, 887045, 1060074] },
      { size: "XXL", color: "カラー36色", prices: [150714, 269917, 506533, 723673, 933713, 1116692] },
      { size: "XXXL", color: "白", prices: [150714, 269917, 506533, 723673, 933713, 1116692] },
      { size: "XXXL", color: "カラー36色", prices: [159822, 286917, 539435, 771485, 995530, 1191692] }
    ]
  },
  {
    code: "5006",
    name: "5.6oz ポケット付きTシャツ",
    variants: [
      { size: "XS-XL", color: "白／カラー6色", prices: [136072, 242584, 453629, 646798, 834319, 996103] }
    ]
  },
  {
    code: "4277",
    name: "7.1oz オープンエンド ラギッドTシャツ",
    variants: [
      { size: "S-XXL", color: "白", prices: [157947, 283417, 532662, 761642, 982803, 1176250] },
      { size: "S-XXL", color: "カラー6色", prices: [164464, 295584, 556210, 795860, 1027045, 1229927] },
      { size: "S-XXL", color: "アッシュ", prices: [170089, 306084, 576533, 825392, 1065228, 1276250] }
    ]
  },
  {
    code: "5011",
    name: "5.6oz リブ付きロングスリーブTシャツ（1.6インチリブ）",
    variants: [
      { size: "XS-XL", color: "白", prices: [135714, 241917, 452339, 644923, 831894, 993162] },
      { size: "XS-XL", color: "カラー22色", prices: [142589, 254750, 477178, 681017, 878560, 1049780] },
      { size: "XXL", color: "白", prices: [146339, 261750, 490727, 700704, 904015, 1080662] },
      { size: "XXL", color: "カラー22色", prices: [155089, 278084, 522339, 746642, 963409, 1152720] }
    ]
  },
  {
    code: "5913",
    name: "6.2oz プレミアム ロングスリーブTシャツ（2.1インチリブ）",
    variants: [
      { size: "S-XL", color: "白", prices: [165447, 297417, 559758, 801017, 1033713, 1238015] },
      { size: "S-XL", color: "カラー6色", prices: [173839, 313084, 590082, 845079, 1090682, 1307133] },
      { size: "XXL", color: "白", prices: [190089, 343417, 648790, 930392, 1200985, 1440957] },
      { size: "XXL", color: "カラー6色", prices: [204197, 369750, 699758, 1004454, 1296743, 1557133] }
    ]
  },
  {
    code: "5508",
    name: "5.6oz ビッグシルエットTシャツ",
    variants: [
      { size: "S-XL", color: "白", prices: [137947, 246084, 460404, 656642, 847045, 1011544] },
      { size: "XXL", color: "カラー6色", prices: [151964, 272250, 511049, 730235, 942198, 1126985] }
    ]
  },
  {
    code: "5509",
    name: "ビッグシルエット ロングスリーブTシャツ",
    variants: [
      { size: "S-XL", color: "白／カラー13色", prices: [151072, 270584, 507823, 725548, 936137, 1119633] }
    ]
  },
  {
    code: "5044",
    name: "10.0oz クルーネックスウェット（裏パイル）",
    variants: [
      { size: "S-XL", color: "白・カラー19色", prices: [198662, 359417, 679758, 975392, 1259167, 1511544] },
      { size: "S-XL", color: "アッシュ", prices: [244643, 445250, 845888, 1216798, 1571288, 1890220] },
      { size: "XXL", color: "白・カラー19色", prices: [221518, 402084, 762339, 1095392, 1414319, 1699780] },
      { size: "XXL", color: "アッシュ", prices: [260893, 475584, 904597, 1302110, 1681592, 2024044] },
      { size: "XXXL", color: "白・カラー19色", prices: [230893, 419584, 796210, 1144610, 1477955, 1776985] }
    ]
  },
  {
    code: "5214",
    name: "10.0oz プルオーバーパーカー（裏パイル）",
    variants: [
      { size: "S-XL", color: "白・カラー23色", prices: [238393, 433584, 823307, 1183985, 1528864, 1838750] },
      { size: "S-XL", color: "アッシュ", prices: [294018, 537417, 1024274, 1476017, 1906440, 2296839] },
      { size: "XXL", color: "白・カラー23色", prices: [270537, 493584, 939435, 1352735, 1747045, 2103457] },
      { size: "XXL", color: "アッシュ", prices: [316518, 579417, 1105565, 1594142, 2059167, 2482133] },
      { size: "XXXL", color: "白・カラー23色", prices: [281787, 514584, 980082, 1411798, 1823409, 2196103] }
    ]
  },
  {
    code: "5213",
    name: "10.0oz フルジップパーカー（裏パイル）",
    variants: [
      { size: "S-XL", color: "白・カラー47色", prices: [255537, 465584, 885243, 1273985, 1645228, 1979927] },
      { size: "XXL", color: "白・カラー47色", prices: [289287, 528584, 1007178, 1451173, 1874319, 2257868] },
      { size: "XXXL", color: "白・カラー47色", prices: [304912, 557750, 1063629, 1533204, 1980379, 2386544] }
    ]
  },
  {
    code: "5205",
    name: "10.0oz ビッグシルエット クルーネックスウェット",
    variants: [
      { size: "M-XL", color: "アッシュ", prices: [268393, 489584, 931694, 1341485, 1732500, 2085809] },
      { size: "M-XL", color: "カラー Navy／Black", prices: [279912, 511084, 973307, 1401954, 1810682, 2180662] }
    ]
  },
  {
    code: "5204",
    name: "10.0oz ビッグシルエット プルオーバーパーカー",
    variants: [
      { size: "M-XL", color: "アッシュ", prices: [320893, 587584, 1121372, 1617110, 2088864, 2518162] },
      { size: "M-XL", color: "カラー Navy／Black", prices: [332412, 609084, 1162984, 1677579, 2167045, 2613015] }
    ]
  },
  {
    code: "5203",
    name: "10.0oz ビッグシルエット フルジップパーカー",
    variants: [
      { size: "M-XL", color: "カラー6色", prices: [354912, 651084, 1244274, 1795704, 2319773, 2798309] },
      { size: "M-XL", color: "アッシュ", prices: [368393, 676250, null, 1866485, 2411288, 2909339] }
    ]
  },
  {
    code: "5769",
    name: "12.7oz ヘヴィーウェイト クルーネックスウェット",
    variants: [
      { size: "S-XL", color: "白・カラー10色", prices: [266162, 485417, 923629, 1329767, 1717349, 2067427] },
      { size: "XXL", color: "白・カラー10色", prices: [281518, 514084, 979113, 1410392, 1821592, 2193898] }
    ]
  },
  {
    code: "5768",
    name: "12.7oz ヘヴィーウェイト プルオーバーパーカー",
    variants: [
      { size: "S-XL", color: "白・カラー8色", prices: [306518, 560750, 1069435, 1541642, 1991288, 2399780] },
      { size: "XXL", color: "白・カラー8色", prices: [325893, 596917, 1139435, 1643360, 2122803, 2559339] }
    ]
  },
  {
    code: "5767",
    name: "12.7oz ヘヴィーウェイト フルジップパーカー",
    variants: [
      { size: "S-XL", color: "カラー4色", prices: [337143, 617917, 1180082, 1702423, 2199167, 2651985] },
      { size: "XXL", color: "カラー4色", prices: [361787, 663917, null, 1831798, 2366440, 2854927] }
    ]
  },
  {
    code: "2000",
    name: "GILDAN 2000",
    variants: [
      { size: "S-XL", color: "白・カラー47色", prices: [122054, 216417, 402984, 573204, 739167, 880662] },
      { size: "XXL", color: "白・カラー47色", prices: [131875, 234750, 438468, 624767, 805834, 961544] }
    ]
  },
  {
    code: "7600",
    name: "GILDAN 7600",
    variants: [
      { size: "S-XL", color: "白・カラー24色", prices: [108662, 191417, 354597, 502892, 648258, 770368] },
      { size: "XXL", color: "白・カラー24色", prices: [118483, 209750, 390082, 554454, 714924, 851250] }
    ]
  }
];

const productSelect = document.querySelector("#productSelect");
const variantSelect = document.querySelector("#variantSelect");
const selectedCode = document.querySelector("#selectedCode");
const selectedName = document.querySelector("#selectedName");
const selectedVariant = document.querySelector("#selectedVariant");
const selectedQuantity = document.querySelector("#selectedQuantity");
const selectedPrice = document.querySelector("#selectedPrice");
const priceGrid = document.querySelector("#priceGrid");
const catalogList = document.querySelector("#catalogList");

let selectedQuantityIndex = 1;

const formatYen = (value) => {
  if (value === null) return "個別確認";
  return "¥" + new Intl.NumberFormat("ja-JP").format(value);
};

const currentProduct = () => PRODUCTS[Number(productSelect.value)];
const currentVariant = () => currentProduct().variants[Number(variantSelect.value)];

const renderProductOptions = () => {
  PRODUCTS.forEach((product, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = "品番 " + product.code + "｜" + product.name;
    productSelect.append(option);
  });
};

const renderVariantOptions = () => {
  const product = currentProduct();
  variantSelect.replaceChildren();

  product.variants.forEach((variant, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = variant.size + "｜" + variant.color;
    variantSelect.append(option);
  });
};

const updateSelectedPrice = () => {
  const product = currentProduct();
  const variant = currentVariant();
  const price = variant.prices[selectedQuantityIndex];

  selectedCode.textContent = "品番 " + product.code;
  selectedName.textContent = product.name;
  selectedVariant.textContent = variant.size + " ／ " + variant.color;
  selectedQuantity.textContent = QUANTITIES[selectedQuantityIndex] + "枚の場合";
  selectedPrice.textContent = formatYen(price);
};

const renderPriceGrid = () => {
  const variant = currentVariant();
  priceGrid.replaceChildren();

  QUANTITIES.forEach((quantity, index) => {
    const price = variant.prices[index];
    const button = document.createElement("button");
    const quantityLabel = document.createElement("span");
    const priceLabel = document.createElement("strong");

    button.type = "button";
    button.className = "quantity-option";
    button.dataset.index = String(index);
    button.setAttribute("aria-pressed", index === selectedQuantityIndex ? "true" : "false");

    if (index === selectedQuantityIndex) button.classList.add("is-selected");
    if (price === null) button.disabled = true;

    quantityLabel.textContent = quantity + "枚";
    priceLabel.textContent = formatYen(price);
    button.append(quantityLabel, priceLabel);
    priceGrid.append(button);
  });

  if (variant.prices[selectedQuantityIndex] === null) {
    selectedQuantityIndex = variant.prices.findIndex((price) => price !== null);
    renderPriceGrid();
    return;
  }

  updateSelectedPrice();
};

const renderCatalog = () => {
  PRODUCTS.forEach((product) => {
    const item = document.createElement("div");
    const code = document.createElement("span");
    const name = document.createElement("span");
    const count = document.createElement("span");

    item.className = "catalog-item";
    code.className = "catalog-item-code";
    name.className = "catalog-item-name";
    count.className = "catalog-item-count";

    code.textContent = product.code;
    name.textContent = product.name;
    count.textContent = product.variants.length + "仕様";
    item.append(code, name, count);
    catalogList.append(item);
  });
};

productSelect.addEventListener("change", () => {
  variantSelect.value = "0";
  renderVariantOptions();
  renderPriceGrid();
});

variantSelect.addEventListener("change", renderPriceGrid);

priceGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".quantity-option");
  if (!button || button.disabled) return;
  selectedQuantityIndex = Number(button.dataset.index);
  renderPriceGrid();
});

document.querySelector("#printButton").addEventListener("click", () => window.print());

const dialog = document.querySelector("#imageDialog");
const dialogImage = document.querySelector("#dialogImage");
const dialogClose = document.querySelector("#dialogClose");
let previousFocus = null;

document.querySelectorAll(".gallery-item").forEach((button) => {
  button.addEventListener("click", () => {
    previousFocus = button;
    dialogImage.src = button.dataset.full;
    dialogImage.alt = button.dataset.alt;
    dialog.showModal();
    dialogClose.focus();
  });
});

const closeDialog = () => {
  if (dialog.open) dialog.close();
};

dialogClose.addEventListener("click", closeDialog);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});
dialog.addEventListener("close", () => {
  dialogImage.src = "";
  if (previousFocus) previousFocus.focus();
});

renderProductOptions();
productSelect.value = "0";
renderVariantOptions();
variantSelect.value = "0";
renderPriceGrid();
renderCatalog();
