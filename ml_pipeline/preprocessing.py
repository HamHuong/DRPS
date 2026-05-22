import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import joblib

def load_data(file_path):
    df = pd.read_csv(file_path)
    return df

def preprocess_data(df):
    # Replace '?' with NaN
    df.replace('?', np.nan, inplace=True)
    
    # Map readmitted label: <30 is 1, else 0
    df['readmitted'] = df['readmitted'].map({'<30': 1, '>30': 0, 'NO': 0})
    
    # Select important features based on the request
    features = [
        'age', 'gender', 'race', 'number_outpatient', 'number_emergency', 
        'number_inpatient', 'time_in_hospital', 'num_lab_procedures', 
        'number_diagnoses', 'num_medications', 'A1Cresult', 'change', 'insulin'
    ]
    
    # Handle missing values: Fill missing race with 'Unknown'
    df['race'] = df['race'].fillna('Unknown')
    df['gender'] = df['gender'].replace('Unknown/Invalid', 'Female') # Just assign to majority or handle
    
    X = df[features]
    y = df['readmitted']
    
    return X, y

def create_preprocessor():
    numeric_features = [
        'time_in_hospital', 'num_lab_procedures', 'num_medications', 
        'number_diagnoses', 'number_outpatient', 'number_emergency', 'number_inpatient'
    ]
    categorical_features = ['gender', 'race', 'A1Cresult', 'change', 'insulin']
    ordinal_features = ['age'] # e.g. [50-60) -> ordinal

    # Map age to ordinal categories manually or use OrdinalEncoder
    age_categories = [['[0-10)', '[10-20)', '[20-30)', '[30-40)', '[40-50)', '[50-60)', '[60-70)', '[70-80)', '[80-90)', '[90-100)']]

    numeric_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(handle_unknown='ignore')
    ordinal_transformer = OrdinalEncoder(categories=age_categories, handle_unknown='use_encoded_value', unknown_value=-1)

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features),
            ('ord', ordinal_transformer, ordinal_features)
        ])
    
    return preprocessor

if __name__ == "__main__":
    # Test preprocessing
    df = load_data('../dataset/diabetic_data.csv')
    X, y = preprocess_data(df)
    print(X.head())
    print(y.value_counts())
