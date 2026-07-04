import { app } from "./app.js";
import { assertDatabaseConnection } from "./config/db.js";

const port = Number(process.env.PORT || 5000);

assertDatabaseConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    if (error.message.includes("auth_gssapi_client")) {
      console.error(
        "Run database/create_app_user.sql in MySQL Workbench or HeidiSQL, then restart the backend."
      );
      console.error(
        "This forces the etms_user account to use mysql_native_password instead of Windows/GSSAPI authentication."
      );
    }
    process.exit(1);
  });
