import os
from flask import Flask, jsonify, request
from dotenv import load_dotenv
# Nếu bạn dùng supabase-py:
# from supabase import create_client, Client

load_dotenv()

app = Flask(__name__)

# Route mặc định để kiểm tra server
@app.route('/')
def index():
    return jsonify({
        "status": "success",
        "message": "Hệ thống Quản lý Điện Nước đã sẵn sàng!"
    })

# Ví dụ một API lấy danh sách hóa đơn
@app.route('/api/bills', methods=['GET'])
def get_bills():
    # Logic lấy dữ liệu từ Supabase sẽ nằm ở đây
    return jsonify({"data": []})

if __name__ == '__main__':
    app.run(debug=True)