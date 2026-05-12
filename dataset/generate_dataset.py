"""
Generate a sample phishing URL dataset for training.
In production, use real datasets like:
- UCI Phishing Websites Dataset
- PhishTank dataset
- ISCX URL dataset
"""
import csv
import random
import string

PHISHING_KEYWORDS = ["login", "verify", "secure", "account", "update", "banking", "paypal", "amazon", "ebay", "signin"]
LEGIT_DOMAINS = ["google.com", "github.com", "stackoverflow.com", "wikipedia.org", "microsoft.com", "apple.com"]

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

def generate_phishing_url():
    keyword = random.choice(PHISHING_KEYWORDS)
    tld = random.choice([".com", ".net", ".org", ".info", ".xyz"])
    patterns = [
        f"http://{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}/{keyword}",
        f"http://{keyword}-{random_string()}{tld}/{random_string()}?redirect=true&token={random_string(16)}",
        f"http://{random_string()}.{keyword}.{random_string()}{tld}/login/verify",
        f"http://{keyword}.{random_string()}-secure{tld}/account/update",
        f"http://{random_string()}{tld}/{keyword}@{random_string()}.com",
    ]
    return random.choice(patterns)

def generate_legit_url():
    domain = random.choice(LEGIT_DOMAINS)
    paths = ["", "/about", "/docs", "/search?q=python", "/wiki/Python", "/questions/tagged/python"]
    return f"https://{domain}{random.choice(paths)}"

rows = []
for _ in range(500):
    rows.append({"url": generate_phishing_url(), "label": 1})
for _ in range(500):
    rows.append({"url": generate_legit_url(), "label": 0})

random.shuffle(rows)

with open("phishing-detector/dataset/urls.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["url", "label"])
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows)} samples -> dataset/urls.csv")
