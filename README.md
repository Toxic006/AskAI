# AskAI - ChatGPT Clone with Gemini API

A modern AI chatbot application built with React, Vite, and Google's Gemini AI. Experience intelligent conversations with a sleek, responsive interface inspired by ChatGPT.

## 🌟 Features

- 💬 **Real-time Chat Interface** - Smooth, responsive conversations
- 🤖 **Gemini AI Integration** - Powered by Google's advanced AI model
- 🎨 **Modern UI/UX** - Clean, intuitive design with dark/light mode
- ⚡ **Lightning Fast** - Built with Vite for optimal performance
- 📱 **Mobile Responsive** - Perfect experience on all devices
- 💾 **Chat History** - Save and manage your conversations
- 🔒 **Secure** - API keys handled safely
- 📝 **Markdown Support** - Rich text formatting in responses
- 🎯 **Context Aware** - Maintains conversation context
- 🔄 **Real-time Streaming** - See responses as they're generated

## 🛠️ Tech Stack

- **Frontend Framework:** React 18
- **Build Tool:** Vite
- **AI Provider:** Google Gemini API
- **Styling:** Tailwind CSS / CSS Modules

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **Google AI Studio Account** for Gemini API key

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/askai-chatbot.git
cd askai-chatbot
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Gemini API Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta

# App Configuration
VITE_APP_NAME=AskAI
VITE_APP_VERSION=1.0.0

# Optional: Analytics
VITE_GA_TRACKING_ID=your_google_analytics_id
```

### 4. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the API key to your `.env` file

### 5. Run the Development Server

```bash
# Using npm
npm run dev

# Using yarn
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

