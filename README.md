# 🧠 StudySpark AI

StudySpark is a powerful, AI-driven study assistant built with Next.js. It transforms any study topic or PDF document into a comprehensive, interactive learning curriculum in seconds. Stop reading dense textbooks and start learning actively with intelligent summaries, flashcards, quizzes, and mind maps.

## ✨ Features

- **📄 Document & Topic Processing:** Upload a PDF document or simply type in a topic name, and the AI will analyze it to extract the core concepts.
- **📝 Executive Summaries:** Get a concise, high-level overview of your material before diving deep.
- **📇 Interactive 3D Flashcards:** Test your active recall with interactive flashcards. Navigate easily using keyboard arrows (`←` / `→`) and flip cards with the `Space` bar.
- **✅ Knowledge Quiz:** A dynamic multiple-choice quiz system that grades your answers and provides immediate feedback.
- **🕸️ Concept Mind Maps:** Visual breakdowns of complex topics showing how different concepts connect.
- **🎨 Modern UI/UX:** Built with Tailwind CSS v4, featuring a beautiful "glassmorphism" aesthetic, sticky navigations, and Material Design 3 color tokens.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Frontend:** React 19, TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **AI Integration:** Google Gemini (`@google/genai`)
- **PDF Parsing:** `pdf-parse`
- **Fonts & Icons:** Manrope, Inter, and Google Material Symbols

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js installed, and an active Google Gemini API key.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/studyspark-ai.git
   cd studyspark-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 💡 How it Works

1. The frontend takes either a text topic or a PDF file upload.
2. If a PDF is uploaded, it is sent to the Next.js API route (`/api/generate`) where `pdf-parse` extracts the raw text.
3. The text (or topic) is injected into a highly structured prompt and sent to Google Gemini.
4. The AI returns a strictly formatted JSON object containing the summary, flashcards, quiz questions, and mind map hierarchy.
5. The `Dashboard.tsx` component parses this JSON and mounts the interactive study UI.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#) if you want to contribute.

## 📜 License

This project is licensed under the MIT License.
