import { Camera } from "lucide-react";
import { useState } from "react";

export function Thumb({
  url,
  size = 40,
  className = "",
}: {
  url: string | null;
  size?: number;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground rounded ${className}`}
        style={{ width: size, height: size }}
      >
        <Camera className="h-1/2 w-1/2 opacity-50" />
      </div>
    );
  }
  return (
    <img
      src={url}
      loading="lazy"
      onError={() => setErr(true)}
      alt=""
      className={`object-cover rounded ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
