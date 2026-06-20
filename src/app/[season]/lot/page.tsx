import LotClient from "./LotClient";

export function generateStaticParams() {
  return [
    { season: "season1" },
    { season: "season2" },
  ];
}

export default function LotPage() {
  return <LotClient />;
}
