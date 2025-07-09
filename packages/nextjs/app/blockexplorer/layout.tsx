import { getMetadata } from "~~/utils/create-stylus/getMetadata";

export const metadata = getMetadata({
  title: "Block Explorer",
  description: "Block Explorer created with 🏗 create-stylus",
});

const BlockExplorerLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default BlockExplorerLayout;
