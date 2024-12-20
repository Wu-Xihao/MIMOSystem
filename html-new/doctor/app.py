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
    'password': '123456',  # 修改为你的数据库密码
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
        return jsonify({'success': False, 'message': 'No login'}), 401

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


@app.route('/get_all_papers', methods=['GET'])
def get_all_papers():
    # 创建数据库连接
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # 查询所有化验单信息
        cursor.execute('SELECT * FROM paper')
        papers = cursor.fetchall()
        
        return jsonify({'success': True, 'papers': papers})
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取化验单信息失败：{str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()


@app.route('/delete_paper/<int:paper_id>', methods=['DELETE'])
def delete_paper(paper_id):
    # 创建数据库连接
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # 删除指定ID的化验单
        cursor.execute('DELETE FROM paper WHERE paperID = %s', (paper_id,))
        connection.commit()
        
        if cursor.rowcount > 0:
            return jsonify({'success': True, 'message': '删除成功'})
        else:
            return jsonify({'success': False, 'message': '未找到该化验单'}), 404
            
    except Exception as e:
        connection.rollback()
        return jsonify({'success': False, 'message': f'删除失败：{str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()


@app.route('/add_paper', methods=['POST'])
def add_paper():
    # 创建数据库连接
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # 获取请求数据
        paper_data = request.json
        
        # 准备SQL语句
        sql = '''
            INSERT INTO paper (RBC, WBC, BASON, LYMPHN, HGB, PLT, MONON, EON, NEUT)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        '''
        values = (
            paper_data['RBC'],
            paper_data['WBC'],
            paper_data['BASON'],
            paper_data['LYMPHN'],
            paper_data['HGB'],
            paper_data['PLT'],
            paper_data['MONON'],
            paper_data['EON'],
            paper_data['NEUT']
        )
        
        # 执行插入操作
        cursor.execute(sql, values)
        connection.commit()
        
        # 获取新插入的ID
        new_paper_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': '添加成功',
            'paperID': new_paper_id
        })
        
    except Exception as e:
        connection.rollback()
        return jsonify({'success': False, 'message': f'添加失败：{str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()


@app.route('/get_all_records', methods=['GET'])
def get_all_records():
    # 创建数据库连接
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # 查询门诊记录表，联合User表获取病人和医生姓名
        cursor.execute('''
            SELECT 
                r.recordID,
                r.patientID,
                r.doctorID,
                r.paperID,
                r.createDate,
                r.status,
                p.name as patientName,
                d.name as doctorName
            FROM Record r
            JOIN User p ON r.patientID = p.userID
            JOIN User d ON r.doctorID = d.userID
            ORDER BY r.createDate DESC
        ''')
        records = cursor.fetchall()
        
        # 格式化日期为字符串
        for record in records:
            record['createDate'] = record['createDate'].strftime('%Y-%m-%d')
        
        return jsonify({'success': True, 'records': records})
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取门诊记录失败：{str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()


@app.route('/add_record', methods=['POST'])
def add_record():
    # 创建数据库连接
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # 获取请求数据
        record_data = request.json
        
        # 准备SQL语句
        sql = '''
            INSERT INTO Record (patientID, doctorID, paperID, createDate, status)
            VALUES (%s, %s, %s, %s, %s)
        '''
        values = (
            record_data['patientID'],
            record_data['doctorID'],
            record_data.get('paperID'),  # 可以为空
            record_data['createDate'],
            record_data['status']
        )
        
        # 执行插入操作
        cursor.execute(sql, values)
        connection.commit()
        
        # 获取新插入的ID
        new_record_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': '添加成功',
            'recordID': new_record_id
        })
        
    except Exception as e:
        connection.rollback()
        return jsonify({'success': False, 'message': f'添加失败：{str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()


@app.route('/delete_record/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    # 创建数据库连接
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # 删除指定ID的门诊记录
        cursor.execute('DELETE FROM Record WHERE recordID = %s', (record_id,))
        connection.commit()
        
        if cursor.rowcount > 0:
            return jsonify({'success': True, 'message': '删除成功'})
        else:
            return jsonify({'success': False, 'message': '未找到该门诊记录'}), 404
            
    except Exception as e:
        connection.rollback()
        return jsonify({'success': False, 'message': f'删除失败：{str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()


@app.route('/update_record/<int:record_id>', methods=['PUT'])
def update_record(record_id):
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        record_data = request.json
        
        sql = '''
            UPDATE Record 
            SET patientID = %s, 
                doctorID = %s, 
                paperID = %s, 
                createDate = %s, 
                status = %s
            WHERE recordID = %s
        '''
        values = (
            record_data['patientID'],
            record_data['doctorID'],
            record_data.get('paperID'),
            record_data['createDate'],
            record_data['status'],
            record_id
        )
        
        cursor.execute(sql, values)
        connection.commit()
        
        if cursor.rowcount > 0:
            return jsonify({'success': True, 'message': '更新成功'})
        else:
            return jsonify({'success': False, 'message': '未找到该门诊记录'}), 404
            
    except Exception as e:
        connection.rollback()
        return jsonify({'success': False, 'message': f'更新失败：{str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()


@app.route('/get_all_drug_records', methods=['GET'])
def get_all_drug_records():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # 联表查询获取完整的药品记录信息
        cursor.execute('''
            SELECT 
                rd.recordDrugID,
                rd.recordID,
                rd.drugID,
                rd.quantity,
                d.name as drugName,
                d.description as drugDescription,
                r.createDate,
                u.name as patientName
            FROM recordDrug rd
            JOIN Drug d ON rd.drugID = d.drugID
            JOIN Record r ON rd.recordID = r.recordID
            JOIN User u ON r.patientID = u.userID
            ORDER BY r.createDate DESC
        ''')
        
        records = cursor.fetchall()
        
        # 格式化日期
        for record in records:
            record['createDate'] = record['createDate'].strftime('%Y-%m-%d')
            
        return jsonify({'success': True, 'records': records})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取药品记录失败：{str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/get_all_drugs', methods=['GET'])
def get_all_drugs():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute('SELECT * FROM Drug')
        drugs = cursor.fetchall()
        return jsonify({'success': True, 'drugs': drugs})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取药品列表失败：{str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/add_drug_record', methods=['POST'])
def add_drug_record():
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        # 获取请求数据
        drug_record = request.json
        
        # 验证记录是否存在且状态为"待开药"
        cursor.execute('SELECT status FROM Record WHERE recordID = %s', (drug_record['recordID'],))
        record = cursor.fetchone()
        
        if not record:
            return jsonify({'success': False, 'message': '未找到该门诊记录'}), 404
        
        if record[0] != '待开药':
            return jsonify({'success': False, 'message': '该门诊记录已结束，无法开具药品'}), 400
        
        # 验证药品是否存在
        cursor.execute('SELECT drugID FROM Drug WHERE drugID = %s', (drug_record['drugID'],))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': '未找到该药品'}), 404
        
        # 插入药品记录
        cursor.execute('''
            INSERT INTO recordDrug (recordID, drugID, quantity)
            VALUES (%s, %s, %s)
        ''', (drug_record['recordID'], drug_record['drugID'], drug_record['quantity']))
        
        # 如果需要，更新门诊记录状态为"结束"
        if drug_record.get('completeRecord'):
            cursor.execute('''
                UPDATE Record 
                SET status = '结束'
                WHERE recordID = %s
            ''', (drug_record['recordID'],))
        
        connection.commit()
        
        return jsonify({
            'success': True,
            'message': '药品开具成功',
            'recordDrugID': cursor.lastrowid
        })
        
    except Exception as e:
        connection.rollback()
        return jsonify({'success': False, 'message': f'开具药品失败：{str(e)}'}), 500
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    app.run(debug=True)
