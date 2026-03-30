# 🛠️ Tech Stack & Implementation Details

นี่คือรายละเอียดเชิงลึกของเทคโนโลยีที่ใช้ในระบบ **Advanced Vector Search & RAG**

---

## 🏗️ 1. Backend: Python + FastAPI

เราเลือกใช้ **FastAPI** เนื่องจากมีประสิทธิภาพสูง (High Performance) และรองรับการทำงานแบบ Asynchronous ซึ่งเหมาะสำหรับระบบ RAG ที่ต้องรอการตอบสนองจาก LLM และฐานข้อมูล

- **Framework**: [FastAPI 0.x](https://fastapi.tiangolo.com/)
- **Server**: [Uvicorn 0.x](https://www.uvicorn.org/)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/)

---

## 🧠 2. Orchestration & RAG: LlamaIndex

เราใช้ **LlamaIndex** ในการจัดการวงจรชีวิตของระบบ RAG ทั้งหมด ตั้งแต่การนำเข้าข้อมูล (Data Ingestion) จนถึงการทำ Retrieval และ Generation

- **LlamaIndex Version**: `0.x`
- **Core Strategy**: `VectorStoreIndex` สำหรับสร้างโครงสร้างดัชนีการค้นหา
- **Memory**: `ChatMemoryBuffer` (Token Limit: 1500) เพื่อจำบทสนทนาก่อนหน้า
- **Chat Mode**: `condense_plus_context` ช่วยกรองคำถามใหม่พร้อมบริบทก่อนส่งให้ LLM

---

## 🤖 3. LLM Model: Google Gemini

สมองหลักของระบบคือ **Google Gemini** รุ่น Flash ซึ่งมีความสมดุลระหว่างความเร็วและความแม่นยำสูง

- **Model**: `gemini-1.5-flash` หรือ `gemini-2.0-flash` (อ้างอิงจากโค้ด `gemini-2.5-flash`)
- **API**: [Google Generative AI](https://ai.google.dev/)
- **Task**: ใช้สำหรับการให้เหตุผล (Reasoning) และการสรุปคำตอบจากเอกสาร

---

## 🔡 4. Embeddings: HuggingFace

การแปลงเอกสารเป็นตัวเลข (Vector) เราทำการประมวลผลภายในเครื่อง (Local) เพื่อลดค่าใช้จ่ายและความเร็ว

- **Model**: `BAAI/bge-small-en-v1.5`
- **Type**: Dense Vector Embedding
- **Performance**: รุ่นที่เป็นที่นิยมและให้ความแม่นยำสูงในการค้นหาข้อความภาษาอังกฤษและรองรับภาษาไทยได้ในบางส่วน

---

## 🗄️ 5. Vector Database: Qdrant

เราเลือกใช้ **Qdrant** เป็น Vector Store เนื่องจากมีความสามารถในการทำ Filter และ Search ที่ทรงพลัง

- **Search Type**: HNSW-based Approximate Nearest Neighbor (ANN)
- **Deployment**: Local Instance (localhost:6333)
- **Collection Name**: `rag_v2`

---

## 📄 6. Data Processing: PyMuPDF

การอ่านไฟล์ PDF เราเลือกใช้ **PyMuPDF** (`fitz`) เนื่องจากมีความเสถียรและสามารถดึงข้อความพร้อมโครงสร้างได้อย่างแม่นยำกว่าไลบรารีมาตรฐานทั่วไป

- **Reader**: `PyMuPDFReader` (จาก LlamaIndex Readers)

---

## 🎨 7. Frontend: Next.js 15

หน้าจอของท่านสร้างขึ้นด้วยเทคโนโลยีล่าสุด เพื่อประสบการณ์การใช้งานที่ราบรื่น

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Markdown Support**: `react-markdown` + `remark-math` สำหรับแสดงผลวิชาการหรือสมการทางคณิตศาสตร์
