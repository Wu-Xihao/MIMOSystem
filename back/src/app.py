from flask import Flask, request, jsonify, session, redirect, url_for, render_template
from flask_cors import CORS
import mysql.connector
import bcrypt

app = Flask(__name__)
app.secret_key = '123456'

id = None

# 启用 CORS，允许所有来源访问（可以根据需要修改）
CORS(app, origins=["http://localhost:63342"])

# 数据库连接配置
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '041001',  # 修改为你的数据库密码
    'database': 'MIMODB'
}

def get_db_connection():
    connection = mysql.connector.connect(**db_config)
    return connection


@app.route('/register', methods=['POST'])
def register():
    # 获取请求中的 JSON 数据
    data = request.get_json()

    # 获取用户输入的字段
    user_id = data.get("userID")
    user_name = data.get("userName")
    password = data.get("password")
    gender = data.get("gender")
    level = data.get("level")
    birth = data.get("birth")

    # print([user_id, user_name, password, gender, level, birth])
    # 检查是否有为空的字段
    if not all([user_id, user_name, password, gender, level, birth]):
        return jsonify({"success": False, "message": "请填写所有字段！"}), 400

    # 连接数据库并检查是否有重复的 userID
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM User WHERE userID = %s", (user_id,))
    existing_user = cursor.fetchone()

    if existing_user:
        return jsonify({"success": False, "message": "该用户ID已存在！"}), 400

    # 密码加密
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # 插入新用户到数据库
    try:
        cursor.execute(
            "INSERT INTO User (userID, name, pwd, gender, level, birthDate) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, user_name, hashed_password, gender, level, birth)
        )
        conn.commit()

        return jsonify({"success": True, "message": "注册成功！"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": f"注册失败：{str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

# 登录接口
@app.route('/login', methods=['POST'])
def login():
    # 获取前端传来的 JSON 数据
    data = request.get_json()

    userID = data.get('userID')
    password = data.get('password')
    level = data.get('level')

    # 创建数据库连接
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 查询 LoginView 视图
    query = """
        SELECT userID, pwd, level 
        FROM LoginView
        WHERE userID = %s AND level = %s
        """
    cursor.execute(query, (userID, level))
    user = cursor.fetchone()

    # 关闭连接
    cursor.close()
    conn.close()

    if user:
        # 使用 bcrypt 验证密码
        try:
            if bcrypt.checkpw(password.encode('utf-8'), user['pwd'].encode('utf-8')):
                # 登录成功，存储 userID 到会话
                session['userID'] = user['userID']
                session['level'] = user['level']
                global id
                id = user['userID']
                # print(session['userID'])
                print("用户已登录")
                return jsonify({'success': True, 'message': '登录成功'})
            else:
                return jsonify({'success': False, 'message': '密码错误'})
        except ValueError as e:
            return jsonify({'success': False, 'message': '密码格式错误'})
    else:
        return jsonify({'success': False, 'message': '账号或身份错误'})

# 获取用户信息
@app.route('/get_user_info', methods=['GET'])
def get_user_info():
    # user_id = session.get('userID')  # 获取当前用户的ID
    global id
    user_id = id

    if not user_id:
        return jsonify({'success': False, 'message': '用户未登录'}), 401

    # 获取用户信息
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT * FROM User WHERE userID = %s', (user_id,))
    user = cursor.fetchone()
    # print(user)
    cursor.close()
    connection.close()

    if user:
        return jsonify({'success': True, 'user': user})
    else:
        return jsonify({'success': False, 'message': '用户信息未找到'}), 404


@app.route('/update_user_info', methods=['POST'])
def update_user_info():
    global id
    user_id = id
    if not user_id:
        return jsonify({'success': False, 'message': '请先登录'})  # 如果没有登录，返回错误信息

    data = request.get_json()  # 获取 JSON 数据
    name = data.get('name')
    password = data.get('password')
    gender = data.get('gender')
    level = data.get('level')
    birth = data.get('birth')

    # 对密码进行 bcrypt 加密
    if password:
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    else:
        hashed_password = None

    # 更新数据库
    connection = get_db_connection()
    cursor = connection.cursor()

    if hashed_password:
        cursor.execute(''' 
            UPDATE User
            SET name = %s, pwd = %s, gender = %s, level = %s, birthDate = %s
            WHERE userID = %s
        ''', (name, hashed_password, gender, level, birth, user_id))
    else:
        cursor.execute(''' 
            UPDATE User
            SET name = %s, gender = %s, level = %s, birthDate = %s
            WHERE userID = %s
        ''', (name, gender, level, birth, user_id))

    connection.commit()
    cursor.close()
    connection.close()

    return jsonify({'success': True})  # 返回更新成功的响应

# 获取门诊记录详情及相关化验单信息
@app.route('/get_record_details/<int:record_id>', methods=['GET'])
def get_record_details(record_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 获取门诊记录信息
    cursor.execute("SELECT * FROM Record WHERE recordID = %s", (record_id,))
    record = cursor.fetchone()

    if record:
        # 获取关联的化验单信息（如果有）
        paper_details = None
        if record['paperID']:
            cursor.execute("SELECT * FROM Paper WHERE paperID = %s", (record['paperID'],))
            paper_details = cursor.fetchone()

        conn.close()

        # 返回门诊记录和化验单信息（如果有）
        return jsonify({
            "success": True,
            "record": record,
            "paper": paper_details if paper_details else None  # 返回化验单信息，若存在
        })
    else:
        conn.close()
        return jsonify({"success": False, "message": "未找到该门诊记录"}), 404

if __name__ == '__main__':
    app.run(debug=True)
