# DRPS - Diabetes Readmission Prediction System 

Hệ thống AI hỗ trợ y tế dự đoán rủi ro tái nhập viện của bệnh nhân tiểu đường (DRPS). Dự án kết hợp Học máy (Machine Learning) tiên tiến, XAI (AI Giải thích được bằng SHAP) và kiến trúc MLOps toàn diện để hỗ trợ các bác sĩ đưa ra quyết định lâm sàng.

##  Công nghệ sử dụng (Tech Stack)

*   **Machine Learning / AI:** XGBoost, Random Forest, Scikit-Learn.
*   **Explainable AI (XAI):** SHAP (TreeExplainer).
*   **MLOps:** 
    *   **MLflow**: Quản lý vòng đời mô hình (Tracking & Registry).
    *   **DVC (Data Version Control)**: Quản lý phiên bản tập dữ liệu lớn.
*   **Backend API:** FastAPI (Python), SQLAlchemy, Pydantic.
*   **Frontend UI:** React (Vite), Axios, Recharts (Biểu đồ).
*   **Database & Cache:** PostgreSQL (Cơ sở dữ liệu chính), Redis (Bộ nhớ đệm tăng tốc API).
*   **Observability (Giám sát):** Prometheus (Thu thập số liệu), Grafana (Trực quan hóa tài nguyên hệ thống).
*   **Testing:** Pytest (Unit/Integration Test), Locust (Load Test).
*   **Deployment & CI/CD:** Docker, Docker Compose, GitHub Actions.

##  Cấu trúc thư mục (Project Structure)

```text
Final_CNM/
├── .dvc/                  # Cấu hình Data Version Control
├── .github/workflows/     # CI/CD Pipelines (GitHub Actions)
├── backend/               # FastAPI Backend & API Routers
│   ├── main.py            # Entry point của API (Tích hợp Prometheus)
│   ├── routers/           # Logic API: auth, predict, stats, mlops
│   ├── tests/             # Bộ Test Suite toàn diện (Pytest)
│   └── requirements.txt
├── frontend/              # React.js Frontend
│   ├── src/
│   │   ├── components/    # Components tái sử dụng (vd: HelpCenter)
│   │   ├── pages/         # Dashboard Bác sĩ và Quản trị viên
│   │   └── services/      # Tích hợp gọi API (Axios)
├── ml_pipeline/           # Pipeline Huấn luyện AI & Tiền xử lý
│   ├── train.py           # Script huấn luyện & Ghi log vào MLflow
│   └── models/            # Lưu trữ model artifacts cục bộ
├── prometheus/            # Cấu hình cho Prometheus scraper
├── dataset/               # Dữ liệu được quản lý bởi DVC (.dvc)
└── docker-compose.yml     # File cấu hình chạy toàn bộ cụm dịch vụ
```

##  Hướng dẫn cài đặt & Chạy dự án (Local Development)

Dự án được thiết kế để chạy mượt mà thông qua **Docker Compose** với toàn bộ hệ sinh thái (App, Postgres, Redis, MLflow, Prometheus, Grafana).

### 1. Yêu cầu hệ thống
*   [Docker](https://www.docker.com/) & Docker Compose.
*   DVC (Được sử dụng để kéo dữ liệu về nếu cần).

### 2. Khởi động toàn bộ hệ thống
1. Mở Terminal tại thư mục gốc của dự án.
2. Chạy lệnh sau để build và khởi động toàn bộ cụm dịch vụ:
   ```bash
   docker-compose up -d --build
   ```

### 3. Truy cập các dịch vụ
Sau khi các container khởi động thành công, bạn có thể truy cập qua trình duyệt:

*   ** Giao diện Web (DRPS Dashboard):** `http://localhost:5173`
    *   *Tài khoản Admin:* `admin` / `admin123`
    *   *Tài khoản Bác sĩ:* `doctor` / `doctor123` (hoặc tạo từ trang Admin)
*   **Backend API Docs (Swagger):** `http://localhost:8000/docs`
*   **MLOps - MLflow Registry:** `http://localhost:5000`
*   **Giám sát hệ thống - Grafana:** `http://localhost:3000` (User/Pass: `admin` / `admin`)
*   **Metrics thô - Prometheus:** `http://localhost:9090`

### 4. Tắt hệ thống
Để dừng và xóa toàn bộ container:
```bash
docker-compose down
```

##  Hướng dẫn kiểm thử (Testing & CI)

Hệ thống có bộ Test Suite hoàn chỉnh và tích hợp CI thông qua GitHub Actions. Bạn cũng có thể chạy giả lập ở máy nội bộ:

**1. Chạy Unit/Integration Tests (Pytest)**
```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

**2. Chạy Load Testing bằng Locust (Mô phỏng chịu tải)**
```bash
cd backend
locust -f locustfile.py
```
Mở trình duyệt tại: `http://localhost:8089`, cấu hình số lượng ảo người dùng để theo dõi sức chịu tải thực tế của API. Mọi thông số tải cũng có thể xem trực quan thông qua Grafana.

---
