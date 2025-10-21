// lib/schema.js
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  numeric,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Users table (keeps it simple — NextAuth will handle sessions)
 */
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(), // use UUIDs (strings)
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password_hash: text("password_hash"), // used only if you store credentials
  created_at: timestamp("created_at").defaultNow(),
});

/**
 * Courses table -- includes all fields you listed
 * Note: course id is varchar since Udemy ids can be non-integer strings.
 */
export const courses = pgTable("courses", {
  id: varchar("id", { length: 100 }).primaryKey(),
  title: text("title").notNull(),

  // pricing
  is_paid: boolean("is_paid").notNull().default(false),
  price: numeric("price", { precision: 10, scale: 2 }),

  // metadata
  headline: text("headline"),
  num_subscribers: integer("num_subscribers").default(0),
  avg_rating: numeric("avg_rating", { precision: 3, scale: 2 }).default(0), // e.g. 4.85
  num_reviews: integer("num_reviews").default(0),
  num_comments: integer("num_comments").default(0),

  // course structure
  num_lectures: integer("num_lectures").default(0),
  content_length_min: integer("content_length_min"),

  // timestamps
  published_time: timestamp("published_time"),
  last_update_date: timestamp("last_update_date"),

  // taxonomy / filtering
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  topic: varchar("topic", { length: 100 }),
  language: varchar("language", { length: 50 }),

  // links / instructor
  course_url: text("course_url"),
  instructor_name: varchar("instructor_name", { length: 200 }),
  instructor_url: text("instructor_url"),
});

/**
 * user_courses: many-to-many (which user subscribed to which course)
 * composite primary key prevents duplicates
 */
export const user_courses = pgTable(
  "user_courses",
  {
    user_id: varchar("user_id", { length: 36 }).notNull(),
    course_id: varchar("course_id", { length: 100 }).notNull(),
    subscribed_at: timestamp("subscribed_at").defaultNow(),
  },
  (t) => ({
    pk: primaryKey(t.user_id, t.course_id),
  })
);
