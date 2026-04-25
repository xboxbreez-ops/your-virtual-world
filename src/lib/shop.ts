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
  { key: "horns", price: 50, label: "Horns" },
  { key: "tophat", price: 120, label: "Top Hat" },
  { key: "halo", price: 250, label: "Halo" },
  { key: "crown", price: 500, label: "Crown" },
];

export const FACE_CATALOG: { key: string; price: number; label: string }[] = [
  { key: "smile", price: 0, label: "Smile" },
  { key: "happy", price: 0, label: "Happy" },
  { key: "wink", price: 30, label: "Wink" },
  { key: "cool", price: 75, label: "Cool" },
  { key: "angry", price: 150, label: "Angry" },
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
];

// item_id format used in DB inventory
export const itemId = (category: string, key: string) => `${category}:${key}`;
