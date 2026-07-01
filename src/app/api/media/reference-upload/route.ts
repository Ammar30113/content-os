import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { validateImageUpload } from "@/lib/images/upload";

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const { supabase, user } = await requireApiUser();
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      throw new Error("Upload an image file.");
    }

    const validatedImage = await validateImageUpload(file);

    const storagePath = `${user.id}/references/reference-${Date.now()}.${validatedImage.extension}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(storagePath, validatedImage.buffer, {
        contentType: validatedImage.contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(storagePath);

    const imageUrl = publicUrlData.publicUrl;

    const { data: asset, error: mediaError } = await supabase
      .from("media_assets")
      .insert({
        user_id: user.id,
        post_id: null,
        storage_path: storagePath,
        public_url: imageUrl,
        source: "upload",
        prompt: "Reference image uploaded from idea intake.",
      })
      .select()
      .single();

    if (mediaError || !asset) {
      await supabase.storage.from("post-images").remove([storagePath]);
      throw new Error(mediaError?.message || "Could not save reference image.");
    }

    return jsonOk({ asset, image_url: imageUrl, storage_path: storagePath });
  } catch (error) {
    return jsonError(error, 400);
  }
}
