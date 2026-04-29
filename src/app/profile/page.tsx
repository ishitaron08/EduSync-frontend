"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequireAuth } from "@/lib/authGuard";
import { changePasswordSchema, profileUpdateSchema } from "@/lib/schemas";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProfilePage() {
  const allowed = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const changePassword = useAuthStore((s) => s.changePassword);

  const [profileDraft, setProfileDraft] = useState<{ name: string; phone: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const name = profileDraft?.name ?? user?.name ?? "";
  const phone = profileDraft?.phone ?? user?.phone ?? "";

  if (!allowed) {
    return (
      <main className="p-6">
        <div className="nc-skeleton h-10 w-40 rounded-[8px]" />
      </main>
    );
  }

  const onProfileSave = async () => {
    setProfileError(null);
    setProfileMessage(null);
    const parsed = profileUpdateSchema.safeParse({ name, phone });
    if (!parsed.success) {
      setProfileError(parsed.error.issues[0]?.message ?? "Invalid profile data");
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({
        name: parsed.data.name,
        phone: parsed.data.phone.trim() ? parsed.data.phone.trim() : null
      });
      setProfileDraft(null);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const onPasswordSave = async () => {
    setPasswordError(null);
    setPasswordMessage(null);
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword
    });
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Invalid password data");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(parsed.data);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--text-primary)]">Profile</h1>
      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-medium text-[var(--text-primary)]">Profile information</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) =>
                setProfileDraft((prev) => ({
                  name: event.target.value,
                  phone: prev?.phone ?? phone
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(event) =>
                setProfileDraft((prev) => ({
                  name: prev?.name ?? name,
                  phone: event.target.value
                }))
              }
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
        {profileError ? <p className="text-sm text-[var(--accent-danger)]">{profileError}</p> : null}
        {profileMessage ? <p className="text-sm text-[var(--accent-success)]">{profileMessage}</p> : null}
        <Button onClick={onProfileSave} disabled={profileSaving}>
          {profileSaving ? "Saving..." : "Save profile"}
        </Button>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-lg font-medium text-[var(--text-primary)]">Change password</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </div>
        {passwordError ? <p className="text-sm text-[var(--accent-danger)]">{passwordError}</p> : null}
        {passwordMessage ? <p className="text-sm text-[var(--accent-success)]">{passwordMessage}</p> : null}
        <Button onClick={onPasswordSave} disabled={passwordSaving}>
          {passwordSaving ? "Updating..." : "Change password"}
        </Button>
      </Card>
    </main>
  );
}
