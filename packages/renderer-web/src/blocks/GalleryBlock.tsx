import type { GalleryBlock as GalleryBlockType } from "@notes/blocks";

export function GalleryBlock({ block }: { block: GalleryBlockType }) {
  return (
    <div className="nb-gallery">
      {block.images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={img.src} alt={img.alt} loading="lazy" />
      ))}
    </div>
  );
}
