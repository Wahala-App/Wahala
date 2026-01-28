import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../lib/server/amazonS3Config";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Generate a presigned URL for direct client upload to S3
 * @param fileName - Original file name
 * @param fileType - MIME type of the file
 * @param folder - Folder path in S3
 * @returns Object containing presigned URL and final file URL
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  fileType: string,
  folder: string = 'evidence'
): Promise<{ uploadUrl: string; fileUrl: string; fileKey: string }> {
  try {
    // Generate unique filename
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;

    // Create the command for putting an object
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
    });

    // Generate presigned URL (valid for 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Construct the final public URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

    return {
      uploadUrl,
      fileUrl,
      fileKey: uniqueFileName,
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
}

/**
 * Generate a presigned URL for viewing/downloading a file from S3
 * @param fileUrl - The full S3 URL of the file (or just the key)
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Presigned URL for accessing the file
 */
export async function generatePresignedViewUrl(
  fileUrl: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    // Extract the key from the URL
    let key: string;
    try {
      const url = new URL(fileUrl);
      key = url.pathname.substring(1); // Remove leading '/'
    } catch {
      // If it's not a full URL, assume it's already a key
      key = fileUrl;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error('Error generating presigned view URL:', error);
    throw new Error('Failed to generate presigned view URL');
  }
}

/**
 * Delete a file from S3
 * @param fileUrl - The full URL of the file to delete
 */
export async function deleteFileFromS3(fileUrl: string): Promise<void> {
  try {
    // Extract the key from the URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading '/'

    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(deleteCommand);
    console.log(`File deleted successfully: ${key}`);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
}

export { s3Client, BUCKET_NAME };