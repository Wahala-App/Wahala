import { Incident } from "../api/types";

export default function IncidentDisplay(props: Incident)  {
  return (
    <div className="mb-8">
      <div className="text-xl font-bold my-2">{props.title}</div>

      <div className="text-medium font-medium mb-2">{props.description}</div>

      <div className="flex justify-between">
        <div className="font-thin">
          <u>Location</u>
        </div>{" "}
        {/*TODO: Add link to location*/}
        <div className="font-thin">
          <u>Corroborate Crime</u>
        </div>{" "}
        {/*TODO: Add link to corroborate crime*/}
        <div className="font-thin">
          <u>Discuss</u>
        </div>{" "}
        {/*TODO: Add link to discuss*/}
      </div>
    </div>
  );
}