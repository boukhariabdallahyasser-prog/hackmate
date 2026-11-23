"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { ImagePlus, ShieldCheck } from "lucide-react";

export function EventCoverInput() {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.item(0);
    setError("");
    setPreview(null);
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
      event.target.value = "";
      setError("Choose a PNG, JPEG, or WebP image under 3 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="event-cover-input">
      <label htmlFor="cover_image">
        <span className="cover-input-heading"><ImagePlus size={20} aria-hidden="true" /> Upload the event poster</span>
        <span className="cover-input-help">Add the actual organizer poster to make your hackathon stand out. JPG, PNG or WebP, up to 3 MB.</span>
      </label>
      <input
        id="cover_image"
        type="file"
        name="cover_image"
        accept="image/png,image/jpeg,image/webp"
        onChange={chooseImage}
        aria-describedby="cover-privacy"
      />
      {error && <p className="cover-input-error" role="alert">{error}</p>}
      {preview && (
        <div className="event-cover-preview">
          {/* eslint-disable-next-line @next/next/no-img-element -- Local preview uses an object URL. */}
          <img alt="Selected poster preview" src={preview} />
        </div>
      )}
      <p className="cover-input-help" id="cover-privacy"><ShieldCheck size={15} aria-hidden="true" /> Submitted images are public after upload. Only upload artwork you have permission to share.</p>
    </div>
  );
}
