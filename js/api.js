function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return output({
        success: false,
        message: "No payload"
      });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    let result;

    switch (action) {
      case "teacherLogin":
        result = teacherLogin_(payload);
        break;

      case "teacherRegister":
        result = teacherRegister_(payload);
        break;

      case "studentLogin":
        result = studentLogin_(payload);
        break;

      // 👉 เพิ่ม action อื่นตรงนี้
      default:
        result = {
          success: false,
          message: "Unknown action: " + action
        };
    }

    return output(result);

  } catch (err) {
    return output({
      success: false,
      message: err.message
    });
  }
}
