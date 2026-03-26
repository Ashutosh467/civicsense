import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadPhoto = async (req, res) => {
  try {
    const { photo, complaintId } = req.body;

    if (!photo) {
      return res.status(400).json({ error: "No photo provided" });
    }

    // Upload base64 directly to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(photo, {
      folder: "civicsense/resolutions",
      public_id: `resolution_${complaintId}_${Date.now()}`,
      resource_type: "image",
      transformation: [
        { width: 1200, height: 900, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    });

    res.status(200).json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: error.message });
  }
};
