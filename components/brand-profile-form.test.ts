import { describe, it, expect } from "bun:test";
import type { BrandProfileFormData } from "@/types/brand-profile";

describe("BrandProfileFormData validation", () => {
  it("accepts valid complete form data", () => {
    const data: BrandProfileFormData = {
      niche: "Fitness",
      brand_voice: "I talk like a coach",
      values: ["Authenticity", "Hustle"],
      target_audience: "25-35 year old entrepreneurs",
      content_style: "Motivational & Raw",
    };

    expect(data.niche).toBe("Fitness");
    expect(data.values).toHaveLength(2);
    expect(data.brand_voice.length).toBeGreaterThan(0);
    expect(data.target_audience.length).toBeGreaterThan(0);
  });

  it("allows empty initial state", () => {
    const data: BrandProfileFormData = {
      niche: "",
      brand_voice: "",
      values: [],
      target_audience: "",
      content_style: "",
    };

    expect(data.niche).toBe("");
    expect(data.values).toHaveLength(0);
  });

  it("allows custom niche values", () => {
    const data: BrandProfileFormData = {
      niche: "Underwater Basket Weaving",
      brand_voice: "Calm and instructional",
      values: ["Creativity"],
      target_audience: "Hobbyists aged 30-50",
      content_style: "Educational & Calm",
    };

    expect(data.niche).toBe("Underwater Basket Weaving");
  });

  it("allows multiple custom values", () => {
    const data: BrandProfileFormData = {
      niche: "Tech",
      brand_voice: "Direct and technical",
      values: ["Authenticity", "CustomValue1", "CustomValue2"],
      target_audience: "Software developers",
      content_style: "Professional & Direct",
    };

    expect(data.values).toHaveLength(3);
    expect(data.values).toContain("CustomValue1");
  });
});
