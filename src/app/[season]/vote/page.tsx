import VoteClient from "./VoteClient";

export function generateStaticParams() {
  return [
    { season: "season1" },
    { season: "season2" },
  ];
}

export default function VotePage() {
  return <VoteClient />;
}
