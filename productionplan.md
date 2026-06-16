# Production Deployment Roadmap: Google AI Edge Manufacturing Gateway

To deploy the **APEX-EDGE Gateway** in a real-world, high-volume production environment using the **Google AI Ecosystem**, the architecture must transition from a simulated local sandbox to a hybrid **Edge + Cloud Production Topology**.

---

## 1. Physical Edge Hardware Setup (On the Factory Floor)

- **Industrial Cameras:** Install high-resolution machine vision cameras (e.g., GigE Vision or USB3 Vision cameras) directly above the assembly line conveyor.
- **Compute Gateways:** Deploy industrial edge computers (e.g., ASUS IoT or Advantech industrial gateways) equipped with **Google Coral M.2 / PCIe Accelerator cards** (housing Edge TPU chips).
- **Local Edge Processing:** Interface cameras directly to the Coral-enabled gateways to capture video frames and run inferences locally with sub-10ms latency.

---

## 2. Model Training & Optimization (Vertex AI Cloud)

To calibrate the AI models for your specific defect types (such as surface cracks, dents, and weld voids):
- **Data Ingestion:** Upload image sets of manufacturing components (both nominal and defective) to **Google Cloud Storage (GCS)**.
- **Model Training:** Utilize **Vertex AI Pipelines** or **Vertex AI Custom Training** to fine-tune the baseline models:
  - **PaliGemma-3B:** Fine-tune the VLM on paired images and textual defect summaries to teach it to write company-specific defect observations.
  - **Object Detector:** Train a lightweight detector (e.g. MobileNet-SSD or YOLOv8-nano) to output bounding box coordinates of anomalies.
- **Edge Compilation:** Run the trained models through the **Edge TPU Compiler**, quantizing weights to `INT8` precision so they are optimized for Coral hardware acceleration.
- **Gemma-2B Quantization:** Quantize the Gemma-2B-Instruct weights using the **MediaPipe Model Maker** into a compact flatbuffer (`.bin`) for CPU execution on the gateway.

---

## 3. Local Software Runtime (MediaPipe Tasks SDK)

Package the gateway logic inside containerized microservices (using Docker) deployed on the factory floor:
- **Frame Grabber:** Capture video frames using OpenCV or PyAV from local industrial camera feeds.
- **MediaPipe Inference Core:** Execute model inferences using the **MediaPipe Tasks SDK** (Object Detector Task) mapping driver requests to the Coral TPU PCIe bus (`libedgetpu.so`).
- **Visual Description Engine:** Pass defect crops to the local **PaliGemma** runner to output descriptive observation texts.
- **Local AI Operator Assistant:** Expose the local quantized **Gemma-2B** model via the **MediaPipe LLM Inference API** to answer operator maintenance queries completely offline.

---

## 4. Edge Orchestration & Updates (GKE On-Prem & Vertex AI Registry)

Manage software and model upgrades seamlessly across multiple manufacturing plants:
- **Vertex AI Model Registry:** Store and version all trained model weights centrally.
- **Google Artifact Registry:** Store containerized application builds.
- **GKE On-Prem (Google Distributed Cloud):** Orchestrate application containers running on factory machines. Use GKE to broadcast rolling Over-The-Air (OTA) updates and update running model versions without line downtime.

---

## 5. Centralized Cloud Observability (BigQuery & Looker)

- **Metadata Streaming:** Program the local gateway to send light metadata packets (such as timestamp, defect type, OEE metrics, confidence scores) to **Google Cloud Pub/Sub**.
- **Data Warehousing:** Feed the streamed Pub/Sub data directly into **Google BigQuery** for long-term storage and analytical queries.
- **CxO Dashboarding:** Build cross-plant productivity dashboards using **Looker** to monitor global factory performance and scrap metrics.
- **Vertex AI Model Monitoring:** Periodically pipe randomly sampled inspection frames back to Vertex AI to evaluate accuracy, detect model drift, and trigger automated retraining pipelines.
