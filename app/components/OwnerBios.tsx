"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // ✅ ensure you have this client
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Users,
  Trophy,
  Calendar,
  MapPin,
  Star,
  Edit,
  Save,
  X,
  Upload,
  ImageIcon,
} from "lucide-react";

interface OwnerBio {
  id: string;
  name: string;
  years_in_league: number;
  championships: number;
  playoff_appearances: number;
  favorite_player: string;
  best_finish: string;
  about: string;
  story_behind_name: string;
  fun_fact: string;
  current_location: string;
  profile_picture_url: string;
  team_name?: string;
}

export default function OwnerBios() {
  const [owners, setOwners] = useState<OwnerBio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingOwner, setEditingOwner] = useState<OwnerBio | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- Fetch Owners ---
  useEffect(() => {
    fetchOwnerData();
  }, []);

  async function fetchOwnerData() {
    try {
      const res = await fetch(
        `/api/supabase-proxy?path=owners?select=id,name,years_in_league,championships,playoff_appearances,favorite_player,best_finish,about,story_behind_name,fun_fact,current_location,profile_picture_url,teams:teams_owner_id_fkey(name)&order=name.asc`
      );

      if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
      const data = await res.json();

      const formatted = (data || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        years_in_league: o.years_in_league ?? 0,
        championships: o.championships ?? 0,
        playoff_appearances: o.playoff_appearances ?? 0,
        favorite_player: o.favorite_player ?? "Unassigned",
        best_finish: o.best_finish ?? "",
        about: o.about ?? "",
        story_behind_name: o.story_behind_name ?? "",
        fun_fact: o.fun_fact ?? "",
        current_location: o.current_location ?? "",
        profile_picture_url: o.profile_picture_url ?? "",
        team_name:
          Array.isArray(o.teams) && o.teams.length > 0
            ? o.teams[0].name
            : o.teams?.name ?? "Unassigned",
      }));

      setOwners(formatted);
    } catch (err: any) {
      console.error("Fetch owners error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Upload Profile Picture to Supabase ---
  async function handleFileUpload(file: File, ownerId: string) {
    try {
      setUploading(true);

      const ext = file.name.split(".").pop();
      const filePath = `owner_${ownerId}.${ext}`;

      // Upload to bucket "owner-avatars"
      const { error: uploadError } = await supabase.storage
        .from("owner-avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("owner-avatars")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error("Failed to get public URL.");

      // Update local editingOwner with new image URL
      setEditingOwner((prev) =>
        prev ? { ...prev, profile_picture_url: urlData.publicUrl } : prev
      );
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  // --- Save Updates to Supabase via proxy ---
  async function handleSave() {
    if (!editingOwner) return;
    setSaving(true);
    try {
      const res = await fetch("/api/supabase-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "owners",
          action: "update",
          data: {
            years_in_league: editingOwner.years_in_league,
            championships: editingOwner.championships,
            playoff_appearances: editingOwner.playoff_appearances,
            favorite_player: editingOwner.favorite_player,
            best_finish: editingOwner.best_finish,
            about: editingOwner.about,
            story_behind_name: editingOwner.story_behind_name,
            fun_fact: editingOwner.fun_fact,
            current_location: editingOwner.current_location,
            profile_picture_url: editingOwner.profile_picture_url,
          },
          match: { id: editingOwner.id },
        }),
      });

      if (!res.ok) throw new Error(`Save failed: ${res.statusText}`);
      await fetchOwnerData();
      setEditingOwner(null);
    } catch (err: any) {
      console.error("Save error:", err);
      alert(`Error saving changes: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-gray-500">Loading owner bios...</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-green-500">
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-green-600" />
            Owner Biographies
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Meet the personalities behind each team
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {owners.map((owner) => (
          <Card key={owner.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 bg-gradient-to-br from-green-50 to-blue-50 p-4 flex flex-col items-center justify-center">
                  <div className="w-36 h-36 rounded-full overflow-hidden shadow-lg mb-4 sm:w-48 sm:h-48">
                    <img
                      src={owner.profile_picture_url || "/placeholder.svg"}
                      alt={owner.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 text-center">
                    {owner.name}
                  </h3>
                  <Badge className="mt-2 bg-green-600 text-white">
                    {owner.team_name || "Unassigned"}
                  </Badge>
                  <div className="flex items-center mt-2 text-sm sm:text-base text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {owner.current_location || "Unknown"}
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setEditingOwner(owner)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Bio
                  </Button>
                </div>

                <div className="w-full md:w-2/3 p-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    {owner.team_name || "Unassigned"}
                  </h2>

                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center text-sm sm:text-base">
                      <Calendar className="h-4 w-4 mr-1 text-green-600" />
                      <span className="font-medium">
                        {owner.years_in_league} years in league
                      </span>
                    </div>
                    <div className="flex items-center text-sm sm:text-base">
                      <Trophy className="h-4 w-4 mr-1 text-yellow-600" />
                      <span className="font-medium">
                        {owner.championships} championships
                      </span>
                    </div>
                    <div className="flex items-center text-sm sm:text-base">
                      <Star className="h-4 w-4 mr-1 text-blue-600" />
                      <span className="font-medium">
                        {owner.playoff_appearances} playoff appearances
                      </span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    {owner.favorite_player && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-500" />
                          Favorite Player
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {owner.favorite_player}
                        </p>
                      </div>
                    )}
                    {owner.about && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          About {owner.name.split(" ")[0]}
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {owner.about}
                        </p>
                      </div>
                    )}
                    {owner.story_behind_name && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          The Story Behind "{owner.team_name}"
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {owner.story_behind_name}
                        </p>
                      </div>
                    )}
                    {owner.fun_fact && (
                      <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          Fun Fact
                        </h4>
                        <p className="text-yellow-700">{owner.fun_fact}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xl font-semibold">
                Edit Bio - {editingOwner.name}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingOwner(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* ✅ Profile Picture Upload */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden shadow mb-2">
                <img
                  src={editingOwner.profile_picture_url || "/placeholder.svg"}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="text-sm font-medium text-gray-700 mb-1">
                Update Profile Picture
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, editingOwner.id);
                }}
              />
              {uploading && (
                <p className="text-xs text-gray-500 mt-1 animate-pulse">
                  Uploading...
                </p>
              )}
            </div>

            {/* ✅ Editable Fields */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {[
                "about",
                "story_behind_name",
                "fun_fact",
                "favorite_player",
                "best_finish",
                "current_location",
              ].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {field.replaceAll("_", " ")}
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-md text-sm"
                    rows={2}
                    value={(editingOwner as any)[field] || ""}
                    onChange={(e) =>
                      setEditingOwner({
                        ...editingOwner,
                        [field]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            {/* ✅ Save / Cancel */}
            <div className="flex justify-end gap-3 border-t pt-3">
              <Button variant="outline" onClick={() => setEditingOwner(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-pulse" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
