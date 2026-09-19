"use client";

import { useState, useTransition, useRef } from "react";
import { UserProfileData, updateUserProfile, uploadAvatar } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, CheckCircle2, AlertCircle, Loader2, ShieldCheck, User } from "lucide-react";
import Image from "next/image";

interface Props {
  initialProfile: UserProfileData;
}

export function AccountSettingsClient({ initialProfile }: Props) {
  const [profile, setProfile] = useState<UserProfileData>(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.full_name);
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(initialProfile.signedAvatarUrl);

  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await uploadAvatar(formData);
      if (res.signedAvatarUrl) {
        setAvatarPreview(res.signedAvatarUrl);
      }
      setMessage({ type: "success", text: "Avatar uploaded successfully to secure private storage" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to upload avatar" });
      setAvatarPreview(profile.signedAvatarUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        const res = await updateUserProfile({ full_name: fullName, phone });
        setMessage({ type: "success", text: res.message });
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Failed to update profile" });
      }
    });
  };

  const initials = (profile.full_name || "Admin")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-xl">
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Avatar Section */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Profile Picture
          </CardTitle>
          <CardDescription className="text-xs">
            Stored in private Supabase Storage with dynamic signed access URLs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 bg-primary/10 flex items-center justify-center font-bold text-xl text-primary shadow-xs">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={profile.full_name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 bg-slate-950/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                title="Change Avatar"
              >
                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>

            <div className="space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs font-semibold h-9"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Camera size={14} className="mr-1.5" /> Upload Photo
                  </>
                )}
              </Button>
              <p className="text-[11px] text-slate-400">JPG, PNG, or WEBP. Max 3MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Form */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Personal Information
          </CardTitle>
          <CardDescription className="text-xs">
            Manage your account details and contact preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contact Phone</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input
                type="email"
                value={profile.email}
                disabled
                className="h-10 text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400">Email is tied to your login identity and cannot be changed here.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assigned Role</Label>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <ShieldCheck size={16} className="text-primary" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {profile.role}
                </span>
                <span className="text-[10px] text-slate-400 ml-auto font-medium">Immutable system role</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending || isUploading}
              className="w-full sm:w-auto min-h-[42px] bg-primary hover:bg-primary/90 text-xs font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
