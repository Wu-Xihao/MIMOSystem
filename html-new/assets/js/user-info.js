// 获取用户信息并填充表单
document.addEventListener('DOMContentLoaded', function() {
    fetchUserInfo();

    // 编辑按钮事件绑定
    const editButton = document.getElementById("editButton");
    const infoForm = document.getElementById("infoForm");

    if (editButton) {
        editButton.addEventListener('click', enableEditing);
    }

    // 获取用户信息
    function fetchUserInfo() {
        fetch('http://127.0.0.1:5000/get_user_info', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')  // 如果有token的话
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const user = data.user;
                    document.getElementById('userID').value = user.userID;
                    document.getElementById('name').value = user.name;
                    document.getElementById('password').value = user.password;
                    document.getElementById('gender').value = user.gender;
                    document.getElementById('level').value = user.level;
                    const birthDate = new Date(user.birthDate);
                    const formattedBirthDate = birthDate.toISOString().split('T')[0]; // 获取 'YYYY-MM-DD' 格式的日期
                    document.getElementById('birth').value = formattedBirthDate;
                } else {
                    alert('获取用户信息失败: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching user info:', error);
                alert('请求用户信息失败');
            });
    }

    function enableEditing() {
      // 获取表单中的所有输入字段并启用它们
      const formElements = document.querySelectorAll("#infoForm input, #infoForm select, #infoForm button");
      formElements.forEach(element => {
        element.disabled = false;  // 启用表单字段
      });

      // 修改按钮文本为“保存”
      document.getElementById("editButton").innerText = "保存信息";
      document.getElementById("editButton").setAttribute("onclick", "disableEditing()");
      // document.getElementById("submit-info-btn").setAttribute("onclick", "submitForm()");
    }

});
function enableEditing() {
  // 获取表单中的所有输入字段并启用它们
  const formElements = document.querySelectorAll("#infoForm input, #infoForm select, #infoForm button");
  formElements.forEach(element => {
    element.disabled = false;  // 启用表单字段
  });

  // 修改按钮文本为“保存”
  document.getElementById("editButton").innerText = "保存信息";
  document.getElementById("editButton").setAttribute("onclick", "disableEditing()");
  document.getElementById("submit-info-btn").setAttribute("onclick", "submitForm()");
}
//
function submitForm() {
  const form = document.getElementById("infoForm");

  // 获取表单数据
  const formData = new FormData(form);

  // 将表单数据转化为对象
  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  // 发送 AJAX 请求到后端更新数据
  fetch('http://127.0.0.1:5000/update_user_info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert("信息更新成功！");

      // 如果更新成功，禁用编辑状态并恢复按钮文本
      disableEditing();
    } else {
      alert("信息更新失败: " + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert("更新失败，请稍后再试。");
  });
}

// 禁用编辑状态
function disableEditing() {
    const formElements = document.querySelectorAll("#infoForm input, #infoForm select, #infoForm button");
    formElements.forEach(element => {
        element.disabled = true;  // 禁用所有表单字段
    });

    // 修改按钮文字
    document.getElementById("editButton").innerText = "修改个人信息";
    document.getElementById("editButton").setAttribute("onclick", "enableEditing()");
}
