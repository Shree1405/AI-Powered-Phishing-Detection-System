"""
URL Feature Extractor for Phishing Detection
Extracts numerical features from URLs for ML classification.
"""
import re
import math
from urllib.parse import urlparse


SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "secure", "account", "update", "banking",
    "paypal", "amazon", "ebay", "confirm", "password", "credential", "wallet",
    "free", "winner", "prize", "click", "urgent", "limited", "offer"
]


def has_ip_address(url: str) -> int:
    """Check if URL contains an IP address instead of domain."""
    pattern = r'(([01]?\d\d?|2[0-4]\d|25[0-5])\.){3}([01]?\d\d?|2[0-4]\d|25[0-5])'
    return 1 if re.search(pattern, url) else 0


def url_entropy(url: str) -> float:
    """Calculate Shannon entropy of URL (high entropy = more random = suspicious)."""
    if not url:
        return 0.0
    freq = {}
    for c in url:
        freq[c] = freq.get(c, 0) + 1
    length = len(url)
    return -sum((count / length) * math.log2(count / length) for count in freq.values())


def extract_features(url: str) -> dict:
    """Extract all features from a URL and return as a dict."""
    try:
        parsed = urlparse(url if url.startswith("http") else "http://" + url)
    except Exception:
        parsed = urlparse("")

    domain = parsed.netloc or ""
    path = parsed.path or ""
    full_url = url.lower()

    # Count suspicious keywords
    keyword_count = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in full_url)

    features = {
        "url_length": len(url),
        "domain_length": len(domain),
        "path_length": len(path),
        "has_https": 1 if parsed.scheme == "https" else 0,
        "has_ip": has_ip_address(url),
        "num_dots": url.count("."),
        "num_hyphens": url.count("-"),
        "num_underscores": url.count("_"),
        "num_slashes": url.count("/"),
        "num_question_marks": url.count("?"),
        "num_equals": url.count("="),
        "num_at_signs": url.count("@"),
        "num_ampersands": url.count("&"),
        "num_percent": url.count("%"),
        "num_subdomains": len(domain.split(".")) - 2 if domain else 0,
        "has_suspicious_keywords": 1 if keyword_count > 0 else 0,
        "suspicious_keyword_count": keyword_count,
        "url_entropy": round(url_entropy(url), 4),
        "has_port": 1 if parsed.port else 0,
        "has_fragment": 1 if parsed.fragment else 0,
        "has_query": 1 if parsed.query else 0,
        "double_slash_redirect": 1 if "//" in path else 0,
        "prefix_suffix_domain": 1 if "-" in domain else 0,
    }
    return features


def features_to_vector(features: dict) -> list:
    """Convert feature dict to ordered list for ML model input."""
    return list(features.values())


FEATURE_NAMES = list(extract_features("http://example.com").keys())
