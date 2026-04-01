from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        "status": "success",
        "message": "Hệ thống Quản lý Điện Nước đã sẵn sàng!"
    })

@app.route('/api/bills', methods=['GET'])
def get_bills():
    return jsonify({"data": []})

# 👇 QUAN TRỌNG
def handler(request):
    return app(request.environ, lambda *args: None)