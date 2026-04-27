// Catalog of avatar items. Free items (price=0) are owned by everyone by default.
// Paid items must be purchased; ownership is tracked in the `inventory` table.

export type ShopItem =
  | { category: "hat"; key: string; price: number; label: string }
  | { category: "face"; key: string; price: number; label: string }
  | { category: "shirt"; key: string; price: number; label: string; color: string }
  | { category: "pants"; key: string; price: number; label: string; color: string };

export const HAT_CATALOG: { key: string; price: number; label: string }[] = [
  { key: "none", price: 0, label: "None" },
  { key: "cap", price: 0, label: "Cap" },
  { key: "beanie", price: 30, label: "Beanie" },
  { key: "horns", price: 50, label: "Horns" },
  { key: "headphones", price: 90, label: "Headphones" },
  { key: "tophat", price: 120, label: "Top Hat" },
  { key: "cowboy", price: 160, label: "Cowboy" },
  { key: "wizard", price: 200, label: "Wizard Hat" },
  { key: "halo", price: 250, label: "Halo" },
  { key: "antlers", price: 300, label: "Antlers" },
  { key: "crown", price: 500, label: "Crown" },
  { key: "fire", price: 800, label: "Fire Crown" },
];

export const FACE_CATALOG: { key: string; price: number; label: string }[] = [
  { key: "smile", price: 0, label: "Smile" },
  { key: "happy", price: 0, label: "Happy" },
  { key: "wink", price: 30, label: "Wink" },
  { key: "cool", price: 75, label: "Cool" },
  { key: "kawaii", price: 90, label: "Kawaii" },
  { key: "angry", price: 150, label: "Angry" },
  { key: "evil", price: 220, label: "Evil" },
  { key: "robot", price: 300, label: "Robot" },
];

// Shirt/pants color packs — basic free, premium colors unlock
export const SHIRT_CATALOG: { color: string; price: number; label: string }[] = [
  { color: "#dc2626", price: 0, label: "Red" },
  { color: "#2563eb", price: 0, label: "Blue" },
  { color: "#16a34a", price: 0, label: "Green" },
  { color: "#111827", price: 0, label: "Black" },
  { color: "#9333ea", price: 40, label: "Purple" },
  { color: "#f59e0b", price: 40, label: "Amber" },
  { color: "#ec4899", price: 80, label: "Hot Pink" },
  { color: "#0ea5e9", price: 80, label: "Cyan" },
  { color: "#14b8a6", price: 120, label: "Teal" },
  { color: "#fafafa", price: 120, label: "White" },
  { color: "#fde047", price: 180, label: "Sunshine" },
  { color: "#7c3aed", price: 250, label: "Royal Violet" },
];

export const PANTS_CATALOG: { color: string; price: number; label: string }[] = [
  { color: "#1f2937", price: 0, label: "Slate" },
  { color: "#1e3a8a", price: 0, label: "Navy" },
  { color: "#374151", price: 0, label: "Gray" },
  { color: "#0f172a", price: 0, label: "Midnight" },
  { color: "#3f6212", price: 30, label: "Olive" },
  { color: "#78350f", price: 30, label: "Brown" },
  { color: "#581c87", price: 60, label: "Royal" },
  { color: "#7c2d12", price: 60, label: "Rust" },
  { color: "#b91c1c", price: 110, label: "Crimson" },
  { color: "#0e7490", price: 110, label: "Ocean" },
  { color: "#a16207", price: 180, label: "Khaki" },
  { color: "#be185d", price: 220, label: "Magenta" },
];

export const HAIR_CATALOG: { key: string; price: number; label: string }[] = [
  { key: "none", price: 0, label: "Bald" },
  { key: "buzz", price: 0, label: "Buzz Cut" },
  { key: "messy", price: 40, label: "Messy" },
  { key: "side", price: 60, label: "Side Part" },
  { key: "ponytail", price: 80, label: "Ponytail" },
  { key: "pigtails", price: 110, label: "Pigtails" },
  { key: "bun", price: 120, label: "Top Bun" },
  { key: "spikes", price: 160, label: "Spikes" },
  { key: "mohawk", price: 200, label: "Mohawk" },
  { key: "long", price: 260, label: "Long Hair" },
  { key: "afro", price: 300, label: "Afro" },
  { key: "fire", price: 700, label: "Fire Hair" },
];

export const SHOES_CATALOG: { key: string; price: number; label: string }[] = [
  { key: "sneakers", price: 0, label: "Sneakers" },
  { key: "sandals", price: 0, label: "Sandals" },
  { key: "crocs", price: 40, label: "Crocs" },
  { key: "boots", price: 60, label: "Boots" },
  { key: "heels", price: 90, label: "Heels" },
  { key: "cleats", price: 130, label: "Cleats" },
  { key: "skates", price: 180, label: "Skates" },
  { key: "platforms", price: 240, label: "Platforms" },
  { key: "neonkicks", price: 320, label: "Neon Kicks" },
  { key: "rocketboots", price: 450, label: "Rocket Boots" },
  { key: "goldenkicks", price: 750, label: "Golden Kicks" },
];

export const JACKET_CATALOG: { key: string; price: number; label: string }[] = [
  { key: "none", price: 0, label: "None" },
  { key: "vest", price: 50, label: "Vest" },
  { key: "hoodie", price: 75, label: "Hoodie" },
  { key: "denim", price: 120, label: "Denim Jacket" },
  { key: "varsity", price: 150, label: "Varsity" },
  { key: "puffer", price: 220, label: "Puffer" },
  { key: "trench", price: 280, label: "Trench Coat" },
  { key: "leather", price: 350, label: "Leather" },
  { key: "armor", price: 480, label: "Armor" },
  { key: "cape", price: 600, label: "Hero Cape" },
  { key: "wings", price: 1200, label: "Angel Wings" },
];

// item_id format used in DB inventory
export const itemId = (category: string, key: string) => `${category}:${key}`;
