
import os
import qdrant_client
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore

from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.readers.file import PyMuPDFReader # <-- เพิ่มตัวอ่าน PDF แบบโหด

# ⚠️ ใส่ API KEY ของคุณ
os.environ["GOOGLE_API_KEY"] = "AIzaSyDdxbHW5VUcJM2TDZ-wcK6p2GB63_vHrI8"
Settings.llm = GoogleGenAI(model="gemini-2.5-flash")
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

print("📄 1. กำลังอ่านไฟล์ PDF ด้วย PyMuPDF ...")
# สั่งให้ใช้ PyMuPDF อ่านไฟล์ .pdf ทุกไฟล์
extractor = {".pdf": PyMuPDFReader()}
documents = SimpleDirectoryReader("./data", file_extractor=extractor).load_data()

print("🗄️ 2. กำลังเชื่อมต่อ Qdrant Database...")
client = qdrant_client.QdrantClient(host="localhost", port=6333)
# เปลี่ยนชื่อ Collection ใหม่เป็น rag_v2 เพื่อเริ่มเก็บข้อมูลใหม่ที่สะอาด
vector_store = QdrantVectorStore(client=client, collection_name="rag_v2")
storage_context = StorageContext.from_defaults(vector_store=vector_store)

print("🧠 3. กำลังแปลงข้อความเป็น Vector และบันทึกลง Database ...")
index = VectorStoreIndex.from_documents(documents, storage_context=storage_context)

print("✅ เสร็จสิ้น! ข้อมูลถูกอัปเดตใหม่เรียบร้อยแล้ว")