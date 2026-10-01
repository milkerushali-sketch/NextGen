export const productImageFallback = (name = "NovaCart product") => {
  const label = String(name).slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#6d28d9"/><stop offset="1" stop-color="#1e1b4b"/></linearGradient></defs><rect width="900" height="700" fill="url(#g)"/><circle cx="450" cy="290" r="130" fill="white" opacity=".16"/><text x="450" y="475" fill="white" font-family="Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle">${label.replace(/[<>&"]/g, "")}</text><text x="450" y="525" fill="#ddd6fe" font-family="Arial,sans-serif" font-size="22" text-anchor="middle">NovaCart</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const handleProductImageError = (event) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = "true";
  image.src = productImageFallback(image.alt);
};
