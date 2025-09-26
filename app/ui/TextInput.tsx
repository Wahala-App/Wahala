import Image from "next/image";

interface TextInputProps {
    title: string;
    type: "email" | "password" | "search";
    placeholder: string;
}

export function TitledTextInput(props: TextInputProps) {
    const iconURL = props.type === "email" ? "userEmail.svg" : "password.svg";
    
    return (
        <div className="grid grid-rows-2 gap-4 mb-8">
            <div className="font-black"> {props.title} </div>
            <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <Image src={iconURL} alt={"Login Text Logo"} width={20} height={0} />
                </span>
                <input
                    className="rounded-full shadow-md pl-10 pr-4 py-2 border border-gray-200 hover:bg-hover focus:outline-none focus:ring-2 focus:ring-foreground w-full"
                    id={props.title}
                    type={props.type}
                    placeholder={props.placeholder}
                    required/>
            </div>
        </div>
    )
}

export function TextInput(props: TextInputProps) {
    return (
        <div className="mb-8">
            <input
                className="rounded-full shadow-md pl-10 pr-4 py-2 border border-gray-200 hover:bg-hover focus:outline-none focus:ring-2 focus:ring-foreground w-full"
                id={props.placeholder}
                type={props.type}
                placeholder={props.placeholder}
                required/>
        </div>
    )
}