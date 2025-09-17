import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
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

export function Button({ children, className, onClick, ...otherProps }: ButtonProps) {
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

export function SocialButton({ children, ...otherProps }: ButtonProps) {
    return (
        <DefaultButton
            {...otherProps}
            className={clsx("w-12 h-12 rounded-l hover:bg-hover flex items-center justify-center text-lg")}
        >
            {children}
        </DefaultButton>
    )
}