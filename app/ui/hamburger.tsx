import clsx from "clsx";

interface HamburgerProps {
  onClick?: () => void;
  className?: string;
}

export default function Hamburger({ onClick, className = "" }: HamburgerProps) {
  return (
    <button
      className={clsx(
        className,
        "flex flex-col items-center justify-center gap-1",
      )}
      onClick={onClick}
    >
      <div className="w-full h-0.5 bg-black"></div>
      <div className="w-full h-0.5 bg-black"></div>
      <div className="w-full h-0.5 bg-black"></div>
    </button>
  );
}
