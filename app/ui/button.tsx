import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}
export function DefaultButton({ children, className, onClick, ...otherProps }: ButtonProps) {
    return (
        <button
            {...otherProps}
            onClick={onClick}
            className={className}
        >
            {children}
        </button>
    )
}

export function PillButton({ children, className, onClick, ...otherProps }: ButtonProps) {
    return (
        <DefaultButton 
            className={clsx(className, "bg-foreground text-background px-12 py-2")}
            onClick={onClick}
            {...otherProps}
        >
            {children}
        </DefaultButton>
    )
}