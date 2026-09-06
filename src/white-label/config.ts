import type { TenantConfig } from "./types";

export const DEFAULT_TENANT_SLUG = "sizzler-steak-house-and-co";

const sizzler: TenantConfig = {
  slug: DEFAULT_TENANT_SLUG,
  displayName: "Sizzler Steak House & Co.",
  shortName: "Sizzler",
  tagline: "Steak, served with character.",
  cuisineLabel: "Cairo steakhouse since 2014",
  currency: "EGP",
  theme: {
    accent: "#8f1d2c",
    accentDark: "#68111d",
    ink: "#191816",
    paper: "#f6f2eb",
  },
  menu: [
    {
      name: "Starters",
      eyebrow: "To begin",
      items: [
        { name: "Sizzler Beef Bites", description: "Seared beef tips, pepper glaze and crispy shallots.", price: 285 },
        { name: "Fire-Roasted Mushrooms", description: "Garlic butter, thyme and toasted sourdough.", price: 190, tags: ["Vegetarian"] },
        { name: "Classic Caesar", description: "Romaine, parmesan, herb croutons and house dressing.", price: 210 },
      ],
    },
    {
      name: "Signature Steaks",
      eyebrow: "From the grill",
      items: [
        { name: "Peppercorn Tenderloin", description: "Prime tenderloin, green peppercorn jus and potato gratin.", price: 780 },
        { name: "Charred Ribeye", description: "Marbled ribeye, roasted garlic and smoked sea salt.", price: 920 },
        { name: "New York Strip", description: "Grilled striploin, chimichurri and hand-cut fries.", price: 740 },
      ],
    },
    {
      name: "Mains",
      eyebrow: "Beyond steak",
      items: [
        { name: "Herb-Grilled Chicken", description: "Lemon herbs, seasonal vegetables and pan jus.", price: 390 },
        { name: "Atlantic Salmon", description: "Citrus glaze, wilted greens and crushed potatoes.", price: 540 },
        { name: "Truffle Mushroom Pasta", description: "Creamy wild mushrooms, parmesan and fresh herbs.", price: 345, tags: ["Vegetarian"] },
      ],
    },
    {
      name: "Sides",
      eyebrow: "For the table",
      items: [
        { name: "Truffle Fries", description: "Parmesan, parsley and truffle seasoning.", price: 150 },
        { name: "Creamed Spinach", description: "Nutmeg, cream and aged parmesan.", price: 135 },
        { name: "Charred Broccolini", description: "Chilli, lemon and toasted almonds.", price: 145, tags: ["Vegan"] },
      ],
    },
    {
      name: "Desserts & Drinks",
      eyebrow: "A sweet finish",
      items: [
        { name: "Molten Chocolate Cake", description: "Dark chocolate centre and vanilla ice cream.", price: 220 },
        { name: "Classic Cheesecake", description: "Vanilla bean, berry compote and biscuit crumb.", price: 195 },
        { name: "Sizzler Citrus Cooler", description: "Fresh citrus, mint and sparkling water.", price: 110 },
      ],
    },
  ],
};

export const tenantConfigs: Record<string, TenantConfig> = {
  [sizzler.slug]: sizzler,
};

export function getTenantConfig(slug: string) {
  return tenantConfigs[slug] ?? null;
}
