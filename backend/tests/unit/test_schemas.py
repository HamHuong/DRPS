import pytest
from pydantic import ValidationError
from schemas import PatientCreate

def test_patient_create_valid():
    data = {
        "patient_code": "PT-001",
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
    patient = PatientCreate(**data)
    assert patient.time_in_hospital == 5

def test_patient_create_invalid_hospital_time():
    data = {
        "patient_code": "PT-001",
        "race": "Caucasian",
        "gender": "Female",
        "age_group": "[60-70)",
        "time_in_hospital": -5, # Invalid, must be >= 1
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
    with pytest.raises(ValidationError):
        PatientCreate(**data)

def test_patient_create_invalid_medications():
    data = {
        "patient_code": "PT-001",
        "race": "Caucasian",
        "gender": "Female",
        "age_group": "[60-70)",
        "time_in_hospital": 5,
        "num_lab_procedures": 40,
        "num_medications": 105, # Invalid, must be <= 100
        "number_diagnoses": 5,
        "number_outpatient": 0,
        "number_emergency": 0,
        "number_inpatient": 1,
        "A1Cresult": "None",
        "insulin": "No",
        "change": "No"
    }
    with pytest.raises(ValidationError):
        PatientCreate(**data)
