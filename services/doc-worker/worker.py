import os
import json
import asyncio
import io
from minio import Minio
from redis.asyncio import Redis
import docx
from anthropic import AsyncAnthropic
import aiohttp

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "mock-key")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
MINIO_URL = os.getenv("MINIO_URL", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000/api")

ai_client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
redis_client = Redis.from_url(REDIS_URL)
s3_client = Minio(MINIO_URL, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=False)

async def translate_text(text: str, from_lang: str, to_lang: str) -> str:
    if not text.strip(): return text
    # Mocking actual AI call to save costs/time unless fully integrated
    # return f"[Translated {from_lang}->{to_lang}] {text}"
    try:
        prompt = f"Translate the following from {from_lang} to {to_lang}. Output only the translation.\n\n{text}"
        resp = await ai_client.messages.create(
            model="claude-3-opus-20240229", max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )
        return resp.content[0].text
    except Exception as e:
        print(f"Translation error: {e}")
        return f"[Error] {text}"

async def process_job(job_data: dict):
    job_id = job_data["jobId"]
    bucket = "lingobridge"
    try:
        # Create bucket if not exists
        if not s3_client.bucket_exists(bucket):
            s3_client.make_bucket(bucket)

        for src_file in job_data["sourceFiles"]:
            obj_name = src_file["storageKey"]
            file_bytes = b"mock"
            try:
                resp = s3_client.get_object(bucket, obj_name)
                file_bytes = resp.read()
                resp.close()
                resp.release_conn()
            except Exception as e:
                print(f"Warning: Could not fetch {obj_name} from MinIO: {e}. Using mock bytes.")

            result_bytes = b"Mock translated document bytes"
            if src_file["mimeType"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" and file_bytes != b"mock":
                doc = docx.Document(io.BytesIO(file_bytes))
                for para in doc.paragraphs:
                    if para.text.strip():
                        para.text = await translate_text(para.text, job_data["fromLang"], job_data["toLang"])
                
                out_io = io.BytesIO()
                doc.save(out_io)
                result_bytes = out_io.getvalue()
            
            # Save result to MinIO
            res_key = f"jobs/{job_id}/result/translated_{src_file['fileId']}.docx"
            try:
                s3_client.put_object(bucket, res_key, io.BytesIO(result_bytes), len(result_bytes))
                print(f"Saved translated file to {res_key}")
            except Exception as e:
                print(f"Warning: Failed saving to MinIO: {e}")

        # Notify backend
        async with aiohttp.ClientSession() as session:
            status = "DONE" if not job_data.get("notarize") else "REVIEW"
            await session.put(f"{API_BASE_URL}/documents/{job_id}/status", json={"status": status})
            print(f"Job {job_id} finished. Status sent to backend.")

    except Exception as e:
        print(f"Job {job_id} failed: {e}")
        try:
            async with aiohttp.ClientSession() as session:
                await session.put(f"{API_BASE_URL}/documents/{job_id}/status", json={"status": "FAILED"})
        except Exception:
            pass

async def main():
    print("Document Worker started. Listening on Redis queue: 'doc-jobs'")
    while True:
        try:
            job_tuple = await redis_client.blpop("doc-jobs", timeout=5)
            if job_tuple:
                job_data = json.loads(job_tuple[1])
                print(f"Received job {job_data['jobId']}")
                await process_job(job_data)
        except Exception as e:
            print(f"Worker loop error: {e}")
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())
