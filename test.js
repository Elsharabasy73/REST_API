const yup = require("yup");

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

const userInput = {
  email: "s",
  password: "short",
};

const errors1 = [];
schema
  .validate(userInput, { abortEarly: false })
  .then(() => {
    console.log("Input is valid");
  })
  .catch((errors) => {
    console.log("Input is invalid:");
    errors.inner.forEach((error) => {
      errors1.push(error.path);
      console.log(`- ${error.path}: ${error.message}`);
    });
    console.log("errs:", errors1);
  });
