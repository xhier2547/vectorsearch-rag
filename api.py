import os
import shutil
import qdrant_client
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llama_index.core import VectorStoreIndex, Settings, SimpleDirectoryReader
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.readers.file import PyMuPDFReader
from llama_index.core.memory import ChatMemoryBuffer

# 1. ตั้งค่า API Key และ Models
os.environ["GOOGLE_API_KEY"] = "AIzaSyDdxbHW5VUcJM2TDZ-wcK6p2GB63_vHrI8"
Settings.llm = GoogleGenAI(model="gemini-2.5-flash")
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

# 2. เชื่อมต่อฐานข้อมูล Qdrant
client = qdrant_client.QdrantClient(host="localhost", port=6333)
vector_store = QdrantVectorStore(client=client, collection_name="rag_v2")
index = VectorStoreIndex.from_vector_store(vector_store=vector_store)

# 3. สร้าง Chat Engine พร้อมระบบความจำ (Memory) จำได้สูงสุด 1500 tokens
memory = ChatMemoryBuffer.from_defaults(token_limit=1500)
chat_engine = index.as_chat_engine(
    chat_mode="condense_plus_context", # โหมดนี้จะเอาคำถามใหม่ไปผสมบริบทเก่าก่อนค้นหา
    memory=memory,
    similarity_top_k=3
)

# 4. สร้างแอป FastAPI พร้อมเปิด CORS
app = FastAPI(title="Advanced RAG API (Production Ready)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str

# ---------------- API ENDPOINTS ---------------- #

@app.get("/")
def read_root():
    return {"status": "✅ Production API is running!"}

# Endpoint 1: สำหรับถาม-ตอบ (อัปเกรดให้มีความจำ)
@app.post("/chat")
def chat_with_pdf(request: ChatRequest):
    try:
        # ใช้ chat() แทน query() เพื่อให้ระบบจำบริบทได้
        response = chat_engine.chat(request.question)
        
        sources = []
        for node in response.source_nodes:
            sources.append(node.text[:200] + "...")
            
        return {
            "question": request.question,
            "answer": str(response),
            "sources": sources
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint 2: สำหรับอัปโหลดไฟล์ PDF เข้า AI อัตโนมัติ
@app.post("/upload")
def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="รับเฉพาะไฟล์ PDF เท่านั้นครับ")
    
    try:
        # 1. บันทึกไฟล์ที่รับมาลงโฟลเดอร์ data
        file_path = f"./data/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. ให้ PyMuPDF อ่านไฟล์ที่เพิ่งโหลดมา
        extractor = {".pdf": PyMuPDFReader()}
        docs = SimpleDirectoryReader(input_files=[file_path], file_extractor=extractor).load_data()
        
        # 3. อัปเดตข้อมูลใหม่ลงใน Qdrant ทันที
        for doc in docs:
            index.insert(doc)
            
        return {"filename": file.filename, "status": "✅ อัปโหลดและเรียนรู้ข้อมูลสำเร็จ!"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการประมวลผลไฟล์: {str(e)}")

# Endpoint 3: ล้างความจำแชท (เผื่ออยากเริ่มคุยเรื่องใหม่)
@app.post("/clear_memory")
def clear_memory():
    chat_engine.reset()
    return {"status": "✅ ล้างความจำ AI เรียบร้อยแล้ว"}