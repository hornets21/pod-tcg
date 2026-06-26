import WheelClient from "./WheelClient";

export function generateStaticParams() {
  return [
    { season: "season1" },
    { season: "season2" },
  ];
}

export default function WheelPage() {
  return <WheelClient />;
}
