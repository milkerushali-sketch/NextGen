export const productImageFallback = (name = "NovaCart product") => {
  const label = String(name).slice(0, 28).trim() || "NovaCart";
  const safeLabel = label.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#6d28d9"/><stop offset="1" stop-color="#1e1b4b"/></linearGradient></defs><rect width="900" height="700" fill="url(#g)"/><circle cx="450" cy="290" r="130" fill="white" opacity=".16"/><text x="450" y="475" fill="white" font-family="Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle">${safeLabel}</text><text x="450" y="525" fill="#ddd6fe" font-family="Arial,sans-serif" font-size="22" text-anchor="middle">NovaCart</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const sanitizeProductImageUrl = (url, fallbackName = "NovaCart product") => {
  if (typeof url !== "string") return productImageFallback(fallbackName);

  const trimmed = url.trim();
  if (!trimmed) return productImageFallback(fallbackName);
  if (trimmed.startsWith("data:image/")) return trimmed;

  try {
    const normalized = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
    const parsed = new URL(normalized);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return productImageFallback(fallbackName);
    }

    if (parsed.hostname.includes("assets.myntassets.com")) {
      parsed.protocol = "https:";
    }

    return parsed.toString();
  } catch {
    return productImageFallback(fallbackName);
  }
};

export const handleProductImageError = (event) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === "true") return;
  image.dataset.fallbackApplied = "true";
  image.src = productImageFallback(image.alt || image.dataset.name || "NovaCart product");
};
