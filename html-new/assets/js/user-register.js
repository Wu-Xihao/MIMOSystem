// 注册按钮点击事件
document.getElementById("register-btn").addEventListener("click", submitForm);

function submitForm(event) {
  event.preventDefault();  // 防止表单默认提交

  // 获取表单数据
  const userID = document.getElementById("ID").value.trim();
  const userName = document.getElementById("Name").value.trim();
  const password = document.getElementById("Password").value.trim();
  const passwordAgain = document.getElementById("PasswordAgain").value.trim();
  const gender = document.getElementById("Gender").value;
  const level = document.getElementById("Level").value;
  const birth = document.getElementById("Birth").value;

  console.log(userID,userName,password,gender,level,birth)
  // 检查是否为空字段
  if (!userID || !userName || !password || !passwordAgain || !gender || !level || !birth) {
    alert("请填写所有字段！");
    return;
  }

  // 检查密码是否一致
  if (password !== passwordAgain) {
    alert("两次密码输入不一致！");
    return;
  }

  // 发送请求到后端
  const userData = {
    userID,
    userName,
    password,
    gender,
    level,
    birth
  };

  fetch('http://127.0.0.1:5000/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert("注册成功！");
      window.location.href = "./user-login.html";  // 注册成功后跳转到登录页面
    } else {
      alert("注册失败：" + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert("注册失败，请稍后再试！");
  });
}
