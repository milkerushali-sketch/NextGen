import test from "node:test";
import assert from "node:assert/strict";
import { productImageFallback, sanitizeProductImageUrl } from "./productImage.js";

test("sanitizeProductImageUrl keeps valid https images", () => {
  const url = "https://images.unsplash.com/photo-1234?auto=format&fit=crop&w=900&q=80";
  assert.equal(sanitizeProductImageUrl(url, "Sample"), url);
});

test("sanitizeProductImageUrl converts insecure http asset URLs to https", () => {
  const url = "http://assets.myntassets.com/assets/images/sample.jpg";
  assert.equal(
    sanitizeProductImageUrl(url, "Sample"),
    "https://assets.myntassets.com/assets/images/sample.jpg",
  );
});

test("sanitizeProductImageUrl rejects unsafe or malformed inputs", () => {
  assert.match(sanitizeProductImageUrl("javascript:alert(1)", "Test"), /^data:image\/svg\+xml/);
  assert.match(sanitizeProductImageUrl("", "Test"), /^data:image\/svg\+xml/);
});

test("productImageFallback returns a placeholder svg for missing names", () => {
  const fallback = productImageFallback("");
  assert.match(fallback, /^data:image\/svg\+xml/);
});
