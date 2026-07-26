import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { uploadFile, type UploadResult } from "../api";
import { toast } from "sonner";

// A reusable button that opens a file picker and POSTs to /api/upload.
// On success it calls onUploaded with the resolved {url, kind, ...}.
// Used for "upload custom background" and "upload to vault".
export default function UploadButton({
  accept = "image/*,video/*",
  label = "Upload",
  className = "",
  iconOnly = false,
  onUploaded,
  children,
}: {
  accept?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
  onUploaded: (r: UploadResult) => void;
  // When provided, `children` replaces the default Upload icon + label,
  // letting callers render a custom badge (e.g. a Camera icon for the
  // profile picture upload). The busy spinner still takes over while
  // uploading so users get visual feedback regardless.
  children?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file twice still triggers change
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Only image uploads are allowed. The homepage video stays unchanged.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Image too large (8 MB max).");
      return;
    }
    setBusy(true);
    const t = toast.loading(`Uploading ${f.name}…`);
    try {
      const res = await uploadFile(f);
      if ("error" in res) {
        toast.error(res.error, { id: t });
        return;
      }
      toast.success("Upload complete 💕", { id: t });
      onUploaded(res);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onPick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={
          className ||
          "inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-pink-500/15 border border-pink-400/40 text-pink-100 text-xs font-bold tracking-wide uppercase hover:bg-pink-500/30 disabled:opacity-50"
        }
        title={label}
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : children ? (
          children
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />
            {!iconOnly && <span>{label}</span>}
          </>
        )}
      </button>
    </>
  );
}
