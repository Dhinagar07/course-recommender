from flask import Flask, request, jsonify
import os
import numpy as np
import pandas as pd
import joblib
import faiss
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone

DATABASE_URL = 'postgresql://neondb_owner:npg_nh1zSmJ4LVDH@ep-aged-field-a1y85qmf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
SAVE_DIR = "cb_model_large"

index = faiss.read_index(os.path.join(SAVE_DIR, "faiss_index.ip"))
meta = joblib.load(os.path.join(SAVE_DIR, "reco_meta.pkl"))
course_meta = meta["meta"].reset_index(drop=True)
course_meta["id"] = course_meta["id"].astype(float)

app = Flask(__name__)

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def get_user_subscribed_courses(user_uuid):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT course_id, subscribed_at FROM user_courses WHERE user_id = %s;",
                    (user_uuid,)
                )
                rows = cur.fetchall()
        courses = []
        for row in rows:
            course_id = float(row["course_id"])
            sub_at = row["subscribed_at"]
            if isinstance(sub_at, str):
                sub_at = datetime.fromisoformat(sub_at)
            if sub_at.tzinfo is None:
                sub_at = sub_at.replace(tzinfo=timezone.utc)
            courses.append({"course_id": course_id, "subscribed_at": sub_at})
        return courses
    except Exception as e:
        print("DB error:", e)
        return []

def get_course_vector(course_id):
    course_id = float(course_id)
    idx_list = course_meta.index[course_meta["id"] == course_id].tolist()
    if not idx_list:
        return None
    return index.reconstruct(idx_list[0])

def recommend_for_user(user_uuid, top_k=100, per_course_top=100):
    subscribed_courses = get_user_subscribed_courses(user_uuid)
    if not subscribed_courses:
        return pd.DataFrame(), "User has no subscribed courses."

    now = datetime.now(timezone.utc)
    all_recs = []

    for course in subscribed_courses:
        vec = get_course_vector(course["course_id"])
        if vec is not None:
            vec = vec.astype("float32").reshape(1, -1)
            vec = np.ascontiguousarray(vec)
            faiss.normalize_L2(vec)

            D, I = index.search(vec, per_course_top)
            days_since = (now - course["subscribed_at"]).total_seconds() / 86400
            weight = 1 / (1 + days_since)

            for idx, sim in zip(I[0], D[0]):
                all_recs.append({"faiss_idx": idx, "similarity": sim * weight})

    if not all_recs:
        return pd.DataFrame(), "No valid course vectors found."

    df = pd.DataFrame(all_recs)
    df = df.groupby("faiss_idx")["similarity"].max().reset_index()
    df = df.sort_values("similarity", ascending=False)

    df["course_id"] = df["faiss_idx"].apply(lambda x: course_meta.iloc[x]["id"])
    subscribed_ids = [c["course_id"] for c in subscribed_courses]
    df = df[~df["course_id"].isin(subscribed_ids)]

    df["title"] = df["course_id"].apply(lambda x: course_meta.loc[course_meta["id"] == x, "title"].values[0])
    df["category"] = df["course_id"].apply(lambda x: course_meta.loc[course_meta["id"] == x, "category"].values[0])
    df["instructor_name"] = df["course_id"].apply(lambda x: course_meta.loc[course_meta["id"] == x, "instructor_name"].values[0])

    top_recs = df.head(top_k).reset_index(drop=True)
    return top_recs, None

@app.route("/recommend", methods=["GET"])
def recommend():
    user_uuid = request.args.get("user_id")
    if not user_uuid:
        return jsonify({"error": "Missing 'user_id' parameter"}), 400

    # Get optional k parameter
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
        return jsonify({"user_id": user_uuid, "num_recommended": len(results), "recommendations": results})
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
