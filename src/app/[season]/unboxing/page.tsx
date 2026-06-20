import UnboxingClient from "./UnboxingClient";

export function generateStaticParams() {
  return [
    { season: "season2" },
  ];
}

export default function UnboxingPage() {
  return <UnboxingClient />;
}
