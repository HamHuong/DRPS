# DRPS - Diabetes Readmission Prediction System 

Hệ thống AI hỗ trợ y tế dự đoán rủi ro tái nhập viện của bệnh nhân tiểu đường (DRPS). Dự án kết hợp Học máy (Machine Learning) tiên tiến, XAI (AI Giải thích được bằng SHAP) và kiến trúc Full-stack hiện đại để hỗ trợ các bác sĩ đưa ra quyết định lâm sàng.

## Công nghệ sử dụng (Tech Stack)

*   **Machine Learning / AI:** XGBoost, Random Forest, Logistic Regression.
*   **Explainable AI (XAI):** SHAP (SHapley Additive exPlanations).
*   **MLOps:** MLflow (Experiment Tracking & Model Registry).
*   **Backend API:** FastAPI (Python), SQLAlchemy, Pydantic.
*   **Frontend UI:** React (Vite), Axios, Custom CSS (Navy Blue Theme).
*   **Database:** PostgreSQL (Môi trường thật) & SQLite (Môi trường Test).
*   **Testing:** Pytest, HTTPX (Unit/Integration Test), Locust (Load Test).
*   **Deployment / Orchestration:** Docker & Docker Compose.

## Cấu trúc thư mục (Project Structure)

```text
Final_CNM/
├── backend/               # FastAPI Backend & API Routers
│   ├── main.py            # Entry point của API
│   ├── routers/           # Các logic API: auth, predict, stats, mlops
│   ├── tests/             # Bộ Test Suite toàn diện (Pytest)
│   ├── locustfile.py      # Kịch bản Load Testing
│   └── requirements.txt
├── frontend/              # React.js Frontend
│   ├── src/
│   │   ├── pages/         # Dashboard Bác sĩ và Quản trị viên
│   │   ├── index.css      # Theme giao diện (Navy Blue)
│   └── package.json
├── ml_pipeline/           # Pipeline Huấn luyện AI & Tiền xử lý
│   ├── train.py           # Script huấn luyện & Ghi log vào MLflow
│   └── preprocessing.py   # Logic xử lý khuyết thiếu, chuẩn hóa (Scaler)
├── dataset/               # Dữ liệu gốc (CSV)
├── mlflow_artifacts/      # Thư mục lưu trữ artifact của MLflow server
└── docker-compose.yml     # File cấu hình chạy toàn bộ hệ thống bằng Docker
```

## 🛠️ Hướng dẫn cài đặt & Chạy dự án (Local Development)

Dự án được thiết kế để chạy mượt mà thông qua **Docker Compose**.

### Yêu cầu cài đặt
*   [Docker](https://www.docker.com/) & Docker Compose.
*   (Tuỳ chọn nếu chạy không dùng Docker): Python 3.10+, Node.js 18+.

### Chạy bằng Docker (Khuyên dùng)
1. Mở Terminal tại thư mục gốc của dự án.
2. Chạy lệnh sau để build và khởi động toàn bộ cụm dịch vụ (Frontend, Backend, DB, MLflow):
   ```bash
   docker-compose up -d --build
   ```
3. Truy cập các dịch vụ:
   *   **Giao diện web (Frontend):** `http://localhost:5173`
   *   **Backend API Docs (Swagger):** `http://localhost:8000/docs`
   *   **Giao diện quản lý mô hình MLflow:** `http://localhost:5000`

### Tắt hệ thống
```bash
docker-compose down
```

##  Hướng dẫn chạy Bộ kiểm thử (Testing)

Hệ thống đi kèm một bộ Test Suite hoàn chỉnh bao quát các khía cạnh Unit, Integration, và System testing.

**1. Chạy Unit/Integration Tests bằng Pytest**
Di chuyển vào thư mục backend và chạy:
```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

**2. Chạy Load Testing bằng Locust (Mô phỏng chịu tải thời gian thực)**
Mở một terminal khác tại thư mục backend và chạy:
```bash
locust -f locustfile.py
```
Sau đó mở trình duyệt tại: `http://localhost:8089`. Điền số lượng người dùng đồng thời (ví dụ: 100) và tỷ lệ spawn, sau đó bấm *Start swarming* để quan sát biểu đồ chịu tải của hệ thống.

