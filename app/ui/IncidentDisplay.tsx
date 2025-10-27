import { Incident } from "../api/types";
import { IconText } from "@/app/ui/IconText";

export default function IncidentDisplay(props: Incident)  {

    const onLocationCLick = () => {}

    const onCorroborateClick = () => {}

    const onDiscussClick = () => {}

    return (
    <div className="mb-8">
      <div className="text-xl font-bold my-2">{props.title}</div>

      <div className="text-medium font-medium mb-2">{props.description}</div>

      <div className="flex justify-between">
        <IconText
            iconImage = "./iconText/location.svg"
            onClick = {onLocationCLick}
        >
            <div className="font-thin">
                <u>{"Location"}</u>
            </div>
        </IconText>

        <IconText
          iconImage = "./iconText/news.svg"
          onClick = {onCorroborateClick}
          >
            <div className="font-thin">
                <u>{"Corroborate Crime"}</u>
            </div>
        </IconText>

        <IconText
            iconImage={"./iconText/discuss.svg"}
            onClick = {onDiscussClick}>
            <div className="font-thin">
                <u>{"Discuss Crime"}</u>
            </div>
        </IconText>
      </div>
    </div>
  );
}