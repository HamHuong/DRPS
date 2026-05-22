def test_predict_success(client):
    payload = {
        "patient_code": "PT-TEST-001",
        "race": "Caucasian",
        "gender": "Female",
        "age_group": "[60-70)",
        "time_in_hospital": 5,
        "num_lab_procedures": 40,
        "num_medications": 15,
        "number_diagnoses": 5,
        "number_outpatient": 0,
        "number_emergency": 0,
        "number_inpatient": 1,
        "A1Cresult": "None",
        "insulin": "No",
        "change": "No"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "probability" in data
    assert "risk_level" in data
    assert "shap_values" in data
    assert 0 <= data["probability"] <= 1

def test_predict_invalid_data(client):
    payload = {
        "patient_code": "PT-TEST-003",
        "race": "Caucasian",
        "gender": "Female",
        "age_group": "[60-70)",
        "time_in_hospital": -5, # Invalid
        "num_lab_procedures": 40,
        "num_medications": 15,
        "number_diagnoses": 5,
        "number_outpatient": 0,
        "number_emergency": 0,
        "number_inpatient": 1,
        "A1Cresult": "None",
        "insulin": "No",
        "change": "No"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422 # Unprocessable Entity from Pydantic
