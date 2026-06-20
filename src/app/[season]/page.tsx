import OpeningClient from "./OpeningClient";

export function generateStaticParams() {
  return [
    { season: "season2" },
  ];
}

export default function SeasonPage() {
  return <OpeningClient />;
}
