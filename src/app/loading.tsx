import Loading from "@/components/shared/Loading";

export default function RootLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#0A0A0F",
        width: "100%",
      }}
    >
      <Loading />
    </div>
  );
}
