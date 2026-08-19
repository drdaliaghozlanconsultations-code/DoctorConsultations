import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dav62k1fk',
  api_key: process.env.CLOUDINARY_API_KEY || '999711225793796',
  api_secret: process.env.CLOUDINARY_API_SECRET || '5KGA_x_PyVtgCaD9kRKk_04-Vkc',
  secure: true,
})

export interface CloudinaryUploadResult {
  url: string
  secure_url: string
  public_id: string
  format: string
  bytes: number
}

export async function uploadReceiptBuffer(
  buffer: Buffer,
  folder = 'drdalia/receipts',
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'))
        } else {
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
          })
        }
      },
    )
    uploadStream.end(buffer)
  })
}

export default cloudinary
