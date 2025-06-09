const bcrypt = require("bcryptjs");

/**
 * @description Generate a hash using bcryptjs
 * @param {*} field {fieldName: "value"}
 * @returns Generated hash
 */
module.exports = async (field = {}) => {
  // Generating salt in bcryp
  const fieldKeys = Object.keys(field);
  const fieldValues = Object.values(field);

  if (fieldKeys.length === 1) {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(fieldValues[0], salt);

    if (hash) {
      return {
        success: true,
        message: `Successfully hashed ${fieldKeys[0]}!`,
        hash,
      };
    } else {
      console.error("Error: ", `Unable to hash ${fieldKeys[0]}!`);
      return {
        success: false,
        message: `Unable to hash ${fieldKeys[0]}!`,
      };
    }
  } else {
    console.error(
      "Error: ",
      `${fieldKeys[0]} is not a valid input for generating hash. Needs to be a string\n
      Expected: {fieldName: "value"}
      `
    );
    return {
      success: false,
      message: `Internal Server Error!`,
    };
  }
};
