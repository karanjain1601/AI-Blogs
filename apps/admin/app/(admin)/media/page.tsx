import { MediaUploader } from "@/components/MediaUploader";

export const metadata = { title: "Media" };

export default function MediaPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-white mb-2">Media</h1>
      <p className="text-[#8b919a] text-sm mb-6">
        Upload images and files to Supabase Storage. Copy the CDN URL into your
        note blocks.
      </p>
      <MediaUploader />
    </div>
  );
}
