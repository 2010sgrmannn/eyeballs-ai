export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
        style={{ color: "#FF2D2D" }}
      />
    </div>
  );
}
