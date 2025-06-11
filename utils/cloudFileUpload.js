const randomstring = require("randomstring");
const AWS = require("aws-sdk");
const path = require("path");
const mime = require("mime-types"); // Optional, safer ContentType detection

//  Configure aws S3
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || "eu-north-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/**
 * Upload base64 image to S3
 * @description Upload Image - (Requires process.env.AWS_BUCKET_NAME)
 * @param {string} base64Image - base64 image string (e.g. "data:image/png;base64,...")
 * @param {object} options - optional config
 * @returns {Promise<{success: boolean, message: string, data: object|null}>}
 */
const uploadBase64ImageToS3 = async (
  base64Image,
  options = {
    ACL: "public-read",
    appendKey: "image-upload",
    region: "eu-north-1",
  }
) => {
  try {
    // Extract image type
    const matches = base64Image.match(/^data:image\/(\w+);base64,/);
    if (!matches) {
      throw new Error("Invalid base64 image format");
    }
    const fileType = matches[1];
    const base64Data = Buffer.from(
      base64Image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    // Generate unique filename
    const filename = `${randomstring.generate()}-${Date.now()}.${fileType}`;

    // Upload params
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${options.appendKey}/${filename}`,
      Body: base64Data,
      ACL: options.ACL,
      ContentEncoding: "base64",
      ContentType: `image/${fileType}`,
    };

    const uploadedFile = await s3.upload(params).promise();

    return {
      success: true,
      message: "Successfully uploaded your image!",
      data: uploadedFile,
    };
  } catch (err) {
    console.error("Upload error:", err);
    return {
      success: false,
      message: "Unable to complete upload (Could be network)!",
      data: null,
    };
  }
};

/**
 * Upload file buffer (from multer or similar) to S3
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original file name (e.g. image.jpg)
 * @param {string} folder - Folder in bucket (e.g. images, audio, videos)
 * @param {object} options - Optional: ACL, ContentType
 * @returns S3 upload result
 */
const uploadFileToS3 = async (buffer, originalName, folder, options = {}) => {
  const ext = path.extname(originalName).toLowerCase().slice(1); // "jpg", "mp4", etc.
  const contentType =
    options.ContentType ||
    mime.lookup(originalName) ||
    "application/octet-stream";
  const filename = `${randomstring.generate()}-${Date.now()}.${ext}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folder}/${filename}`,
    Body: buffer,
    ACL: options.ACL || "public-read",
    ContentType: contentType,
  };

  try {
    const uploaded = await s3.upload(params).promise();
    return {
      success: true,
      message: `Uploaded ${folder} file successfully.`,
      data: uploaded,
    };
  } catch (err) {
    console.error("S3 Upload Error:", err);
    return {
      success: false,
      message: "Upload failed.",
      data: null,
    };
  }
};

const uploadImage = async (file) => {
  return uploadFileToS3(file.buffer, file.originalname, "images");
};

const uploadVideo = async (file) => {
  return uploadFileToS3(file.buffer, file.originalname, "videos");
};

const uploadAudio = async (file) => {
  return uploadFileToS3(file.buffer, file.originalname, "audio");
};

/**
 * Deletes a file from AWS S3
 * @param {Object} image - Must contain { Key: string, VersionId?: string }
 */
const deleteFile = async (image) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: image.Key,
  };

  if (image.VersionId) {
    params.VersionId = image.VersionId;
  }

  try {
    await s3.deleteObject(params).promise();
    return {
      success: true,
      message: "Successfully deleted file!",
      data: null,
    };
  } catch (err) {
    console.error("S3 delete error:", err);
    return {
      success: false,
      message: "Failed to delete file!",
      data: null,
    };
  }
};

const deleteMultipleFiles = async (keys = []) => {
  if (!keys.length) {
    return { success: false, message: "No keys provided.", data: null };
  }

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
      Quiet: false,
    },
  };

  try {
    const result = await s3.deleteObjects(params).promise();
    return {
      success: true,
      message: "Files deleted successfully.",
      data: result,
    };
  } catch (err) {
    console.error("S3 deleteObjects error:", err);
    return {
      success: false,
      message: "Failed to delete files.",
      data: null,
    };
  }
};

/**
 * Delete all files under a specific folder/prefix
 * @param {string} prefix - e.g., "images/user123/"
 */
const deleteAllFilesInFolder = async (prefix) => {
  try {
    const listParams = {
      Bucket: process.env.BUCKET_NAME,
      Prefix: prefix,
    };

    const listedObjects = await s3.listObjectsV2(listParams).promise();

    if (!listedObjects.Contents.length) {
      return {
        success: false,
        message: "No files found under prefix.",
        data: null,
      };
    }

    const keysToDelete = listedObjects.Contents.map((obj) => ({
      Key: obj.Key,
    }));

    const deleteParams = {
      Bucket: process.env.BUCKET_NAME,
      Delete: {
        Objects: keysToDelete,
      },
    };

    const deleteResult = await s3.deleteObjects(deleteParams).promise();

    return {
      success: true,
      message: `Deleted ${deleteResult.Deleted.length} files.`,
      data: deleteResult,
    };
  } catch (err) {
    console.error("Error deleting folder files:", err);
    return {
      success: false,
      message: "Failed to delete files under prefix.",
      data: null,
    };
  }
};

module.exports = {
  uploadBase64ImageToS3,
  uploadImage,
  uploadVideo,
  uploadAudio,
  deleteFile,
  deleteMultipleFiles,
  deleteAllFilesInFolder,
};
