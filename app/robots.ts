import type { MetadataRoute } from "next";

/**
 * The admin area and the API are behind auth anyway, but keeping crawlers out
 * of them — and out of the survey, which is a private research flow rather than
 * a page anyone should land on from search — leaves only the public front page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/survey"],
    },
  };
}
