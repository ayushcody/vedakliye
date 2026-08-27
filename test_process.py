import requests
import base64

def to_b64(path):
    with open(path, "rb") as f:
        return "data:application/pdf;base64," + base64.b64encode(f.read()).decode()

req = {
    "questionPaperPages": [to_b64("Question_Paper.pdf")],
    "answerSheetPages": [to_b64("Answer_Sheet.pdf")]
}

print("Sending request...")
try:
    res = requests.post("http://127.0.0.1:8000/process", json=req, timeout=1200)
    print("Status code:", res.status_code)
    print("Response length:", len(res.text))
    if res.status_code != 200:
        print("Error response:", res.text)
except Exception as e:
    print("Exception:", e)
