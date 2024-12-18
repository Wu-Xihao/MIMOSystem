$(document).ready(function() {
  // 当点击登录按钮时触发
  $("#login-btn").click(function() {
    // 获取用户输入的账号、密码和身份信息
    var userID = $("#ID").val();
    var password = $("#Password").val();
    var level = $("#Level").val();

    // 进行简单的客户端验证（可根据需要扩展）
    if (!userID || !password) {
      alert("账号和密码不能为空！");
      return;
    }

    // 使用AJAX发送数据到后端
    $.ajax({
      url: 'http://localhost:5000/login',  // Flask后端的登录路由
      method: 'POST',
      contentType: 'application/json',  // 确保请求头为 JSON 格式
      data: JSON.stringify({
        userID: userID,
        password: password,
        level: level
      }),
      success: function(response) {
        if (response.success) {
          window.location.href = './user-index.html';  // 登录成功后跳转到主界面
          console.log(response.message)
        } else {
          alert(response.message);  // 登录失败，显示错误信息
        }
      },
      error: function(xhr, status, error) {
        alert("登录请求失败，请稍后再试！");
      }
    });
  });
});
