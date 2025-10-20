/** @type { import("drizzle-kit").Config } */
export default {
  schema: "./lib/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: "ep-aged-field-a1y85qmf-pooler.ap-southeast-1.aws.neon.tech",
    port: 5432,              // Should be a number, not a string
    user: "neondb_owner",
    password: "npg_nh1zSmJ4LVDH",
    database: "neondb",
    ssl: true,               // Should be boolean true, not string "true"
  },
};