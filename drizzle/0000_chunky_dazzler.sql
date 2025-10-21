CREATE TABLE "courses" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"price" numeric(10, 2),
	"headline" text,
	"num_subscribers" integer DEFAULT 0,
	"avg_rating" numeric(3, 2) DEFAULT 0,
	"num_reviews" integer DEFAULT 0,
	"num_comments" integer DEFAULT 0,
	"num_lectures" integer DEFAULT 0,
	"content_length_min" integer,
	"published_time" timestamp,
	"last_update_date" timestamp,
	"category" varchar(100),
	"subcategory" varchar(100),
	"topic" varchar(100),
	"language" varchar(50),
	"course_url" text,
	"instructor_name" varchar(200),
	"instructor_url" text
);
--> statement-breakpoint
CREATE TABLE "user_courses" (
	"user_id" varchar(36) NOT NULL,
	"course_id" varchar(100) NOT NULL,
	"subscribed_at" timestamp DEFAULT now(),
	CONSTRAINT "user_courses_user_id_course_id_pk" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(320) NOT NULL,
	"password_hash" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
