import Settings from "../Modules/Settings/SettingsMd.js";

const KEY = "main";
const TTL_MS = 30_000;

let cache = null;
let cachedAt = 0;

const num = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const buildDefaults = () => ({
  shipping: {
    cost: num(process.env.SHIPPING_COST, 0),
    freeThreshold: num(process.env.FREE_SHIPPING_THRESHOLD, 0),
  },
  inventory: { lowStockThreshold: num(process.env.LOW_STOCK_THRESHOLD, 5) },
  store: {
    name: "پت شاپ شادمان",
    manager: "امیرحسین شادمان",
    phone: "+989331984244",
    address: "بین پیامبر اعظم ۲۳ و ۲۵",
  },
});

export const getSettings = async () => {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;

  let doc;
  try {
    doc = await Settings.findOneAndUpdate(
      { key: KEY },
      { $setOnInsert: buildDefaults() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
  } catch (err) {
    if (err.code !== 11000) throw err;
    doc = await Settings.findOne({ key: KEY }).lean();
  }

  cache = doc;
  cachedAt = Date.now();
  return doc;
};

export const invalidateSettings = () => {
  cache = null;
};

export const getLowStockThreshold = async () =>
  (await getSettings()).inventory.lowStockThreshold;
