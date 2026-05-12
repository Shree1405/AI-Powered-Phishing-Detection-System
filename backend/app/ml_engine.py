"""
ML inference engine — loads the trained model and runs predictions.
Also contains the rule-based email phishing analyzer.
"""
import os
import re
import pickle
import sys
from typing import Tuple

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../ml-model"))
from feature_extractor import extract_features, features_to_vector

from app.config import ML_MODEL_PATH, SCALER_PATH

_model = None
_scaler = None


def load_model():
    global _model, _scaler
    if _model is None:
        with open(ML_MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
        with open(SCALER_PATH, "rb") as f:
            _scaler = pickle.load(f)
    return _model, _scaler


def predict_url(url: str) -> Tuple[str, float, int, dict]:
    """
    Returns (prediction, confidence, risk_score, features_dict)
    prediction: "Safe" | "Phishing"
    confidence: 0.0 – 1.0
    risk_score: 0 – 100
    """
    model, scaler = load_model()
    features = extract_features(url)
    vector = features_to_vector(features)
    scaled = scaler.transform([vector])

    proba = model.predict_proba(scaled)[0]  # [prob_safe, prob_phishing]
    phishing_prob = float(proba[1])
    prediction = "Phishing" if phishing_prob >= 0.5 else "Safe"
    confidence = phishing_prob if prediction == "Phishing" else float(proba[0])
    risk_score = int(phishing_prob * 100)

    return prediction, confidence, risk_score, features


# ── Email Analysis ─────────────────────────────────────────────────────────────

URGENCY_PATTERNS = [
    r"\burgent\b", r"\bimmediately\b", r"\bact now\b", r"\bexpires?\b",
    r"\blimited time\b", r"\bwithin \d+ hours?\b", r"\bdeadline\b",
    r"\bfinal notice\b", r"\blast chance\b", r"\bdo not ignore\b",
]

PHISHING_KEYWORDS_EMAIL = [
    "verify your account", "confirm your identity", "update your payment",
    "suspended", "unusual activity", "click here", "login to your account",
    "reset your password", "your account has been", "security alert",
    "bank account", "credit card", "social security", "ssn",
    "wire transfer", "western union", "gift card", "bitcoin",
    "you have won", "congratulations", "lottery", "inheritance",
    "nigerian prince", "unclaimed funds", "free money",
]

FAKE_LINK_PATTERNS = [
    r"http[s]?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",
    r"http[s]?://[^\s]*@[^\s]*",
    r"bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly",
]

SENSITIVE_DATA_REQUESTS = [
    r"\bpassword\b", r"\bpin\b", r"\bssn\b", r"\bsocial security\b",
    r"\bcredit card\b", r"\bbank account\b", r"\brouting number\b",
]


def analyze_email(content: str) -> Tuple[str, int, list, str]:
    """
    Returns (prediction, risk_percentage, detected_patterns, explanation)
    """
    text = content.lower()
    detected = []
    score = 0

    # Check urgency patterns
    for pattern in URGENCY_PATTERNS:
        if re.search(pattern, text):
            detected.append(f"Urgency language: '{pattern.strip(chr(92)+'b')}'")
            score += 10

    # Check phishing keywords
    for kw in PHISHING_KEYWORDS_EMAIL:
        if kw in text:
            detected.append(f"Phishing keyword: '{kw}'")
            score += 15

    # Check fake links
    for pattern in FAKE_LINK_PATTERNS:
        if re.search(pattern, text):
            detected.append("Suspicious URL pattern detected")
            score += 20

    # Check sensitive data requests
    for pattern in SENSITIVE_DATA_REQUESTS:
        if re.search(pattern, text):
            detected.append(f"Requests sensitive data: '{pattern.strip(chr(92)+'b')}'")
            score += 15

    # Grammar/spelling heuristic (excessive caps)
    caps_ratio = sum(1 for c in content if c.isupper()) / max(len(content), 1)
    if caps_ratio > 0.3:
        detected.append("Excessive capitalization (common in spam)")
        score += 10

    # Deduplicate and cap score
    detected = list(dict.fromkeys(detected))
    risk_percentage = min(score, 100)

    if risk_percentage >= 60:
        prediction = "Phishing"
    elif risk_percentage >= 30:
        prediction = "Suspicious"
    else:
        prediction = "Safe"

    if not detected:
        explanation = "No significant phishing indicators found. The email appears legitimate."
    else:
        explanation = (
            f"Detected {len(detected)} suspicious indicator(s). "
            f"Risk score: {risk_percentage}/100. "
            f"Key concerns: {', '.join(detected[:3])}."
        )

    return prediction, risk_percentage, detected, explanation
