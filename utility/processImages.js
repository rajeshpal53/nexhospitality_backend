const path = require("path");
const fs = require("fs");

/**
 * Generic image processor for update APIs
 *
 * @param {Object} params
 * @param {String} params.fieldName - request body field name (hotelImages, coverImages, etc.)
 * @param {Object} params.req - express request object
 * @param {Array} params.dbFieldValue - existing images from DB
 * baseUploadPath {String} - base assets directory
 *
 * @returns {Array} final merged image URLs
 */

const baseUploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../public/assets');

const processImages = async ({
  fieldName,
  req,
  dbFieldValue = []
}) => {


  let existingUrls = [];

  // 1 URLs user wants to keep
  const bodyField = req.body[fieldName];

  if (Array.isArray(bodyField)) {
    existingUrls = bodyField.filter((item) => typeof item === "string");
  } else if (typeof bodyField === "string") {
    existingUrls.push(bodyField);
  }

  // 2 Newly uploaded files
  const newUploadedUrls = req.savedFiles?.[fieldName] || [];

  // 3 Final merged list
  const finalUrls = [...existingUrls, ...newUploadedUrls];

  // 4 Delete removed images from disk
  const existingDbImages = Array.isArray(dbFieldValue) ? dbFieldValue : [];

  const imagesToDelete = existingDbImages.filter(
    (oldUrl) => !existingUrls.includes(oldUrl)
  );

  for (const imgPath of imagesToDelete) {
    const fullPath = path.join(
      baseUploadPath,
      imgPath.replace("assets/", "")
    );

    try {
      await fs.promises.access(fullPath);
      await fs.promises.unlink(fullPath);
      console.log(`Deleted image: ${fullPath}`);
    } catch (err) {
      console.error(`Failed to delete image: ${fullPath}`, err.message);
    }
  }

  return finalUrls;
};

/**
 * Delete uploaded images and remove empty folders
 *
 * @param {Array<string>} imageList - Array of image URLs stored in DB
 * baseUploadPath {String} - Base assets directory
 */
const deleteUploadedImages = async (imageList = []) => {
  if (!Array.isArray(imageList) || imageList.length === 0) return;

  const foldersToCheck = new Set();

  for (const relativePath of imageList) {
    if (typeof relativePath !== "string") continue;

    const fullPath = path.join(
      baseUploadPath,
      relativePath.replace("assets/", "")
    );

    const folderPath = path.dirname(fullPath);
    foldersToCheck.add(folderPath);

    try {
      await fs.promises.access(fullPath);
      await fs.promises.unlink(fullPath);
      console.log(`Deleted image: ${fullPath}`);
    } catch (err) {
      console.error(`Failed to delete image: ${fullPath}`, err.message);
    }
  }

  // Remove empty folders
  for (const folderPath of foldersToCheck) {
    try {
      const files = await fs.promises.readdir(folderPath);
      if (files.length === 0) {
        await fs.promises.rmdir(folderPath);
        console.log(`Deleted empty folder: ${folderPath}`);
      }
    } catch (err) {
      // Ignore folder delete errors safely
    }
  }
};

module.exports = {processImages, deleteUploadedImages};
