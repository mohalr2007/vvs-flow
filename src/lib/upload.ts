import { supabase } from "@/integrations/supabase/client";
import { createPhotoUpload } from "./public.functions";

export async function uploadPhoto(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("Photo is larger than 10 MB.");
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const safe = (["jpg", "jpeg", "png", "webp", "heic"].includes(ext) ? ext : "jpg") as "jpg";
  const { path, token } = await createPhotoUpload({ data: { ext: safe } });
  const { error } = await supabase.storage.from("job-photos").uploadToSignedUrl(path, token, file, { contentType: file.type || "image/jpeg" });
  if (error) throw new Error("Photo upload failed. Try again or continue without a photo.");
  return path;
}
