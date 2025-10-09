import { supabase } from "@/integrations/supabase/client";

// add new property
export const addNewProperty = async (property) => {
  const { data, error } = await supabase.from("property").insert(property);
  if (error) {
    console.log(error);
    throw new Error(error.message);
  }
  return { data };
};

// Upload files
export const uploadFileWithMetadata = async ({ file, id, metadata }) => {
  const filePath = `${id}/${file.name}`; // path in the bucket

  const { data, error } = await supabase.storage
    .from("user-docs")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      metadata, // send metadata here
    });

  if (error) throw error;
  return data;
};

// Fetch files with metadata
export const listFilesWithMetadata = async (id) => {
  // 1️⃣ List all files inside the user's folder
  const { data: files, error } = await supabase.storage
    .from("user-docs")
    .list(id);

  if (error) throw error;

  // 2️⃣ Fetch metadata + public URL for each file
  const filesWithMetadata = await Promise.all(
    files.map(async (file) => {
      const filePath = `${id}/${file.name}`;
      const storage = supabase.storage.from("user-docs");

      // Get metadata
      const { data: metadata, error: metaError } = await storage.info(filePath);
      if (metaError) {
        console.error(
          `Metadata fetch failed for ${file.name}:`,
          metaError.message
        );
      }

      // Get public URL
      const { data: publicUrlData } = storage.getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;

      return {
        ...file,
        metadata: metadata || null,
        publicUrl,
      };
    })
  );

  return filesWithMetadata;
};

export const deleteFile = async ({ id, fileName }) => {
  const filePath = `${id}/${fileName}`;
  console.log(filePath);

  const { data, error } = await supabase.storage
    .from("user-docs")
    .remove([filePath]); // remove() expects an array of file paths

  if (error) {
    console.error(`Failed to delete file ${fileName}:`, error.message);
    return false;
  }

  return true;
};
