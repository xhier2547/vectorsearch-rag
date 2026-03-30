import os
import qdrant_client
from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore

from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# ⚠️ 1. ใส่ API KEY ของคุณ
os.environ["GOOGLE_API_KEY"] = "AIzaSyDdxbHW5VUcJM2TDZ-wcK6p2GB63_vHrI8"

# 2. ตั้งค่า LLM และ Embedding (ต้องใช้โมเดลเดียวกับตอน Ingest)
Settings.llm = GoogleGenAI(model="gemini-2.5-flash") # ใช้ Gemini สรุปคำตอบ
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

print("🗄️ กำลังเชื่อมต่อฐานข้อมูลสมอง AI...")
client = qdrant_client.QdrantClient(host="localhost", port=6333)
# เปลี่ยนจาก "my_advanced_rag" เป็น "rag_v2"
vector_store = QdrantVectorStore(client=client, collection_name="rag_v2")

# 3. โหลด Index จาก Qdrant ที่เราทำไว้
index = VectorStoreIndex.from_vector_store(vector_store=vector_store)

# 4. สร้าง Query Engine (กำหนดให้ดึงเนื้อหาที่เกี่ยวข้องที่สุดมา 3 ชิ้น)
query_engine = index.as_query_engine(similarity_top_k=3)

print("✅ ระบบ RAG พร้อมใช้งานแล้ว! (พิมพ์ 'exit' เพื่อออกจากระบบ)")
print("-" * 50)

# 5. สร้าง Loop สำหรับแชท
while True:
    question = input("\n🧑‍💻 คุณ: ")
    if question.lower() == 'exit':
        print("👋 ลาก่อนครับ!")
        break
    
    if not question.strip():
        continue

    print("🤖 AI กำลังค้นหาข้อมูลและสรุปคำตอบ...")
    response = query_engine.query(question)
    
    print(f"\n💡 AI: {response}")
    
    # --- ส่วนที่เพิ่มเข้ามา: ให้แสดงว่า AI ไปดึงข้อความไหนมาอ่าน ---
    print("\n[อ้างอิงจากเอกสาร]:")
    for i, node in enumerate(response.source_nodes, 1):
        # ตัดข้อความมาโชว์แค่ 150 ตัวอักษรแรก จะได้ไม่รก
        print(f"ชิ้นที่ {i}: {node.text[:150]}...") 
    
    print("-" * 50)