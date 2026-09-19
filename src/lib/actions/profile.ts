"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth, logAudit } from "./utils";
import { revalidatePath } from "next/cache";

export interface UserProfileData {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  avatar_path?: string;
  signedAvatarUrl?: string;
}

const ProfileUpdateSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phone: z.string().max(20).optional().nullable(),
});

export async function getCurrentUserProfile(): Promise<UserProfileData> {
  const { user } = await requireAuth();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, full_name, email, phone, status")
    .eq("id", user.id)
    .single();

  const metadata = user.user_metadata || {};
  const avatarPath = metadata.avatar_path || null;
  let signedAvatarUrl: string | undefined = undefined;

  if (avatarPath) {
    const { data: signedData } = await admin.storage
      .from("avatars")
      .createSignedUrl(avatarPath, 3600);
    signedAvatarUrl = signedData?.signedUrl;
  }

  return {
    id: user.id,
    email: user.email || profile?.email || "",
    full_name: profile?.full_name || metadata.full_name || "Admin",
    phone: profile?.phone || metadata.phone || "",
    role: profile?.role || metadata.role || "ADMIN",
    avatar_path: avatarPath,
    signedAvatarUrl,
  };
}

export async function updateUserProfile(data: { full_name: string; phone?: string | null }) {
  const { user } = await requireAuth();
  const admin = createAdminClient();

  const validated = ProfileUpdateSchema.parse(data);

  // Update profiles table - DO NOT update role or status
  await admin
    .from("profiles")
    .update({
      full_name: validated.full_name,
      phone: validated.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // Update auth metadata
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      full_name: validated.full_name,
      phone: validated.phone || null,
    },
  });

  await logAudit(null, user.id, "UPDATE", "PROFILE", user.id, {
    updated: { full_name: validated.full_name, phone: validated.phone },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/settings/account");
  return { success: true, message: "Profile updated successfully" };
}

export async function uploadAvatar(formData: FormData) {
  const { user } = await requireAuth();
  const admin = createAdminClient();

  const file = formData.get("avatar") as File;
  if (!file) {
    throw new Error("No image file provided");
  }

  // Validate file type and size (max 3MB)
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid image format. Allowed formats: JPEG, PNG, WEBP, GIF");
  }

  if (file.size > 3 * 1024 * 1024) {
    throw new Error("Image file size exceeds 3MB limit");
  }

  const ext = file.name.split(".").pop() || "png";
  const avatarPath = `${user.id}/avatar-${Date.now()}.${ext}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(avatarPath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Save avatar_path in user metadata
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      avatar_path: avatarPath,
    },
  });

  // Generate 1-hour signed URL for immediate display
  const { data: signedData } = await admin.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 3600);

  await logAudit(null, user.id, "UPLOAD", "AVATAR", user.id, {
    avatar_path: avatarPath,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings/account");

  return {
    success: true,
    avatarPath,
    signedAvatarUrl: signedData?.signedUrl,
  };
}
