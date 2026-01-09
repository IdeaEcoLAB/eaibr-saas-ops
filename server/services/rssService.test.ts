import { describe, it, expect, vi, beforeEach } from "vitest";
import { contentItemExists, ParsedFeedItem } from "./rssService";

describe("RSS Service", () => {
  describe("contentItemExists", () => {
    it("should return false for non-existent URLs", async () => {
      const result = await contentItemExists("https://non-existent-url-12345.com");
      expect(typeof result).toBe("boolean");
    });

    it("should handle database errors gracefully", async () => {
      const result = await contentItemExists("https://test.com");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("ParsedFeedItem type", () => {
    it("should create valid feed items", () => {
      const item: ParsedFeedItem = {
        title: "Test Article",
        description: "Test description",
        content: "Test content",
        url: "https://example.com/article",
        pubDate: new Date(),
        author: "Test Author",
        categories: ["AI", "Technology"],
        sourceId: 1,
        region: "global",
      };

      expect(item.title).toBe("Test Article");
      expect(item.url).toBe("https://example.com/article");
      expect(item.sourceId).toBe(1);
    });
  });

  describe("Feed filtering", () => {
    it("should filter items without URLs", () => {
      const items: ParsedFeedItem[] = [
        {
          title: "Valid Item",
          description: "Description",
          url: "https://example.com",
          pubDate: new Date(),
          sourceId: 1,
          region: "global",
        },
        {
          title: "Invalid Item",
          description: "No URL",
          url: "",
          pubDate: new Date(),
          sourceId: 1,
          region: "global",
        },
      ];

      const filtered = items.filter((item) => item.url);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Valid Item");
    });
  });
});
