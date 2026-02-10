# 🎥 Production Video RAG

**Production Video RAG** is a full-stack AI application that allows users to upload security footage or video files, automatically index them using multimodal AI, and "chat" with the video content using natural language.

It combines **Computer Vision**, **Vector Search**, and **Large Language Models (LLMs)** to allow queries like *"Show me the red car turning left"* or *"Did anyone enter the shop after 9 PM?"* and instantly retrieve the exact video clips.

---

## 🚀 Key Features

* **Smart Ingestion**: Upload MP4 videos via a web interface. The system automatically extracts frames (1 fps), generates descriptive captions using **GPT-4o-mini**, and vectorizes them.
* **Semantic Search**: Search by meaning, not just keywords. Finds events based on visual descriptions.
* **Hybrid Filtering**: Filter results by **Camera ID**, **Date**, and **Time of Day** (e.g., "Cam1 between 09:00 and 10:00").
* **AI Chat Agent**: Distinguishes between casual conversation ("Hi") and video search queries ("Find the thief").
* **Instant Playback**: Returns clickable video clips that play the exact moment of the event.
* **Local Media Storage**: Keeps raw videos and generated clips locally for speed and privacy, while using **Qdrant** for vector metadata.

---

## 🛠️ Tech Stack

### **Backend (Python / FastAPI)**

* **Framework**: FastAPI
* **AI Models**:
* *Vision*: OpenAI GPT-4o-mini (Frame Captioning)
* *Embeddings*: OpenAI `text-embedding-3-small`
* *Chat*: OpenAI GPT-4o-mini


* **Vector Database**: **Qdrant** (Cloud or Docker)
* **Video Processing**: OpenCV (Frame extraction), MoviePy (Clip generation)
* **Storage**: Local Filesystem (`data/videos` & `data/clips`)

### **Frontend (React)**

* **Framework**: React (Vite)
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **State Management**: React Hooks

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

* **Python 3.10+**
* **Node.js & npm** (for Frontend)
* **API Keys**:
* **OpenAI API Key** (for Vision & LLM)
* **Qdrant URL & API Key** (for Vector Store)



---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/production_video_rag.git
cd production_video_rag

```

### 2. Backend Setup

The backend handles video processing, AI interaction, and the API.

1. **Navigate to the backend directory:**
```bash
cd backend

```


2. **Create and Activate a Virtual Environment:**
* *Windows:*
```bash
python -m venv venv
venv\Scripts\activate

```


* *Mac/Linux:*
```bash
python3 -m venv venv
source venv/bin/activate

```




3. **Install Python Dependencies:**
```bash
pip install -r requirements.txt

```


4. **Configure Environment Variables:**
Create a `.env` file inside the `backend/` folder and add your keys:
```ini
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
QDRANT_URL=https://your-qdrant-cluster-url.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key

```



### 3. Frontend Setup

The frontend provides the chat interface and video player.

1. **Open a NEW terminal** (keep the backend terminal open).
2. **Navigate to the frontend directory:**
```bash
cd frontend

```


3. **Install Node Dependencies:**
```bash
npm install

```



---

## ▶️ Running the Application

You need to run the Backend and Frontend in two separate terminals.

### Terminal 1: Start Backend (FastAPI)

Make sure you are in the `backend/` directory and your venv is active.

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

```

*The API will be available at `http://localhost:8000`.*

### Terminal 2: Start Frontend (React)

Make sure you are in the `frontend/` directory.

```bash
npm run dev

```

*The UI will be available at `http://localhost:5173` (or the link shown in your terminal).*

---

## 📂 Project Structure

```text
production_video_rag/
│
├── backend/                 # Python FastAPI Server
│   ├── app/
│   │   ├── main.py          # API Entry Point
│   │   ├── core/            # Configuration (config.py)
│   │   ├── services/        # Business Logic
│   │   │   ├── llm_factory.py   # OpenAI Integration
│   │   │   ├── qdrant_store.py  # Qdrant Vector Logic
│   │   │   ├── video_proc.py    # OpenCV & MoviePy Logic
│   │   │   └── reranker.py      # Search optimization
│   │   └── models/          # Pydantic Data Models
│   ├── data/                # Local Storage (Not committed to Git)
│   │   ├── videos/          # Uploaded Raw MP4s
│   │   └── clips/           # Generated Result Clips
│   ├── requirements.txt     # Python Dependencies
│   └── .env                 # API Keys
│
└── frontend/                # React Client
    ├── src/
    │   ├── api/             # API Connectors
    │   ├── components/      # UI Components (Sidebar, VideoGrid, Chat)
    │   └── App.jsx          # Main App Component
    ├── package.json         # Node Dependencies
    └── index.html

```

---

## 🧩 How It Works

1. **Upload**: User uploads a video (e.g., `CCTV_Cam1.mp4`).
2. **Processing**:
* Backend saves the file to `backend/data/videos/`.
* **VideoProcessor** reads the file, extracts 1 frame per second.
* **LLM Service** generates a text description for every frame.
* **Qdrant Store** saves these descriptions as Vectors + Metadata (Timestamp, Camera ID).


3. **Search**:
* User asks: *"Find the red truck."*
* Backend converts the query to a vector and searches Qdrant.
* **VideoProcessor** cuts a 4-second clip from the original video based on the timestamps found.
* Clip is saved to `backend/data/clips/` and served to the Frontend.



---

## ⚠️ Troubleshooting

* **"ReadTimeout" Error**: If uploading large videos fails, check `qdrant_store.py` and ensure the timeout is set to `300.0` or higher.
* **Video Not Playing**: Ensure the Backend is running on port `8000`. The frontend expects clips to be served from `http://localhost:8000/static/clips/...`.
* **Dependencies**: If `npm run dev` fails, try deleting `node_modules` and running `npm install` again.