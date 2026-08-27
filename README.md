# VedaAI: Assessment Extraction & Answer Mapping

VedaAI is a powerful, automated grading assistant that extracts questions from handwritten/printed question papers and matches them precisely with student answer sheets using state-of-the-art vision models. 

## Features
- **Cloud-based Vision AI**: Toggle seamlessly between Google's **Gemini 2.0 Flash** and **Mistral OCR 4.1**.
- **Automated Grading & Feedback**: Generates bounding boxes, maps question segments directly to handwritten student answers, grades the response, and provides AI-driven teaching feedback.
- **Modern UI**: An intuitive Next.js dashboard mimicking a polished assessment environment.

## Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Environment Setup
Create a `.env.local` file in the root of the project with your API keys:

```bash
GEMINI_API_KEY="your_gemini_api_key"
MISTRAL_API_KEY="your_mistral_api_key"
```
*(You can obtain these from the Google AI Studio and Mistral Developer Console respectively).*

### 3. Installation
Install the project dependencies:
```bash
npm install
```

### 4. Running the Development Server
Start the Next.js local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start using VedaAI.

---
**Note:** Sample data (PDFs and logos) are located in the `assets/` folder for testing purposes.
