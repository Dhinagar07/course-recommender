from flask import Flask, request, jsonify
import os
import numpy as np
import pandas as pd
import joblib
import faiss
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.preprocessing import MinMaxScaler

DATABASE_URL = 'postgresql://neondb_owner:npg_nh1zSmJ4LVDH@ep-aged-field-a1y85qmf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
SAVE_DIR = "cb_model_large"

index = faiss.read_index(os.path.join(SAVE_DIR, "faiss_index.ip"))
meta = joblib.load(os.path.join(SAVE_DIR, "reco_meta.pkl"))
course_meta = meta["meta"].reset_index(drop=True)
course_meta["id"] = course_meta["id"].astype(float)
course_meta["id"] = course_meta["id"].astype(str).apply(lambda s: s if s.endswith(".0") else s + ".0")
course_meta = course_meta.reset_index(drop=True)

MODEL_NAME = meta["model_name"]
NUM_COLS = meta["num_cols"]
scaler: MinMaxScaler = meta["scaler"]
model = SentenceTransformer(MODEL_NAME)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def get_user_subscribed_courses(user_uuid):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT course_id, subscribed_at FROM user_courses WHERE user_id = %s;", (user_uuid,))
                rows = cur.fetchall()
        courses = []
        for row in rows:
            course_id = row["course_id"]
            if course_id is None:
                continue
            cid = str(course_id).strip()
            cid = cid if cid.endswith(".0") else cid + ".0"
            sub_at = row["subscribed_at"]
            if isinstance(sub_at, str):
                sub_at = datetime.fromisoformat(sub_at)
            if sub_at.tzinfo is None:
                sub_at = sub_at.replace(tzinfo=timezone.utc)
            courses.append({"course_id": cid, "subscribed_at": sub_at})
        return courses
    except Exception as e:
        print("DB error:", e)
        return []

def get_random_courses(limit=30):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT * FROM courses ORDER BY RANDOM() LIMIT {limit};")
                rows = cur.fetchall()
        df = pd.DataFrame(rows)
        df["id"] = df["id"].astype(str).apply(lambda s: s if s.endswith(".0") else s + ".0")
        return df
    except Exception as e:
        print("Error fetching random courses:", e)
        return pd.DataFrame()

def get_course_vector(course_id):
    if course_id is None:
        return None
    cid = str(course_id).strip()
    cid = cid if cid.endswith(".0") else cid + ".0"
    idx_list = course_meta.index[course_meta["id"] == cid].tolist()
    if not idx_list:
        return None
    idx = idx_list[0]
    try:
        return index.reconstruct(idx)
    except Exception as e:
        print(f"[WARN] Failed to reconstruct vector for idx {idx}: {e}")
        return None

def get_course_data_by_ids(course_ids):
    if not course_ids:
        return pd.DataFrame()
    placeholders = ','.join(['%s'] * len(course_ids))
    query = f"SELECT * FROM courses WHERE id IN ({placeholders});"
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, course_ids)
                rows = cur.fetchall()
        df = pd.DataFrame(rows)
        df["id"] = df["id"].astype(str).apply(lambda s: s if s.endswith(".0") else s + ".0")
        return df
    except Exception as e:
        print("Error fetching course data:", e)
        return pd.DataFrame()

