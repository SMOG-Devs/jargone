# Jargone

**Simplifying Jargon, Enabling Collaboration**  
Jargone is an AI-powered browser extension that provides real-time explanations for complex technical or domain-specific terms. It bridges communication gaps between cross-functional teams by offering clear, contextual definitions right where users need them.

[🎥 Watch Demo](https://youtu.be/GeSTrvattIQ)<br>
<br>
[📝 See Presentation](/docs/jargone.pdf)

---

## 🧠 Overview

Jargone functions as a lightweight browser extension connected to an intelligent backend that analyzes and explains terms using contextual AI. It’s designed to improve understanding between technical and non-technical stakeholders in any organization — from product and engineering to sales and marketing.

For proof-of-concept, we use OpenAI’s API for language generation. However, **we prioritize privacy and security**: for enterprise deployment, Jargone can be configured with **on-premise LLMs** such as **LLaMA**, ensuring all company data remains secure within your infrastructure.

---

## ✨ Key Features

- 🔍 **Instant Jargon Explanation**: Select any text on a webpage to receive a real-time, plain-language explanation.
- 🧑‍💼 **Contextual Personalization**: Customize explanations based on your role and preferred depth of detail.
- 📚 **Search History**: Review previous explanations for reference.
- ⚙️ **Configurable Backend**: Swap between public APIs and private LLMs (like LLaMA) for full control over data privacy.

---

## 🛠️ Tech Stack

**Built with:**

- `Python` – backend logic and API
- `FastAPI` – backend web framework
- `OpenAI API` – proof-of-concept LLM
- `Docker` – containerized architecture
- `RAG` – retrieval-augmented generation pattern
- `Qdrant` – vector similarity search engine
- `PostgreSQL` – structured data storage
- `JavaScript` – frontend/browser extension
- `LLaMA` (optional) – self-hosted LLM alternative for enterprise

---

## 🧪 Installation

### Prerequisites
- A local backend running on `http://localhost:8000`
- Node.js and npm (optional, if you plan to modify frontend)

### Setup Instructions

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/jargone.git
   ```

2. Launch Chrome and navigate to `chrome://extensions/`

3. Enable **Developer Mode**

4. Click **Load unpacked** and select the extension folder

5. The Jargone icon will now appear in your browser toolbar

---

## 🚀 Usage

1. Highlight any word or phrase on a webpage
2. Click the Jargone extension icon
3. View the explanation instantly in the popup

### Extension Tabs

- **Results** – Explanation for current selection
- **History** – Access previously viewed definitions
- **Profile** – Set your role and explanation detail level

---

## 🔌 Backend API

Jargone communicates with the backend through a REST API.

**Endpoint:**
```
POST http://localhost:8000/explain
```

**Request Body:**
```json
{
  "text": "Selected jargon term",
  "explanationLevel": "basic",
  "userRole": "Marketing Manager",
  "additionalContext": "I'm new to the tech industry and unfamiliar with infrastructure concepts."
}
```

---

## 🔐 Data Privacy

Jargone was designed with **data privacy in mind**:

- The proof-of-concept uses OpenAI’s API for LLM capabilities.
- For business use, this can be replaced with **self-hosted models** such as **LLaMA**, ensuring **all sensitive documents and user queries stay on-premise**.

---

## 📍 Project Status

- ✅ Functional prototype complete
- 🚀 Preparing for production deployment
- 🧩 Looking for contributors and feedback

---

## 🤝 Contributing

We welcome contributions! If you'd like to submit a feature, improvement, or fix, please open an issue or a pull request.

