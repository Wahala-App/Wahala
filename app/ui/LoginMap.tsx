import Image from "next/image";

export default function MapImage() {
  return (
    <div className="w-full h-full relative">
      <Image
        src={"/loginMap.svg"}
        alt={"Login Map"}
        fill
        className="object-cover"
      />
    </div>
  );
}