def recommend_for_user(user_uuid, top_k=1000, per_course_top=100):
    subscribed_courses = get_user_subscribed_courses(user_uuid)
    if not subscribed_courses:
        print(f"[INFO] User {user_uuid} has no subscriptions. Returning popular/random courses.")
        random_df = get_random_courses(limit=30)
        if random_df.empty:
            return pd.DataFrame(), "No subscribed courses and failed to fetch random courses."
        random_df["source"] = "random"
        return random_df, None

    now = datetime.now(timezone.utc)
    all_recs = []

    for course in subscribed_courses:
        raw_cid = course.get("course_id")
        if raw_cid is None:
            continue
        normalized_cid = str(raw_cid).strip()
        normalized_cid = normalized_cid if normalized_cid.endswith(".0") else normalized_cid + ".0"

        vec = get_course_vector(normalized_cid)
        if vec is None:
            continue
        vec = vec.astype("float32").reshape(1, -1)
        vec = np.ascontiguousarray(vec)
        faiss.normalize_L2(vec)

        D, I = index.search(vec, per_course_top)
        days_since = (now - course["subscribed_at"]).total_seconds() / 86400
        weight = 1 / (1 + days_since)

        for idx, sim in zip(I[0], D[0]):
            if idx is None:
                continue
            if not isinstance(idx, (int, np.integer)):
                try:
                    idx = int(idx)
                except Exception:
                    continue
            if idx < 0 or idx >= len(course_meta):
                continue
            all_recs.append({"faiss_idx": int(idx), "similarity": float(sim) * float(weight)})

    if not all_recs:
        return pd.DataFrame(), "No valid course vectors found."

    df = pd.DataFrame(all_recs)
    df = df.groupby("faiss_idx", as_index=False)["similarity"].max()
    df = df.sort_values("similarity", ascending=False)

    def idx_to_course_id(idx):
        if 0 <= idx < len(course_meta):
            cid = str(course_meta.iloc[idx]["id"])
            return cid if cid.endswith(".0") else cid + ".0"
        return None

    df["course_id"] = df["faiss_idx"].apply(idx_to_course_id)
    df = df.dropna(subset=["course_id"])

    subscribed_ids = []
    for c in subscribed_courses:
        cid = c.get("course_id")
        if cid is None:
            continue
        s = str(cid).strip()
        s = s if s.endswith(".0") else s + ".0"
        subscribed_ids.append(s)

    df = df[~df["course_id"].isin(subscribed_ids)]
    df = df.head(top_k).reset_index(drop=True)

    course_data_df = get_course_data_by_ids(df["course_id"].tolist())
    merged = pd.merge(df[["course_id", "similarity"]], course_data_df, left_on="course_id", right_on="id", how="left")
    merged["source"] = "recommendation"
    for col in ["title", "description", "instructor"]:
        if col not in merged.columns:
            merged[col] = None
    return merged.reset_index(drop=True), None

def recommend_for_search(term, top_k=500):
    if not term:
        return pd.DataFrame(), "Missing search term."
    try:
        text_emb = model.encode([term], convert_to_numpy=True, normalize_embeddings=False).astype("float32")
        dummy_num = np.zeros((1, len(NUM_COLS)), dtype="float32")
        query_vec = np.concatenate([text_emb, dummy_num], axis=1)
        faiss.normalize_L2(query_vec)
        D, I = index.search(query_vec, top_k)
        recs = [{"faiss_idx": int(i), "similarity": float(s)} for i, s in zip(I[0], D[0])]
        df = pd.DataFrame(recs)
        df["course_id"] = df["faiss_idx"].apply(lambda x: str(course_meta.iloc[x]["id"]))
        df["course_id"] = df["course_id"].apply(lambda s: s if s.endswith(".0") else s + ".0")
        course_data_df = get_course_data_by_ids(df["course_id"].tolist())
        merged = pd.merge(df[["course_id", "similarity"]], course_data_df, left_on="course_id", right_on="id", how="left")
        merged["source"] = "search"
        for col in ["title", "description", "instructor"]:
            if col not in merged.columns:
                merged[col] = None
        return merged.reset_index(drop=True), None
    except Exception as e:
        print("Search error:", e)
        return pd.DataFrame(), str(e)

