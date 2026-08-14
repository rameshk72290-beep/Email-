// Mock data for LootBar Free Fire Top-Up clone
// Admin edits are persisted in localStorage under this key
const STORAGE_KEY = "lootbar_ff_packages_v1";
const SETTINGS_KEY = "lootbar_ff_settings_v1";

export const defaultPackages = [
  {
    id: "p1",
    name: "EVO VAULT - one of the EVO Guns",
    image: "https://img.lootbar.com/file/6a704cea477ed821a12c6eafKcFumR3d03?fop=imageView/2/w/340/h/340",
    price: 11.25,
    originalPrice: 12.5,
    tag: "Hot",
  },
  {
    id: "p2",
    name: "BOOYAH PASS 50 Level Package",
    image: "https://img.lootbar.com/file/6846ac3a4103a2e741d4df29vLW0rcHG03?fop=imageView/2/w/340/h/340",
    price: 6.17,
    originalPrice: 6.85,
    tag: "",
  },
  {
    id: "p3",
    name: "100+10 Diamonds",
    image: "https://img.lootbar.com/file/66dad2385bcd5dcccf249149UCmGWzPC03?fop=imageView/2/w/340/h/340",
    price: 0.82,
    originalPrice: 0.91,
    tag: "",
  },
  {
    id: "p4",
    name: "310+31 Diamonds",
    image: "https://img.lootbar.com/file/66dad319243d93be37a0c68bsOGJhFpw03?fop=imageView/2/w/340/h/340",
    price: 2.3,
    originalPrice: 2.55,
    tag: "",
  },
  {
    id: "p5",
    name: "520+52 Diamonds",
    image: "https://img.lootbar.com/file/66dad38a511befc0cea111c95pbxbPTi03?fop=imageView/2/w/340/h/340",
    price: 3.87,
    originalPrice: 4.3,
    tag: "Popular",
  },
  {
    id: "p6",
    name: "1060+106 Diamonds",
    image: "https://img.lootbar.com/file/66dad3cce4fffe79f93965924i0X7hAw03?fop=imageView/2/w/340/h/340",
    price: 7.38,
    originalPrice: 8.2,
    tag: "",
  },
  {
    id: "p7",
    name: "2180+218 Diamonds",
    image: "https://img.lootbar.com/file/66dad40d6d022e25d4932829egCbaMN703?fop=imageView/2/w/340/h/340",
    price: 14.67,
    originalPrice: 16.3,
    tag: "",
  },
  {
    id: "p8",
    name: "5600+560 Diamonds",
    image: "https://img.lootbar.com/file/66dad44b8ce4cfd72a97ee68tMW0piBg03?fop=imageView/2/w/340/h/340",
    price: 35.1,
    originalPrice: 39.0,
    tag: "Best Value",
  },
];

export const defaultSettings = {
  productImage: "https://img.lootbar.com/file/6a3e1c094f9de0e50fdbb275k9gzzrFk03",
  title: "Free Fire Top Up",
  rating: "5.0",
  ratingCount: "40,068",
  soldCount: "100k+ Sold",
};

export const serverTabs = [
  "Malaysia/Singapore",
  "Brazil",
  "USA & Latam",
  "Indonesia",
  "EU & RU & Bangladesh",
  "Middle East",
];

export const reviews = [
  {
    id: "U1067483594",
    date: "Mar 19, 2025",
    purchased: "625 Diamond",
    text: "Very fast delivery, got my diamonds within minutes. Highly recommend!",
    helpful: 4097,
    rating: 5,
  },
  {
    id: "U1068297336",
    date: "Mar 18, 2025",
    purchased: "520+52 Diamonds",
    text: "Smooth process and great price. Will buy again for sure.",
    helpful: 3007,
    rating: 5,
  },
  {
    id: "U1068413014",
    date: "Mar 19, 2025",
    purchased: "625 Diamond",
    text: "It is a very beautiful app for business. Trustworthy service.",
    helpful: 2535,
    rating: 5,
  },
  {
    id: "U1069120043",
    date: "Mar 17, 2025",
    purchased: "1060+106 Diamonds",
    text: "Cheapest price I could find online. Delivery was instant.",
    helpful: 1980,
    rating: 5,
  },
];

export const faqs = [
  {
    q: "Can you buy Free Fire Diamonds?",
    a: "Absolutely! You can buy Free Fire Diamonds on LootBar and enjoy the best price, fastest and safest delivery no matter where you are living in.",
  },
  {
    q: "How to get Free Fire Diamonds?",
    a: "By choosing LootBar, you can get cheap Free Fire Diamonds and enjoy one of the most affordable prices and the best services.",
  },
  {
    q: "How does the delivery of Free Fire Diamonds work?",
    a: "The delivery of Free Fire Diamonds on LootBar is conducted through Comfort Trade, which is a fast and convenient method. During this process, you can relax and wait for the order to be completed at your own pace.",
  },
  {
    q: "Is it safe to buy Free Fire Diamonds?",
    a: "When you buy FF Diamond on LootBar, our reliable delivery method ensures the utmost safety for your in-game assets. You can trust us completely in this matter.",
  },
];

export const infoContent = [
  {
    title: "What is Free Fire?",
    body: "Free Fire is one of the most popular battle royale games on mobile. It pits players against each other on a deserted island to play 10-minute matches against 49 other players with the single objective of surviving. Players are allowed to come up with a strategy of where to land, look for weapons, and keep themselves inside a safe zone.",
  },
  {
    title: "What are Free Fire Diamonds?",
    body: "These are the premium in-game currency for Free Fire. You can acquire these Diamonds by paying real money and then spend them on a wide variety of items that will greatly improve your gameplay, such as character skins, weapon designs, pets, and cosmetic bundles.",
  },
  {
    title: "Why should you top up Free Fire Diamonds?",
    body: "Through a reliable Free Fire top up, you can buy Diamonds to style your character with rare skins and weapons, acquire pets with unique abilities, and gain access to bundles filled with rewards \u2014 giving you the upper hand over free players.",
  },
];

// ---- localStorage helpers (mock persistence) ----
export function loadPackages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return defaultPackages;
}

export function savePackages(pkgs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pkgs));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {}
  return defaultSettings;
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
