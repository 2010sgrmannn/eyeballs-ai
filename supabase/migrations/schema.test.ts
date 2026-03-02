import { describe, it, expect, beforeAll } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Database schema migration", () => {
  let sql: string;

  beforeAll(() => {
    const migrationPath = join(
      import.meta.dir,
      "20260302000001_create_schema.sql"
    );
    sql = readFileSync(migrationPath, "utf-8");
  });

  it("migration file is readable and non-empty", () => {
    expect(sql).toBeDefined();
    expect(sql.length).toBeGreaterThan(0);
  });

  // -- Happy path: all required tables exist --
  describe("table definitions", () => {
    const expectedTables = [
      "brand_profiles",
      "creators",
      "content",
      "content_tags",
      "niches",
      "scripts",
    ];

    for (const table of expectedTables) {
      it(`creates table "${table}"`, () => {
        const regex = new RegExp(
          `CREATE TABLE ${table}\\s*\\(`,
          "i"
        );
        expect(sql).toMatch(regex);
      });
    }
  });

  // -- RLS is enabled on every table --
  describe("row level security", () => {
    const expectedTables = [
      "brand_profiles",
      "creators",
      "content",
      "content_tags",
      "niches",
      "scripts",
    ];

    for (const table of expectedTables) {
      it(`enables RLS on "${table}"`, () => {
        const regex = new RegExp(
          `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`,
          "i"
        );
        expect(sql).toMatch(regex);
      });
    }
  });

  // -- RLS policies exist for all CRUD operations --
  describe("RLS policies", () => {
    const tablesWithDirectPolicies = [
      "brand_profiles",
      "creators",
      "content",
      "niches",
      "scripts",
    ];

    for (const table of tablesWithDirectPolicies) {
      for (const op of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        it(`has ${op} policy on "${table}"`, () => {
          const regex = new RegExp(
            `CREATE POLICY.*ON ${table} FOR ${op}`,
            "is"
          );
          expect(sql).toMatch(regex);
        });
      }
    }

    // content_tags uses a join-based policy through content
    for (const op of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
      it(`has ${op} policy on "content_tags" (join-based)`, () => {
        const regex = new RegExp(
          `CREATE POLICY.*ON content_tags FOR ${op}`,
          "is"
        );
        expect(sql).toMatch(regex);
      });
    }
  });

  // -- Foreign key constraints --
  describe("foreign keys", () => {
    it("brand_profiles references auth.users", () => {
      expect(sql).toMatch(
        /brand_profiles[\s\S]*?REFERENCES auth\.users\(id\) ON DELETE CASCADE/i
      );
    });

    it("creators references auth.users", () => {
      expect(sql).toMatch(
        /creators[\s\S]*?REFERENCES auth\.users\(id\)/i
      );
    });

    it("content references auth.users", () => {
      expect(sql).toMatch(
        /content[\s\S]*?user_id uuid NOT NULL REFERENCES auth\.users\(id\)/i
      );
    });

    it("content references creators", () => {
      expect(sql).toMatch(
        /content[\s\S]*?REFERENCES creators\(id\)/i
      );
    });

    it("content_tags references content with ON DELETE CASCADE", () => {
      expect(sql).toMatch(
        /content_tags[\s\S]*?REFERENCES content\(id\) ON DELETE CASCADE/i
      );
    });

    it("scripts references niches", () => {
      expect(sql).toMatch(
        /scripts[\s\S]*?REFERENCES niches\(id\)/i
      );
    });
  });

  // -- Unique constraints --
  describe("unique constraints", () => {
    it("creators has UNIQUE(user_id, platform, handle)", () => {
      expect(sql).toMatch(
        /UNIQUE\s*\(\s*user_id\s*,\s*platform\s*,\s*handle\s*\)/i
      );
    });

    it("content has UNIQUE(creator_id, external_id)", () => {
      expect(sql).toMatch(
        /UNIQUE\s*\(\s*creator_id\s*,\s*external_id\s*\)/i
      );
    });

    it("content_tags has UNIQUE(content_id, tag)", () => {
      expect(sql).toMatch(
        /UNIQUE\s*\(\s*content_id\s*,\s*tag\s*\)/i
      );
    });
  });

  // -- Check constraints --
  describe("check constraints", () => {
    it("creators platform has CHECK constraint", () => {
      expect(sql).toMatch(
        /CHECK\s*\(\s*platform\s+IN\s*\(\s*'instagram'\s*,\s*'tiktok'\s*,\s*'linkedin'\s*,\s*'twitter'\s*\)\s*\)/i
      );
    });

    it("content_tags category has CHECK constraint", () => {
      expect(sql).toMatch(
        /CHECK\s*\(\s*category\s+IN\s*\(\s*'niche'\s*,\s*'topic'\s*,\s*'style'\s*,\s*'hook_type'\s*,\s*'emotion'\s*\)\s*\)/i
      );
    });
  });

  // -- Column existence checks --
  describe("column definitions", () => {
    it("brand_profiles has values as text array", () => {
      expect(sql).toMatch(/"values"\s+text\[\]/i);
    });

    it("scripts has source_content_ids as uuid array", () => {
      expect(sql).toMatch(/source_content_ids\s+uuid\[\]/i);
    });

    it("content has engagement_ratio as numeric", () => {
      expect(sql).toMatch(/engagement_ratio\s+numeric/i);
    });

    it("content has virality_score as numeric", () => {
      expect(sql).toMatch(/virality_score\s+numeric/i);
    });
  });

  // -- Negative: no invalid SQL patterns --
  describe("negative checks", () => {
    it("does not contain DROP TABLE statements", () => {
      expect(sql).not.toMatch(/DROP TABLE/i);
    });

    it("does not contain TRUNCATE statements", () => {
      expect(sql).not.toMatch(/TRUNCATE/i);
    });

    it("does not use IF NOT EXISTS (migrations should be deterministic)", () => {
      expect(sql).not.toMatch(/IF NOT EXISTS/i);
    });
  });

  // -- Indexes --
  describe("indexes", () => {
    const expectedIndexes = [
      "idx_brand_profiles_user_id",
      "idx_creators_user_id",
      "idx_content_user_id",
      "idx_content_creator_id",
      "idx_content_tags_content_id",
      "idx_niches_user_id",
      "idx_scripts_user_id",
      "idx_scripts_niche_id",
    ];

    for (const idx of expectedIndexes) {
      it(`creates index "${idx}"`, () => {
        expect(sql).toContain(idx);
      });
    }
  });
});
