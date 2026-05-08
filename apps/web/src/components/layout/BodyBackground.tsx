import Image from "next/image";
import bgMagnoliaBirds from "@/assets/bg-sumi-mountain.jpg";

export default function BodyBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ backgroundColor: "#fbf3e2" }}
    >
      <Image
        src={bgMagnoliaBirds}
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        className="object-cover object-center"
      />
    </div>
  );
}
