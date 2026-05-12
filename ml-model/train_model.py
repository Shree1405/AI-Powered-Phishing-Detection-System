"""
Train a Random Forest classifier for phishing URL detection.
Saves the trained model and scaler to disk for use by the API.
"""
import os
import sys
import pickle
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

sys.path.insert(0, os.path.dirname(__file__))
from feature_extractor import extract_features, features_to_vector, FEATURE_NAMES

DATASET_PATH = os.path.join(os.path.dirname(__file__), "../dataset/urls.csv")
MODEL_OUTPUT = os.path.join(os.path.dirname(__file__), "phishing_model.pkl")
SCALER_OUTPUT = os.path.join(os.path.dirname(__file__), "scaler.pkl")


def load_and_prepare_data(csv_path: str):
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} samples. Label distribution:\n{df['label'].value_counts()}\n")

    features_list = []
    labels = []
    for _, row in df.iterrows():
        try:
            feats = extract_features(str(row["url"]))
            features_list.append(features_to_vector(feats))
            labels.append(int(row["label"]))
        except Exception as e:
            print(f"Skipping row due to error: {e}")

    X = np.array(features_list)
    y = np.array(labels)
    return X, y


def train(csv_path: str = DATASET_PATH):
    X, y = load_and_prepare_data(csv_path)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Random Forest (primary model)
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train_scaled, y_train)

    y_pred = rf_model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)

    print("=" * 50)
    print(f"Random Forest Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Safe", "Phishing"]))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Cross-validation
    cv_scores = cross_val_score(rf_model, X_train_scaled, y_train, cv=5)
    print(f"\nCross-validation scores: {cv_scores}")
    print(f"Mean CV accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

    # Feature importance
    importances = rf_model.feature_importances_
    feat_importance = sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    print("\nTop 10 Feature Importances:")
    for name, imp in feat_importance[:10]:
        print(f"  {name}: {imp:.4f}")

    # Save model and scaler
    with open(MODEL_OUTPUT, "wb") as f:
        pickle.dump(rf_model, f)
    with open(SCALER_OUTPUT, "wb") as f:
        pickle.dump(scaler, f)

    print(f"\nModel saved to: {MODEL_OUTPUT}")
    print(f"Scaler saved to: {SCALER_OUTPUT}")
    return rf_model, scaler


if __name__ == "__main__":
    train()
