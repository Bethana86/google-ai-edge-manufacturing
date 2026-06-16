# APEX-EDGE // Google AI Edge Manufacturing Gateway

APEX-EDGE is a premium-grade, offline-first Industrial Internet of Things (IIoT) control dashboard designed for high-speed manufacturing assembly lines. It leverages Google's advanced Edge AI hardware and software developer ecosystem to automate visual inspection, analyze defects in natural language, and assist operators with local maintenance diagnostics.

---

## 🚀 Key Features

* **Real-time Machine Vision Audit Feed:** Processes simulated camera frames of components (gears, bearings, and sleeves) moving on a conveyor.
* **PaliGemma-3B Visual Diagnostics:** Automatically generates detailed, natural language audit descriptions when anomalies (cracks, dents, weld voids, scratches) are scanned.
* **Gemma-2B Local Assistant Copilot:** An offline quantized LLM that helps engineers troubleshoot mechanical wear and process warnings instantly on the factory floor.
* **Google Coral Edge TPU Integration:** Tracks simulated TPU compute load, temperatures, and board vibrations in real-time.
* **Vertex AI Model Registry OTA Sync:** Demonstrates pulling neural weight artifacts and flashing edge device containers wirelessly.
* **Emergency Halt Interlock:** A physical safety override that stops line physics and resets line metrics instantly.

---

## 🛠️ Technology Stack

* **Client/Shell:** Semantic HTML5, Vanilla CSS3 (Glassmorphism, custom animations, custom layouts), and ES6+ JavaScript.
* **AI Model Engine (Simulated):**
  - **PaliGemma-3B** (Visual Language Model)
  - **Gemma-2B-Instruct** (INT4 Quantized via MediaPipe LLM Inference Task API)
  - **MobileNetV2-SSD** (Object Detection via MediaPipe Tasks)
* **Compute Infrastructure:** Google Coral Dev Boards, PCIe accelerators, and USB accelerators.
* **MLOps Integration:** Vertex AI Model Registry and Google Artifact Registry.

---

## 💻 Running the Application Locally

Since the application is a self-contained Single Page Application (SPA), you can host it using any local HTTP web server.

### Option 1: Using Python (Recommended)
Navigate to the repository folder and run:
```bash
python -m http.server 8080
```
Then open your web browser and navigate to:
[http://localhost:8080](http://localhost:8080)

### Option 2: Using Node (http-server)
Install and run the `http-server` package:
```bash
npx http-server -p 8080
```

---

## 📂 Project Structure

```
edge-manufacturing-iot/
├── index.html            # Main UI shell, dashboards, and tab sections
├── styles.css            # Cyber-industrial style design system
├── app.js                # Conveyor physics engine, charts, and Gemma copilot chat log
├── businesscase.md       # Strategic CxO business proposal
├── product-walkthrough.md# Layman explanation of the project
└── README.md             # Developer documentation
```

---

## ⚙️ Interactive Troubleshooting Commands to try in Gemma Chat
On the **Gemma Copilot** tab, try querying these keywords:
1. *"How do I fix a weld void warning on Node 101?"*
2. *"Explain OEE and how to optimize conveyor belt speed."*
3. *"Why is Node 103 CPU load warning?"*
4. *"What do I do about conveyor bearing vibration?"*
