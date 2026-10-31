import { z } from "zod";

// Planning windows, not confirmed event dates. Keep both public copy and validation here.
export const seasons = [
  { id: "late-2026", label: "Late 2026 — dates to be announced" },
  { id: "2027", label: "2027 — dates to be announced" },
];
export const roles = {
  vendor: "Vendor application",
  artist: "Artist application",
  music: "DJ / music application",
  performance: "Live performance application",
  partner: "Partner inquiry",
  idea: "Share an idea",
};
export const fields = [
  {
    name: "contactName",
    label: "Contact person’s name",
    required: true,
    autocomplete: "name",
    max: 120,
  },
  {
    name: "organization",
    label: "Business / artist / organization name",
    required: true,
    max: 160,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    autocomplete: "email",
    max: 254,
  },
  {
    name: "phone",
    label: "Phone number (optional until onboarding)",
    type: "tel",
    autocomplete: "tel",
    max: 40,
  },
  {
    name: "link",
    label: "Website, Instagram, portfolio, mix or reel link",
    type: "url",
    required: true,
    max: 1000,
  },
  {
    name: "message",
    label: "What would you like to bring to Nightmarket?",
    type: "textarea",
    required: true,
    max: 3000,
  },
  {
    name: "categories",
    label: "What do you sell or offer? Choose all that apply.",
    type: "checks",
    roles: ["vendor"],
    required: true,
    options: [
      "Crafts",
      "Jewelry",
      "Clothing & accessories",
      "Bath & body / skincare",
      "Plants",
      "Food",
      "Baked / packaged goods",
      "Non-alcoholic drinks",
      "Alcoholic drinks",
      "Experiences / services",
      "Other",
    ],
  },
  {
    name: "prices",
    label: "Price range of items — choose all that apply",
    type: "checks",
    roles: ["vendor"],
    required: true,
    options: ["$0–10", "$10–25", "$25–50", "$50–100", "$100+"],
  },
  {
    name: "photos",
    label: "Product photos or previous setup link (optional)",
    type: "url",
    roles: ["vendor", "artist"],
    max: 1000,
  },
  {
    name: "space",
    label: "Space needed (table / booth dimensions / truck footprint)",
    roles: ["vendor", "artist"],
    required: true,
    max: 300,
  },
  {
    name: "equipment",
    label: "Equipment you’ll bring and anything you need from us",
    type: "textarea",
    roles: ["vendor", "artist", "music", "performance"],
    required: true,
    max: 1500,
  },
  {
    name: "power",
    label: "Power requirements (write “none” or list equipment)",
    roles: ["vendor", "artist", "music", "performance"],
    required: true,
    max: 600,
  },
  {
    name: "onsite",
    label:
      "What will you prepare or do onsite? Include cooking and water needs.",
    type: "textarea",
    regulated: true,
    required: true,
    max: 1500,
  },
  {
    name: "permits",
    label: "Relevant permit / insurance status",
    regulated: true,
    required: true,
    type: "select",
    options: [
      "Available",
      "In progress",
      "Not sure what is needed",
      "Not applicable — explain below",
    ],
  },
  {
    name: "permitNotes",
    label:
      "Permit / insurance notes (optional; documents requested after acceptance)",
    regulated: true,
    type: "textarea",
    max: 1000,
  },
  {
    name: "format",
    label: "Medium, genre or performance format",
    roles: ["artist", "music", "performance"],
    required: true,
    max: 300,
  },
  {
    name: "duration",
    label: "Set / performance duration",
    roles: ["music", "performance"],
    required: true,
    max: 100,
  },
  {
    name: "fee",
    label: "Requested fee / budget expectations (or “let’s discuss”)",
    roles: ["artist", "music", "performance", "partner"],
    required: true,
    max: 300,
  },
  {
    name: "contribution",
    label: "What can you contribute, and what support are you seeking?",
    roles: ["partner"],
    type: "textarea",
    required: true,
    max: 1500,
  },
  {
    name: "availability",
    label:
      "Availability or scheduling constraints (optional; dates and load-in times are unannounced)",
    type: "textarea",
    max: 1000,
  },
  {
    name: "access",
    label:
      "Access needs or load-in constraints (optional; no medical details needed)",
    type: "textarea",
    max: 1000,
  },
  {
    name: "interests",
    label: "Also interested in (optional)",
    type: "checks",
    options: ["Performing", "Creative collaboration", "Sponsoring"],
  },
  {
    name: "referral",
    label: "How did you hear about us? (optional)",
    max: 200,
  },
];
const regulatedCategories = [
  "Food",
  "Baked / packaged goods",
  "Non-alcoholic drinks",
  "Alcoholic drinks",
  "Experiences / services",
];
export function visibleField(field, data) {
  if (field.regulated)
    return (
      data.type === "vendor" &&
      (data.categories || []).some((x) => regulatedCategories.includes(x))
    );
  return !field.roles || field.roles.includes(data.type);
}
export function requiredField(field, data) {
  return (
    Boolean(field.required) &&
    !(data.type === "idea" && ["link", "organization"].includes(field.name))
  );
}
const shape = {
  requestId: z.uuid(),
  type: z.enum(Object.keys(roles)),
  season: z.enum(seasons.map((s) => s.id)),
  acknowledgment: z.literal(true),
  updates: z.boolean(),
  website: z.string().max(0),
};
for (const field of fields) {
  shape[field.name] =
    field.type === "checks"
      ? z.array(z.enum(field.options)).max(field.options.length).optional()
      : z
          .string()
          .trim()
          .max(field.max || 300)
          .optional();
}
export const applicationSchema = z
  .object(shape)
  .strict()
  .superRefine((data, ctx) => {
    for (const field of fields) {
      if (!visibleField(field, data)) continue;
      const value = data[field.name];
      const issue = (message) =>
        ctx.addIssue({ code: "custom", path: [field.name], message });
      if (requiredField(field, data) && !value?.length) {
        issue("Please complete this field.");
        continue;
      }
      if (!value) continue;
      if (field.type === "email" && !z.email().safeParse(value).success)
        issue("Enter a valid email address.");
      if (field.type === "url") {
        try {
          const url = new URL(value);
          if (
            !["https:", "http:"].includes(url.protocol) ||
            url.username ||
            url.password
          )
            throw Error();
        } catch {
          issue("Enter a full http:// or https:// link.");
        }
      }
      if (field.type === "select" && !field.options.includes(value))
        issue("Choose an option from the list.");
    }
  })
  .transform((data) => {
    const cleaned = { ...data, email: data.email.toLowerCase() };
    for (const field of fields)
      if (!visibleField(field, data)) delete cleaned[field.name];
    return cleaned;
  });
