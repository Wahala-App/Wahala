import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export function Button({ children, className, ...otherProps }: ButtonProps) {
    return (
        <button
            {...otherProps}
            className={clsx(
                "bg-foreground text-background px-12 py-2",
                className
            )}>
            {children}
        </button>
    )
}

export function SocialButton({ children, ...otherProps }: ButtonProps) {
    return (
        <button
            {...otherProps}
            className="w-12 h-12 rounded-l hover:bg-hover flex items-center justify-center text-lg"
        >
            {children}
        </button>
    )
}