@app.route("/recommend", methods=["GET", "OPTIONS"])
def recommend():
    if request.method == "OPTIONS":
        return jsonify({"message": "CORS preflight OK"}), 200
    user_uuid = request.args.get("user_id")
    if not user_uuid:
        return jsonify({"error": "Missing 'user_id' parameter"}), 400
    k_param = request.args.get("k")
    try:
        top_k = int(k_param) if k_param else 50
    except ValueError:
        return jsonify({"error": "Invalid 'k' parameter"}), 400
    try:
        recs, err = recommend_for_user(user_uuid, top_k=top_k, per_course_top=100)
        if err:
            return jsonify({"error": err}), 404
        results = recs.to_dict(orient="records")
        print(f"User {user_uuid}: {len(results)} recommendations")
        return jsonify({"user_id": user_uuid, "num_recommended": len(results), "recommendations": results})
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/search", methods=["GET", "OPTIONS"])
def search():
    if request.method == "OPTIONS":
        return jsonify({"message": "CORS preflight OK"}), 200
    term = request.args.get("term")
    if not term:
        return jsonify({"error": "Missing 'term' parameter"}), 400
    k_param = request.args.get("k")
    try:
        top_k = int(k_param) if k_param else 10
    except ValueError:
        return jsonify({"error": "Invalid 'k' parameter"}), 400
    try:
        recs, err = recommend_for_search(term, top_k=top_k)
        if err and recs.empty:
            return jsonify({"error": err}), 404
        results = recs.to_dict(orient="records")
        print(f"Search '{term}': {len(results)} results")
        return jsonify({"term": term, "num_results": len(results), "results": results})
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/filter/search", methods=["POST", "OPTIONS"])
def filter_search():
    if request.method == "OPTIONS":
        return jsonify({"message": "CORS preflight OK"}), 200
    try:
        data = request.get_json() or {}
        language = data.get("language")
        category = data.get("category")
        subcategory = data.get("subcategory")
        topic = data.get("topic")
        isPaid = data.get("isPaid")
        minRating = data.get("minRating")
        maxPrice = data.get("maxPrice")
        minDuration = data.get("minDuration")
        maxDuration = data.get("maxDuration")

        query = """
            SELECT 
                id AS course_id,
                title,
                headline,
                category,
                subcategory,
                topic,
                language,
                is_paid,
                instructor_name,
                instructor_url,
                course_url,
                CAST(avg_rating AS FLOAT) AS avg_rating,
                CAST(price AS FLOAT) AS price,
                CAST(num_subscribers AS FLOAT) AS num_subscribers,
                CAST(num_reviews AS FLOAT) AS num_reviews,
                CAST(num_comments AS FLOAT) AS num_comments,
                CAST(num_lectures AS FLOAT) AS num_lectures,
                CAST(content_length_min AS FLOAT) AS content_length_min
            FROM courses
            WHERE 
                avg_rating IS NOT NULL 
                AND price IS NOT NULL 
                AND content_length_min IS NOT NULL
                AND title IS NOT NULL
                AND title <> 'NA'
        """
        params = []

        if language:
            query += " AND LOWER(language) = LOWER(%s)"
            params.append(language)
        if category:
            query += " AND LOWER(category) = LOWER(%s)"
            params.append(category)
        if subcategory:
            query += " AND LOWER(subcategory) = LOWER(%s)"
            params.append(subcategory)
        if topic:
            query += " AND LOWER(title) LIKE LOWER(%s)"
            params.append(f"%{topic}%")
        if isPaid is not None:
            query += " AND is_paid = %s"
            params.append(bool(isPaid))
        if minRating is not None:
            query += " AND CAST(avg_rating AS FLOAT) >= %s"
            params.append(float(minRating))
        if maxPrice is not None:
            query += " AND CAST(price AS FLOAT) <= %s"
            params.append(float(maxPrice))
        if minDuration is not None:
            query += " AND CAST(content_length_min AS FLOAT) >= %s"
            params.append(float(minDuration))
        if maxDuration is not None:
            query += " AND CAST(content_length_min AS FLOAT) <= %s"
            params.append(float(maxDuration))

        query += " ORDER BY CAST(avg_rating AS FLOAT) DESC, CAST(num_subscribers AS FLOAT) DESC LIMIT 100"

        # print(" Incoming filter request:", data)
        # print(" Final Query:", query)
        # print(" Query Params:", params)

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)
                rows = cur.fetchall()

        if not rows:
            # print(" No results found for given filters")
            return jsonify({"num_results": 0, "results": []}), 200

        df = pd.DataFrame(rows)
        df["course_id"] = df["course_id"].astype(str).apply(lambda s: s if s.endswith(".0") else s + ".0")

        # print(f" Query executed successfully, fetched {len(df)} rows")
        print(" Sample course:", df.iloc[0].to_dict())

        return jsonify({"num_results": len(df), "results": df.to_dict(orient="records")})

    except Exception as e:
        print(" Error in /filter/search:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
