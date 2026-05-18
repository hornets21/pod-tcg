import CollectionClient from "./CollectionClient";

export function generateStaticParams() {
  return [
    { season: "season1" },
    { season: "season2" },
  ];
}

export default function CollectionPage() {
  return <CollectionClient />;
}
