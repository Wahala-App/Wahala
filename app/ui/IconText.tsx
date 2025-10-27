import clsx from "clsx";
import Image from "next/image";
import {ReactNode} from "react";

interface IconTextProps {
    children: ReactNode,
    iconImage: string;
    iconDescription?: string;
    onClick?: () => void;
    className?: string;
}

export function IconText({
    children,
    iconImage,
    iconDescription = "",
    onClick,
    className,
}: IconTextProps) {
    return (
        <div className={clsx(className, "flex flex-row gap-2 cursor-pointer")} onClick={onClick}>
            <div className={"dark:invert"}>
                <Image
                    src={iconImage}
                    alt={iconDescription}
                    width={20}
                    height={20}/>
            </div>
            <div>
                {children}
            </div>
        </div>
    )
}
